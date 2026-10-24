/**
 * Constrained native NTNU iframe fallback for publicly indexed text/code files.
 * A sandboxed frame cannot read across origins into the V2 app and cannot
 * run scripts. This is NOT a bypass for JS fetch/CORS or protected content.
 */
const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
const SAFE_VIEWER_KINDS=new Set(["python","text","csv","latex","notebook"]);
const DISALLOWED=/beskyttet|protected|private|privat|restricted|hemmelig|secret|credential|passord|password|token|\.env|\.htaccess/i;

export function remoteReadOnlyFallbackURL(resource,kind){
  if(resource?.remoteArchive!==true||resource.source!=="ntnu"||
     !SAFE_VIEWER_KINDS.has(kind)||typeof resource.url!=="string")return null;
  try{
    const url=new URL(resource.url);
    if(url.origin!==NTNU_ORIGIN||url.username||url.password||url.search||url.hash||
      url.protocol!=="https:"||url.href!==resource.url)return null;
    const raw=url.pathname.split("/").slice(1);
    if(raw.length<5||raw[0]!=="semestre"||!/^(?:[1-9]|1\d|20)$/.test(raw[1])||
       !["filer","quiz"].includes(raw[3]))return null;
    const segments=raw.slice(2).map(part=>decodeURIComponent(part));
    if(segments.some(part=>!part||part==="."||part===".."||part.startsWith(".")||
       part.startsWith("~$")||DISALLOWED.test(part)||
       /[\/\\%?#\u0000-\u001f\u007f]/.test(part)))return null;
    const filename=segments.at(-1);
    if(!/\.(?:py|ipynb|txt|md|csv|tsv|psv|tex|json|js|mjs|css|log)$/i.test(filename))return null;
    return url.href;
  }catch{return null}
}
