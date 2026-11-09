import {filterPhotoAlbums,publishedAlbums} from "./photo-feed-model.js";

const MANIFEST="./data/diverse/photo-feed.json";
const SOURCE="https://drive.google.com/drive/folders/1lBkBhTHl7CkVoAaUgWn2RAtKZXqRre3k";
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export function photoFeedPageHTML(){
  return '<main class="diverse-page photo-page">'+
    '<header class="diverse-hero photo-hero"><div><span class="project-kicker">Diverse / Galleri</span><h1>Bilder</h1>'+
    '<p>Fotofeed med ett innlegg per Google Drive-mappe. Bla mellom bildene i hver karusell.</p></div>'+
    '<div class="legacy-diverse-actions"><button class="btn" type="button" data-photo-back>Til Diverse</button>'+
    '<a class="btn" href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Åpne Bilder i Drive ↗</a></div></header>'+
    '<section class="photo-shell" aria-label="Fotofeed"><div class="photo-toolbar">'+
    '<label>Søk<input id="photo-search" type="search" autocomplete="off" placeholder="Søk i mapper og bildetitler …"></label>'+
    '<label>Kategori<select id="photo-category"><option value="">Alle mapper</option></select></label>'+
    '<label>Sortering<select id="photo-sort"><option value="new">Nyeste først</option><option value="alpha">Alfabetisk</option></select></label>'+
    '<button class="btn" type="button" data-photo-refresh>Oppdater</button></div>'+
    '<p class="photo-info" id="photo-info" role="status" aria-live="polite">Leser album fra Google Drive …</p>'+
    '<div class="photo-feed" id="photo-feed"></div>'+
    '<p class="photo-source">Kilde: <a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">FolkNettside / Bilder</a>. Kun offentlig tilgjengelige bilder kan vises. Nye mapper vises ved neste indeksoppdatering.</p>'+
    '</section><dialog class="photo-lightbox" id="photo-lightbox" aria-label="Bilde i fullskjerm">'+
    '<div id="photo-lightbox-body"></div></dialog></main>';
}

export function mountPhotoFeed(root,{onBack=()=>{}}={}){
  const page=root.querySelector(".photo-page");
  if(!page)return {cleanup(){}};
  const feed=page.querySelector("#photo-feed"),info=page.querySelector("#photo-info");
  const category=page.querySelector("#photo-category"),search=page.querySelector("#photo-search"),sort=page.querySelector("#photo-sort");
  const dialog=page.querySelector("#photo-lightbox"),modal=page.querySelector("#photo-lightbox-body");
  const controller=new AbortController(),signal=controller.signal;
  let albums=[],disposed=false,selected=null,loadController=null;
  const positions=new Map();

  function refreshCategory(){
    const prev=category.value;
    const categories=[...new Set(albums.map(a=>a.category))].sort((a,b)=>a.localeCompare(b,"nb"));
    category.replaceChildren(new Option("Alle mapper",""),...categories.map(name=>new Option(name,name)));
    category.value=categories.includes(prev)?prev:"";
  }
  function figure(album,i){
    const photo=album.photos[i];
    return '<img loading="lazy" decoding="async" src="'+esc(photo.src)+'" alt="'+esc(photo.name)+'" draggable="false">';
  }
  function albumHTML(album){
    const i=Math.min(positions.get(album.id)||0,album.photos.length-1);
    positions.set(album.id,i);
    const photo=album.photos[i],many=album.photos.length>1;
    return '<article class="photo-post" data-photo-album="'+esc(album.id)+'" tabindex="0" aria-label="Album '+esc(album.title)+'">'+
      '<div class="photo-post-head"><div class="photo-post-avatar" aria-hidden="true">▧</div>'+
      '<div class="photo-post-heading"><h2>'+esc(album.title)+'</h2><span>'+album.photos.length+' '+(album.photos.length===1?'bilde':'bilder')+' · Google Drive</span></div>'+
      '<a href="'+esc(SOURCE)+'" target="_blank" rel="noopener noreferrer" class="photo-post-source">Drive ↗</a></div>'+
      '<div class="photo-stage"><button type="button" class="photo-open" data-photo-open aria-label="Vis '+esc(photo.name)+' i fullskjerm">'+figure(album,i)+'</button>'+
      (many?'<button class="photo-arrow previous" type="button" data-photo-step="-1" aria-label="Forrige bilde" '+(i===0?'disabled':'')+'>‹</button>'+
      '<button class="photo-arrow next" type="button" data-photo-step="1" aria-label="Neste bilde" '+(i===album.photos.length-1?'disabled':'')+'>›</button>':'')+
      '<span class="photo-counter" aria-live="polite">'+(i+1)+' / '+album.photos.length+'</span></div>'+
      '<div class="photo-post-footer"><div class="photo-dots" aria-label="Velg bilde">'+
      (many?album.photos.map((p,k)=>'<button class="photo-dot '+(k===i?'active':'')+'" type="button" data-photo-index="'+k+'" aria-label="Bilde '+(k+1)+'" aria-current="'+(k===i)+'"></button>').join(''):'')+
      '</div><strong>'+esc(album.title)+'</strong><span class="photo-file-name">'+esc(photo.name)+'</span>'+
      '<a class="photo-original" href="'+esc(photo.original)+'" target="_blank" rel="noopener noreferrer">Original i Drive ↗</a></div></article>';
  }
  function render(){
    if(disposed)return;
    const visible=filterPhotoAlbums(albums,{category:category.value,query:search.value,sort:sort.value});
    info.textContent=visible.length+' album · '+visible.reduce((n,a)=>n+a.photos.length,0)+' bilder';
    feed.innerHTML=visible.length?visible.map(albumHTML).join(''):
      '<div class="photo-empty"><strong>Ingen bilder funnet</strong><p>Legg bilder i undermapper under Bilder på Google Drive, eller prøv et annet filter. Tomme mapper skjules.</p></div>';
  }
  function findAlbum(id){return albums.find(a=>a.id===id);}
  function updateAlbumCard(album){
    const existing=[...feed.querySelectorAll("[data-photo-album]")].find(el=>el.dataset.photoAlbum===album.id);
    if(existing)existing.outerHTML=albumHTML(album);
  }
  function move(album,step){
    const index=positions.get(album.id)||0;
    const next=Math.max(0,Math.min(album.photos.length-1,index+step));
    if(next===index)return;
    positions.set(album.id,next);
    updateAlbumCard(album);
    if(selected===album.id)showModal();
  }
  function showModal(){
    const album=findAlbum(selected);
    if(!album)return;
    const index=positions.get(album.id)||0,photo=album.photos[index];
    modal.innerHTML='<div class="photo-modal-head"><strong>'+esc(album.title)+'</strong>'+
      '<button type="button" class="photo-modal-close" data-photo-close aria-label="Lukk">×</button></div>'+
      '<div class="photo-modal-image"><img src="'+esc(photo.src)+'" alt="'+esc(photo.name)+'">'+
      (index>0?'<button class="photo-modal-arrow left" type="button" data-photo-modal-step="-1" aria-label="Forrige bilde">‹</button>':'')+
      (index<album.photos.length-1?'<button class="photo-modal-arrow right" type="button" data-photo-modal-step="1" aria-label="Neste bilde">›</button>':'')+'</div>'+
      '<div class="photo-modal-footer"><span>'+esc(photo.name)+' · '+(index+1)+'/'+album.photos.length+'</span>'+
      '<a href="'+esc(photo.original)+'" target="_blank" rel="noopener noreferrer">Original i Drive ↗</a></div>';
    if(!dialog.open)dialog.showModal();
    modal.querySelector("[data-photo-close]")?.focus({preventScroll:true});
  }
  async function load(){
    loadController?.abort();
    const ctl=new AbortController();loadController=ctl;
    info.textContent="Oppdaterer bildegalleriet …";
    try{
      const response=await fetch(MANIFEST,{cache:"no-store",signal:ctl.signal});
      if(!response.ok)throw Error("HTTP "+response.status);
      const payload=await response.json();
      if(disposed||ctl.signal.aborted)return;
      albums=publishedAlbums(payload);
      refreshCategory();render();
    }catch(error){
      if(disposed||ctl.signal.aborted)return;
      info.textContent="Kunne ikke laste bildegalleriet: "+String(error.message||error);
      feed.innerHTML='<div class="photo-empty"><strong>Galleriet er midlertidig utilgjengelig.</strong><p>Prøv Oppdater eller åpne mappen i Google Drive.</p></div>';
    }
  }
  page.querySelector("[data-photo-back]")?.addEventListener("click",onBack,{signal});
  page.querySelector("[data-photo-refresh]")?.addEventListener("click",load,{signal});
  for(const control of [search,sort,category])control.addEventListener(control===search?"input":"change",render,{signal});
  feed.addEventListener("click",event=>{
    const el=event.target.closest("[data-photo-step],[data-photo-index],[data-photo-open]");
    if(!el)return;
    const post=el.closest("[data-photo-album]"),album=findAlbum(post?.dataset.photoAlbum);
    if(!album)return;
    if(el.hasAttribute("data-photo-step"))move(album,Number(el.dataset.photoStep));
    if(el.hasAttribute("data-photo-index")){positions.set(album.id,Number(el.dataset.photoIndex));updateAlbumCard(album);}
    if(el.hasAttribute("data-photo-open")){selected=album.id;showModal();}
  },{signal});
  feed.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight"].includes(event.key)||event.target.closest("a,input"))return;
    const album=findAlbum(event.target.closest("[data-photo-album]")?.dataset.photoAlbum);
    if(album){event.preventDefault();move(album,event.key==="ArrowRight"?1:-1);}
  },{signal});
  const starts=new WeakMap();
  feed.addEventListener("touchstart",event=>{
    const post=event.target.closest("[data-photo-album]");
    if(post&&event.touches.length===1)starts.set(post,{x:event.touches[0].clientX,y:event.touches[0].clientY});
  },{passive:true,signal});
  feed.addEventListener("touchend",event=>{
    const post=event.target.closest("[data-photo-album]"),begin=post&&starts.get(post);
    if(!begin||!event.changedTouches.length)return;
    starts.delete(post);
    const dx=event.changedTouches[0].clientX-begin.x,dy=event.changedTouches[0].clientY-begin.y;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3){
      const album=findAlbum(post.dataset.photoAlbum);
      if(album)move(album,dx<0?1:-1);
    }
  },{passive:true,signal});
  modal.addEventListener("click",event=>{
    if(event.target===dialog||event.target.closest("[data-photo-close]")){dialog.close();return;}
    const button=event.target.closest("[data-photo-modal-step]");
    if(button&&selected){const album=findAlbum(selected);if(album)move(album,Number(button.dataset.photoModalStep));}
  },{signal});
  dialog.addEventListener("close",()=>{selected=null;},{signal});
  dialog.addEventListener("keydown",event=>{
    if(!selected)return;
    const album=findAlbum(selected);
    if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();if(album)move(album,event.key==="ArrowLeft"?-1:1);}
  },{signal});
  load();
  return {cleanup(){disposed=true;loadController?.abort();controller.abort();if(dialog.open)dialog.close();}};
}
