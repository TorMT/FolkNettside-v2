// Pure data helpers for the Diverse photo feed. No Drive credentials in public files.
const IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif","image/bmp"]);
const ID=/^[A-Za-z0-9_-]{10,160}$/;

export function parseDriveFolderId(value){
  const text=String(value||"").trim();
  if(ID.test(text))return text;
  try{
    const url=new URL(text);
    if(url.protocol!=="https:"||url.hostname!=="drive.google.com")return "";
    const match=url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,160})\/?$/);
    return match?match[1]:"";
  }catch{return "";}
}

export function photoFromDrive(file){
  if(!file||!ID.test(String(file.id||""))||!IMAGE_TYPES.has(file.mimeType))return null;
  if(file.size!==undefined&&file.size!==null&&Number(file.size)>25_000_000)return null;
  return {
    id:file.id,
    name:String(file.name||"Bilde").slice(0,180),
    mimeType:file.mimeType,
    modifiedTime:String(file.modifiedTime||""),
    source:"drive"
  };
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

// Only already-reviewed same-origin public assets can appear without signing in.
// Drive IDs and private Drive URLs must never be written into this manifest.
export function publishedAlbums(payload){
  if(!payload||payload.schema!==1||!Array.isArray(payload.albums)||payload.albums.length>100)return [];
  return payload.albums.map((album,index)=>{
    const title=String(album?.title||"").trim().slice(0,160);
    if(!title||!Array.isArray(album.images))return null;
    const photos=album.images.slice(0,100).map((entry,i)=>{
      const path=String(entry?.src||"");
      if(!/^\.\/assets\/gallery\/[A-Za-z0-9_./%-]+$/.test(path)||path.includes(".."))return null;
      return {id:"public-"+index+"-"+i,name:String(entry.alt||title).slice(0,180),src:path,source:"public"};
    }).filter(Boolean);
    return photos.length?{id:"public-"+index,title,category:title,photos,source:"public",modifiedTime:String(album.date||"")} :null;
  }).filter(Boolean).sort((a,b)=>b.modifiedTime.localeCompare(a.modifiedTime));
}

export function filterPhotoAlbums(albums,{category="",query="",sort="new"}={}){
  const q=String(query).trim().toLocaleLowerCase("nb");
  const result=(Array.isArray(albums)?albums:[]).filter(a=>{
    return (!category||a.category===category)&&(!q||a.title.toLocaleLowerCase("nb").includes(q)||
      a.photos.some(p=>p.name.toLocaleLowerCase("nb").includes(q)));
  });
  return [...result].sort((a,b)=>sort==="alpha"?a.title.localeCompare(b.title,"nb"):
    b.modifiedTime.localeCompare(a.modifiedTime)||a.title.localeCompare(b.title,"nb"));
}
