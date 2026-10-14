import {safeOriginalFileURL} from "../utils.js";

export async function render(container,resource){
  const original=safeOriginalFileURL(resource);
  if(!original)throw Error("Invalid PDF location");
  const frame=document.createElement("iframe");
  frame.className="pdf-frame";
  frame.src=original;
  frame.title=resource.label||resource.name||"PDF";
  frame.setAttribute("referrerpolicy","no-referrer");
  if(resource.remoteArchive===true){
    const shell=document.createElement("div");
    shell.className="pdf-remote-viewer";
    const note=document.createElement("div");
    note.className="pdf-remote-hint";
    note.append(document.createTextNode("PDF fra NTNU. Hvis nettleseren blokkerer forhåndsvisningen: "));
    const link=document.createElement("a");
    link.href=original;
    link.target="_blank";
    link.rel="noopener noreferrer";
    link.textContent="Åpne PDF direkte ↗";
    note.append(link);
    shell.append(note,frame);
    container.replaceChildren(shell);
  }else container.replaceChildren(frame);
  return {info:resource.remoteArchive?
    "PDF · ekstern NTNU-visning (direkte lenke tilgjengelig)":
    "Native browser PDF renderer"};
}
