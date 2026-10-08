// Small reusable grid splitter. The viewport stays fluid, the result panel
// scrolls independently, and its size is never persisted across sessions.
export function mountWorkspaceResultsResize(workspace){
  if(!workspace||!workspace.querySelector(".results"))return ()=>{};
  const results=workspace.querySelector(".results");
  const handle=document.createElement("button");
  handle.type="button";handle.className="workspace-results-handle";
  handle.setAttribute("aria-label","Resize Engineering result area");
  handle.title="Drag to resize results · arrow keys adjust height · Home resets";
  results.prepend(handle);
  const computeSize=()=>{
    const rows=window.getComputedStyle(workspace).gridTemplateRows.split(" ").map(parseFloat);
    return rows.length===4&&Number.isFinite(rows[2])?rows[2]:results.getBoundingClientRect().height;
  };
  const setSize=pixels=>{
    const available=workspace.clientHeight-125;
    const clamped=Math.max(190,Math.min(Math.max(190,available),pixels));
    workspace.style.setProperty("--workspace-results-size",clamped+"px");
  };
  let startY=0,startSize=0,dragging=false;
  const move=event=>{if(!dragging)return;setSize(startSize+startY-event.clientY)};
  const stop=event=>{
    if(!dragging)return;dragging=false;
    handle.releasePointerCapture?.(event.pointerId);
  };
  handle.addEventListener("pointerdown",event=>{
    if(event.button!==0)return;
    dragging=true;startY=event.clientY;startSize=computeSize();
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointermove",move);
  handle.addEventListener("pointerup",stop);
  handle.addEventListener("pointercancel",stop);
  handle.addEventListener("keydown",event=>{
    if(event.key==="Home"){
      workspace.style.removeProperty("--workspace-results-size");event.preventDefault();return;
    }
    if(event.key==="ArrowUp"||event.key==="ArrowDown"){
      setSize(computeSize()+(event.key==="ArrowUp"?32:-32));event.preventDefault();
    }
  });
  return ()=>{handle.remove();workspace.style.removeProperty("--workspace-results-size")};
}
