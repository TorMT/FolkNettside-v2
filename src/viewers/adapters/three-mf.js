import {escapeHTML} from "../utils.js";
import {getJSZip} from "../../vendor/jszip.js";

function readObjects(document){
  return [...document.getElementsByTagNameNS("*","object")].map(object=>({
    id:object.getAttribute("id"),
    name:object.getAttribute("name") || `Object ${object.getAttribute("id")}`,
    componentRefs:[...object.getElementsByTagNameNS("*","component")].map(component=>({
      objectId:component.getAttribute("objectid"),
      transform:component.getAttribute("transform") || null
    }))
  }));
}

export async function render(container,resource){
  const JSZip=await getJSZip();
  const response=await fetch(resource.path);
  if(!response.ok) throw new Error(`HTTP ${response.status}`);

  const zip=await JSZip.loadAsync(await response.arrayBuffer());
  const modelPath=Object.keys(zip.files).find(name=>name.toLowerCase().endsWith(".model"));
  if(!modelPath) throw new Error("3MF archive contains no .model document");

  const xml=await zip.file(modelPath).async("text");
  const document=new DOMParser().parseFromString(xml,"application/xml");
  if(document.querySelector("parsererror")) throw new Error("Could not parse 3MF model XML");

  const objects=readObjects(document);
  const buildItems=[...document.getElementsByTagNameNS("*","item")].map(item=>({
    objectId:item.getAttribute("objectid"),
    transform:item.getAttribute("transform") || "identity"
  }));

  container.innerHTML=`<div class="notebook">
    <h2>3MF assembly</h2>
    <p class="muted">Archive parsed lazily; object/component/build identity is preserved for the future semantic model.</p>
    <div class="resource-list">${objects.map(object=>`
      <div class="resource-row">
        <span class="file-icon">3D</span>
        <div><strong>${escapeHTML(object.name)}</strong><div class="muted">object ${escapeHTML(object.id)} · ${object.componentRefs.length} child reference(s)</div></div>
        <span>${buildItems.filter(item=>item.objectId===object.id).length} build instance(s)</span>
      </div>`).join("")}</div>
    <h3>Build instances</h3>
    <pre>${escapeHTML(buildItems.map(item=>`object ${item.objectId}: ${item.transform}`).join("\n"))}</pre>
  </div>`;

  return {info:`${objects.length} objects · ${buildItems.length} build instances`};
}
