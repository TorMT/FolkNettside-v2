import {solveFrame2D} from "../structure/frame2d.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";

let fixturePromise;

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
export function loadStructureFixture(path="./examples/engineering/cantilever-frame.json"){
  if(!fixturePromise){
    fixturePromise=fetch(path).then(response=>{
      if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
      return response.json();
    });
  }
  return fixturePromise;
}
export function evaluateStructureCase(baseCase,{loadFy}={}){
  const model=JSON.parse(JSON.stringify(baseCase));
  if(model.loads?.length&&Number.isFinite(Number(loadFy)))model.loads[0].fy=Number(loadFy);
  return {model,result:solveFrame2D(model)};
}

function frameSVG(model,result,width=760,height=340){
  const xs=model.nodes.map(n=>n.x),ys=model.nodes.map(n=>n.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const span=Math.max(maxX-minX,maxY-minY,1);
  const pad=42,scale=Math.min((width-2*pad)/Math.max(maxX-minX,.2),(height-2*pad)/Math.max(maxY-minY,.2));
  const maxDisp=Math.max(...result.nodes.map(n=>Math.hypot(n.ux,n.uy)),1e-12);
  const deformScale=Math.min(span*.24/maxDisp,500);
  const point=(node,deformed=false)=>{
    const r=result.nodes.find(item=>String(item.id)===String(node.id));
    const x=node.x+(deformed?(r?.ux||0)*deformScale:0),y=node.y+(deformed?(r?.uy||0)*deformScale:0);
    return [pad+(x-minX)*scale,height-pad-(y-minY)*scale];
  };
  const original=model.elements.map(element=>{
    const a=model.nodes.find(n=>String(n.id)===String(element.n1)),b=model.nodes.find(n=>String(n.id)===String(element.n2));
    const p1=point(a),p2=point(b);
    return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="var(--line-strong)" stroke-width="3" stroke-dasharray="7 6"/>`;
  }).join("");
  const deformed=model.elements.map(element=>{
    const a=model.nodes.find(n=>String(n.id)===String(element.n1)),b=model.nodes.find(n=>String(n.id)===String(element.n2));
    const p1=point(a,true),p2=point(b,true);
    return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/>`;
  }).join("");
  const nodes=model.nodes.map(node=>{const p=point(node,true);return `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/>`}).join("");
  return `<svg class="structure-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Frame deformation">${original}${deformed}${nodes}<text x="${pad}" y="24" fill="var(--ink-2)" font-size="12">deformation scale ×${deformScale.toFixed(1)}</text></svg>`;
}

export function structurePanelHTML(baseCase,{loadFy}={}){
  const {model,result}=evaluateStructureCase(baseCase,{loadFy});
  const root=result.nodes[0],tip=result.nodes[result.nodes.length-1],element=model.elements[0],er=result.elements[0];
  const fy=Number(model.loads?.[0]?.fy)||0;
  return {
    inspector:`
      <h3>2D frame case</h3>
      <label class="field"><span>Tip transverse load</span><div><input id="structure-load" type="number" step="1" value="${fy/1000}"><span> kN</span></div></label>
      <div class="readout"><span>E</span><strong>${(element.E/1e9).toFixed(1)} GPa</strong></div>
      <div class="readout"><span>A</span><strong>${element.A.toExponential(3)} m²</strong></div>
      <div class="readout"><span>I</span><strong>${element.I.toExponential(3)} m⁴</strong></div>
      <div class="readout"><span>Length</span><strong>${er.length.toFixed(3)} m</strong></div>
      <p class="muted hydro-note">Euler–Bernoulli 2D frame element with axial and bending DOFs.</p>
    `,
    summary:`
      <strong>Structure summary</strong>
      <div class="readout"><span>Tip uy</span><strong>${(tip.uy*1000).toFixed(3)} mm</strong></div>
      <div class="readout"><span>Tip rotation</span><strong>${(tip.rz*180/Math.PI).toFixed(4)}°</strong></div>
      <div class="readout"><span>Root Fy</span><strong>${(root.ry/1000).toFixed(3)} kN</strong></div>
      <div class="readout"><span>Root Mz</span><strong>${(root.rm/1000).toFixed(3)} kNm</strong></div>
    `,
    viewport:`<div class="structure-stage">${frameSVG(model,result,760,420)}</div>`,
    results:`<div class="structure-results"><div class="structure-diagram">${frameSVG(model,result,620,220)}</div>
      <div class="resource-list">
        <div class="resource-row"><span class="file-icon">N</span><div><strong>End axial force</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[0]/1000).toFixed(3)} kN</span></div>
        <div class="resource-row"><span class="file-icon">V</span><div><strong>End shear</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[1]/1000).toFixed(3)} kN</span></div>
        <div class="resource-row"><span class="file-icon">M</span><div><strong>End moment</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[2]/1000).toFixed(3)} kNm</span></div>
      </div></div>`,
    model,result
  };
}
