import {escapeHTML,previewContentURL} from "../utils.js?v=9381df14d503bbbe82d8b77c2584a1d5d5f823ba";
export async function render(container,resource){
  const path=previewContentURL(resource);
  if(!path)throw new Error("Audio file has no source URL");
  container.innerHTML=`<section class="media-viewer audio-viewer">
    <strong>${escapeHTML(resource.label||resource.name||"Audio")}</strong>
    <audio controls preload="metadata" src="${escapeHTML(path)}"></audio>
    <p class="media-viewer-note" role="status">Play, pause and seek using the audio controls. Browser codec support varies.</p>
    <a href="${escapeHTML(path)}" download>Save audio</a>
  </section>`;
  const audio=container.querySelector("audio");
  audio.addEventListener("error",()=>container.querySelector(".media-viewer-note").textContent=
    "This audio codec could not be decoded by your browser. Download the original file.");
  return {info:"Audio · playback and download",
    cleanup(){audio.pause();audio.removeAttribute("src");audio.load()}};
}
