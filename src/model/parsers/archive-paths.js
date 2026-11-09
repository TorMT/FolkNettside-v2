/** Operating-system bookkeeping that ends up inside user-made ZIP archives.
 *
 * macOS "Compress" adds `__MACOSX/._name` AppleDouble stubs next to every
 * file; Windows adds `Thumbs.db` / `desktop.ini`. They carry the real file's
 * extension (`._hull.stl`) but are not geometry or thumbnails, so treating
 * them as candidates made F3Z/ZIP imports pick a resource-fork stub.
 */
const JUNK_NAMES=new Set([".ds_store","thumbs.db","desktop.ini"]);

export function isArchiveJunk(path){
  const parts=String(path||"").replace(/\\/g,"/").split("/").filter(Boolean);
  if(!parts.length)return false;
  if(parts.includes("__MACOSX"))return true;
  const base=parts[parts.length-1];
  return base.startsWith("._")||JUNK_NAMES.has(base.toLowerCase());
}

export const withoutArchiveJunk=(paths=[])=>paths.filter(path=>!isArchiveJunk(path));
