import {solveFrame2D} from "../structure/frame2d.js?v=fbff7f8706a833fc7ca800c4248d5e87bdaa9b04";

const fixturePromises=new Map();

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
export function loadStructureFixture(path="./examples/engineering/cantilever-frame.json"){
  const source=String(path);
  if(!fixturePromises.has(source)){
    const pending=fetch(source).then(response=>{
      if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${source}`);
      return response.json();
    }).catch(error=>{
      // Do not poison the cache after an offline failure or transient 404.
      fixturePromises.delete(source);
      throw error;
    });
    fixturePromises.set(source,pending);
  }
  return fixturePromises.get(source);
}
export function evaluateStructureCase(baseCase,{loadFy,loadPosition}={}){
  const model=JSON.parse(JSON.stringify(baseCase));
  const element=model.elements?.[0];
  if(!element)throw new Error("Reference frame has no element");
  const n1=model.nodes.find(n=>String(n.id)===String(element.n1));
  const n2=model.nodes.find(n=>String(n.id)===String(element.n2));
  if(!n1||!n2)throw new Error("Reference frame nodes missing");
  const length=Math.hypot(n2.x-n1.x,n2.y-n1.y);
  const position=loadPosition===undefined?length:Number(loadPosition);
  const fy=loadFy===undefined?Number(model.loads?.[0]?.fy||0):Number(loadFy);
  if(!Number.isFinite(position)||position<0||position>length||!Number.isFinite(fy))
    throw new Error("Point load position must be inside the element and Fy must be finite");
  model.loads=(model.loads||[]).slice(1);
  model.pointLoads=[{element:element.id,position,fx:0,fy,mz:0}];
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
  const pointLoadMarkers=(model.pointLoads||[]).map(load=>{
    const element=model.elements.find(e=>String(e.id)===String(load.element));
    if(!element)return "";
    const a=model.nodes.find(n=>String(n.id)===String(element.n1));
    const b=model.nodes.find(n=>String(n.id)===String(element.n2));
    const length=Math.hypot(b.x-a.x,b.y-a.y),t=load.position/length;
    const p=point({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    const fy=Number(load.fy)||0,from=p[1]+(fy<0?-36:36),to=p[1]+(fy<0?-8:8);
    const direction=fy<0?-1:1;
    return `<g class="structure-point-load-marker" role="img" aria-label="Point force at ${load.position} metres">
      <line x1="${p[0]}" y1="${from}" x2="${p[0]}" y2="${to}" stroke="var(--danger)" stroke-width="3"/>
      <path d="M${p[0]-6} ${to+direction*6} L${p[0]} ${to} L${p[0]+6} ${to+direction*6}"
        fill="none" stroke="var(--danger)" stroke-width="2.5"/>
      <circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--danger)"/>
      <text x="${p[0]+9}" y="${from}" fill="var(--danger)" font-size="11">${(fy/1000).toFixed(1)} kN</text>
    </g>`;
  }).join("");
  const nodes=model.nodes.map(node=>{const p=point(node,true);return `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/>`}).join("");
  return `<svg class="structure-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Frame deformation">${original}${deformed}${pointLoadMarkers}${nodes}<text x="${pad}" y="24" fill="var(--ink-2)" font-size="12">deformation scale ×${deformScale.toFixed(1)}</text></svg>`;
}

export function structurePanelHTML(baseCase,{loadFy,loadPosition}={}){
  const {model,result}=evaluateStructureCase(baseCase,{loadFy,loadPosition});
  const root=result.nodes[0],tip=result.nodes[result.nodes.length-1],element=model.elements[0],er=result.elements[0];
  const fy=Number(model.pointLoads?.[0]?.fy)||0;
  const position=Number(model.pointLoads?.[0]?.position)||0;
  return {
    inspector:`
      <h3>2D frame case</h3>
      <label class="field"><span>Point force Fy (global)</span><div><input id="structure-load" type="number" step="1" value="${fy/1000}"><span> kN</span></div></label>
      <label class="field"><span>Load position from element start</span><div><input id="structure-load-position" type="number" min="0" max="${er.length}" step="0.1" value="${position}"><span> m</span></div></label>
      <div class="readout"><span>E</span><strong>${(element.E/1e9).toFixed(1)} GPa</strong></div>
      <div class="readout"><span>A</span><strong>${element.A.toExponential(3)} m²</strong></div>
      <div class="readout"><span>I</span><strong>${element.I.toExponential(3)} m⁴</strong></div>
      <div class="readout"><span>Length</span><strong>${er.length.toFixed(3)} m</strong></div>
      <p class="muted hydro-note">Euler–Bernoulli 2D frame, with an exactly integrated interior point force. This is a static structural force, not a mass contribution to Hydro GM.</p>
    `,
    summary:`
      <strong>Structure summary</strong>
      <div class="readout"><span>Tip uy</span><strong>${(tip.uy*1000).toFixed(3)} mm</strong></div>
      <div class="readout"><span>Tip rotation</span><strong>${(tip.rz*180/Math.PI).toFixed(4)}°</strong></div>
      <div class="readout"><span>Root Fy</span><strong>${(root.ry/1000).toFixed(3)} kN</strong></div>
      <div class="readout"><span>Root Mz</span><strong>${(root.rm/1000).toFixed(3)} kNm</strong></div>
    `,
    viewport:`<div class="structure-stage">
      <div class="structure-view-actions" role="group" aria-label="Beam model view">
        <button type="button" class="btn" id="structure-show-3d" aria-pressed="true">3D model</button>
        <button type="button" class="btn" id="structure-show-2d" aria-pressed="false">2D diagram</button>
        <button type="button" class="btn" id="structure-view-reset">Reset view</button>
      </div>
      <div id="structure-3d-stage" class="structure-3d-stage" aria-label="Interactive beam model: drag to orbit, right-drag to move and wheel to zoom">Loading interactive frame…</div>
      <div id="structure-2d-stage" class="structure-2d-stage" hidden>${frameSVG(model,result,760,420)}</div>
      <p class="muted structure-view-hint">Left drag: orbit · Right drag or two fingers: pan · Wheel or pinch: zoom. 3D beam thickness and deformation scaling are illustrative; FEM remains 2D.</p>
    </div>`,
    results:`<div class="structure-results"><div class="structure-diagram">${frameSVG(model,result,620,220)}</div>
      <div class="resource-list">
        <div class="resource-row"><span class="file-icon">N</span><div><strong>End axial force</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[0]/1000).toFixed(3)} kN</span></div>
        <div class="resource-row"><span class="file-icon">V</span><div><strong>End shear</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[1]/1000).toFixed(3)} kN</span></div>
        <div class="resource-row"><span class="file-icon">M</span><div><strong>End moment</strong><div class="muted">local node 1</div></div><span>${(er.localEndForces[2]/1000).toFixed(3)} kNm</span></div>
      </div></div>`,
    model,result
  };
}
