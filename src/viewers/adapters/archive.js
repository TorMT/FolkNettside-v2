import {getJSZip} from "../../vendor/jszip.js?v=50c68e9814ca75ca5044d7ab96c2b875b9e950a2";
import {escapeHTML} from "../utils.js?v=50c68e9814ca75ca5044d7ab96c2b875b9e950a2";
export async function render(container,resource){
 const path=resource.url||resource.path;
 const response=await fetch(path);
 if(!response.ok)throw new Error("Archive HTTP "+response.status);
 const buffer=await response.arrayBuffer();
 if(buffer.byteLength>80_000_000)throw new Error("Archive exceeds browser preview limit (80 MB). Download it instead.");
 const JSZip=await getJSZip();
 let zip;
 try{zip=await JSZip.loadAsync(buffer)}
 catch{throw new Error("Could not read ZIP archive. Download to inspect with a desktop application.")}
 const entries=Object.values(zip.files).filter(entry=>!entry.dir);
 const list=entries.slice(0,3000);
 container.innerHTML=`<section class="archive-viewer">
   <div class="archive-viewer-head"><strong>Archive contents</strong>
     <span>${entries.length} files${entries.length>list.length?" · showing first 3000":""}</span></div>
   <input class="archive-viewer-search" type="search" placeholder="Filter filenames" aria-label="Filter archive">
   <div class="archive-viewer-scroll"><table class="data-table"><thead><tr><th>File</th><th>Size</th><th>Action</th></tr></thead><tbody></tbody></table></div>
   <p class="muted">Files are only extracted when clicked. Do not run code from unknown archives.</p>
 </section>`;
 const tbody=container.querySelector("tbody"),filter=container.querySelector("input");
 const blobUrls=new Set();
 const fmt=size=>size!=null?(size/1024).toFixed(1)+" KiB":"—";
 function draw(){
   const term=filter.value.toLocaleLowerCase();
   const visible=list.map((entry,index)=>({entry,index})).filter(
     row=>row.entry.name.toLocaleLowerCase().includes(term)).slice(0,500);
   tbody.innerHTML=visible.map(({entry,index})=>`<tr>
      <td>${escapeHTML(entry.name)}</td><td>${fmt(entry._data?.uncompressedSize)}</td>
      <td><button data-archive-index="${index}" type="button">Extract</button></td></tr>`).join("");
   if(!visible.length)tbody.innerHTML='<tr><td colspan="3">No matching files</td></tr>';
 }
 filter.addEventListener("input",draw);
 const extract=async event=>{
   const btn=event.target.closest("[data-archive-index]");
   if(!btn)return;
   const entry=list[Number(btn.dataset.archiveIndex)];
   if(!entry)return;
   const size=entry._data?.uncompressedSize;
   if(!Number.isFinite(size)||size>12_000_000){btn.textContent="Too large";return}
   btn.disabled=true;btn.textContent="Extracting…";
   try{
     const blob=await entry.async("blob");
     if(blob.size>12_000_000)throw new Error("Too large");
     const url=URL.createObjectURL(blob);blobUrls.add(url);
     const link=document.createElement("a");link.href=url;
     link.download=entry.name.split("/").pop()||"archive-file";
     link.click();btn.textContent="Downloaded";
   }catch{btn.textContent="Could not extract"}
   finally{btn.disabled=false}
 };
 tbody.addEventListener("click",extract);draw();
 return {info:`ZIP archive · ${entries.length} files · searchable inventory`,
   cleanup:()=>{tbody.removeEventListener("click",extract);for(const url of blobUrls)URL.revokeObjectURL(url)}};
}
