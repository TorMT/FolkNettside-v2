/**
 * Gracefully handle image fetch failures from the existing NTNU engineering
 * portfolio. Never replace a missing image with an unrelated stock image, and
 * never claim that a URL was verified just because an <img> element exists.
 *
 * Capture-phase delegation is essential: resource "error" events on <img>
 * do not bubble. Install once on the app root so route rerenders work.
 */
export function bindProjectImageFallback(root){
  if(!root?.addEventListener)return ()=>{};
  const onImageError=event=>{
    const img=event.target;
    if(!img?.matches?.('img[data-project-image]'))return;
    const kind=img.dataset.projectImage;
    if(kind!=="card"&&kind!=="gallery")return;
    const parent=kind==="gallery"
      ?img.closest(".project-gallery-item")
      :img.closest(".project-art");
    const fallback=parent?.querySelector("[data-project-image-fallback]");
    if(!fallback)return;
    fallback.hidden=false;
    if(kind==="gallery"){
      // A link to an already-failed image would otherwise remain a dead action.
      const link=img.closest("a");
      if(link&&parent.contains(link))link.remove();
      else img.remove();
    }else img.remove();
  };
  root.addEventListener("error",onImageError,true);
  return ()=>root.removeEventListener("error",onImageError,true);
}
