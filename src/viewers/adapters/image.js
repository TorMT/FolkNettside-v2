import {escapeHTML} from "../utils.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
export async function render(container,resource){
  const path=resource.url||resource.path;
  if(!path)throw new Error("Image file has no source URL");
  container.innerHTML=`<div class="media-viewer image-viewer">
    <div class="media-viewer-actions">
      <button type="button" data-image-fit aria-pressed="true">Fit to view</button>
      <button type="button" data-image-native>100%</button>
      <button type="button" data-image-rotate>Rotate 90°</button>
      <a href="${escapeHTML(path)}" download>Save image</a>
    </div>
    <div class="image-viewer-stage"><img alt="${escapeHTML(resource.label||resource.name||"Image")}" src="${escapeHTML(path)}"></div>
    <p class="media-viewer-note" role="status"></p>
  </div>`;
  const image=container.querySelector("img"),status=container.querySelector(".media-viewer-note");
  const fit=container.querySelector("[data-image-fit]");
  let rotation=0;
  image.addEventListener("load",()=>{
    status.textContent=`${image.naturalWidth} × ${image.naturalHeight} px`;
  });
  image.addEventListener("error",()=>{status.textContent="This browser could not decode the image. Use Open original or Save image."});
  fit.addEventListener("click",()=>{
    image.classList.remove("is-native");fit.setAttribute("aria-pressed","true");
  });
  container.querySelector("[data-image-native]").addEventListener("click",()=>{
    image.classList.add("is-native");fit.setAttribute("aria-pressed","false");
  });
  container.querySelector("[data-image-rotate]").addEventListener("click",()=>{
    rotation=(rotation+90)%360;image.style.transform=`rotate(${rotation}deg)`;
  });
  return {info:"Image · fit, original size and rotation",actions:{
    fit(){image.classList.remove("is-native")},
    resetZoom(){image.classList.remove("is-native");image.style.transform="";rotation=0}
  }};
}
