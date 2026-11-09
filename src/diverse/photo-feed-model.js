const IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif"]);
const ID=/^[A-Za-z0-9_-]{10,160}$/;

export function photoFromDrive(file){
  if(!file||!ID.test(String(file.id||""))||!IMAGE_TYPES.has(file.mimeType))return null;
  if(file.size!==undefined&&file.size!==null&&Number(file.size)>25_000_000)return null;
  return {id:file.id,name:String(file.name||"Bilde").slice(0,180),mimeType:file.mimeType,modifiedTime:String(file.modifiedTime||""),source:"drive"};
}

export function albumsFromFolders(folders){
  if(!Array.isArray(folders))return [];
  const seen=new Set();
  return folders.map(folder=>{
    if(!folder||!ID.test(String(folder.id||""))||seen.has(folder.id))return null;
    seen.add(folder.id);
    const photoIds=new Set();
    const photos=(Array.isArray(folder.files)?folder.files:[]).map(photoFromDrive).filter(photo=>{
      if(!photo||photoIds.has(photo.id))return false;
      photoIds.add(photo.id);return true;
    }).sort((a,b)=>a.name.localeCompare(b.name,"nb",{numeric:true}));
    if(!photos.length)return null;
    const title=String(folder.name||"Bilder").trim().slice(0,160)||"Bilder";
    const modifiedTime=photos.map(p=>p.modifiedTime).sort().at(-1)||"";
    return {id:folder.id,title,category:title,photos,modifiedTime,source:"drive"};
  }).filter(Boolean).sort((a,b)=>b.modifiedTime.localeCompare(a.modifiedTime)||a.title.localeCompare(b.title,"nb"));
}

export function publishedAlbums(payload){
  if(!payload||payload.schema!==1||!Array.isArray(payload.albums)||payload.albums.length>100)return [];
  return payload.albums.map((album,index)=>{
    const title=String(album?.title||"").trim().slice(0,160);
    if(!title||!Array.isArray(album.images))return null;
    const photos=album.images.slice(0,100).map((entry,i)=>{
      const id=String(entry?.id||"");
      if(!ID.test(id))return null;
      return {
        id,name:String(entry?.name||entry?.alt||title).slice(0,180),
        src:"https://drive.google.com/thumbnail?id="+encodeURIComponent(id)+"&sz=w1600",
        original:"https://drive.google.com/file/d/"+encodeURIComponent(id)+"/view",
        source:"drive-public"
      };
    }).filter(Boolean);
    return photos.length?{id:ID.test(String(album?.id||""))?album.id:"album-"+index,title,category:title,
      photos,source:"drive-public",modifiedTime:String(album.date||"")} :null;
  }).filter(Boolean).sort((a,b)=>b.modifiedTime.localeCompare(a.modifiedTime)||a.title.localeCompare(b.title,"nb"));
}

export function filterPhotoAlbums(albums,{category="",query="",sort="new"}={}){
  const q=String(query).trim().toLocaleLowerCase("nb");
  const result=(Array.isArray(albums)?albums:[]).filter(a=>
    (!category||a.category===category)&&(!q||a.title.toLocaleLowerCase("nb").includes(q)||
      a.photos.some(p=>p.name.toLocaleLowerCase("nb").includes(q))));
  return [...result].sort((a,b)=>sort==="alpha"?a.title.localeCompare(b.title,"nb"):
    b.modifiedTime.localeCompare(a.modifiedTime)||a.title.localeCompare(b.title,"nb"));
}

/** Four simultaneous images per carousel view, including the final view. */
export function photoCarouselWindow(photoCount,page=0){
  const count=Number.isFinite(photoCount)?Math.max(0,Math.floor(photoCount)):0;
  const pages=Math.max(1,Math.ceil(count/4));
  const safePage=Number.isFinite(page)?Math.max(0,Math.min(pages-1,Math.floor(page))):0;
  const start=Math.min(safePage*4,Math.max(0,count-4));
  return {page:safePage,pages,start,end:Math.min(count,start+4)};
}
