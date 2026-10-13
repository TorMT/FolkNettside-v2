import {hydroForceBalance,hydroForceInputs} from "./hydro-force-balance.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {analyzeModelDiagnostics} from "../model/mesh-diagnostics.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString("en-US",{
  maximumFractionDigits:d,minimumFractionDigits:d
}):"—";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function hydroForcesHTML({
  modelDocument,result,densityKgM3=1025,draft,
  pointWeightSummary=null,hullMassText="",kg="",lcg="",tcg=""
}={}){
  const input=hydroForceInputs({pointWeightSummary,hullMassText,kg,lcg,tcg});
  const force=hydroForceBalance({
    hydroResult:result,densityKgM3,...input
  });
  const bounds=analyzeModelDiagnostics(modelDocument).bounds;
  const hasBounds=bounds?.min?.length===3&&bounds?.max?.length===3&&
    bounds.min.every(Number.isFinite)&&bounds.max.every(Number.isFinite);
  const cb=force.centerOfBuoyancy,cg=force.centerOfGravity;
  const x0=hasBounds?bounds.min[0]:cb[0]-1,x1=hasBounds?bounds.max[0]:cb[0]+1;
  const z0=hasBounds?bounds.min[2]:cb[2]-1,z1=hasBounds?bounds.max[2]:cb[2]+1;
  const minX=Math.min(x0,cb[0],cg?.[0]??cb[0]),
    maxX=Math.max(x1,cb[0],cg?.[0]??cb[0]);
  const minZ=Math.min(z0,cb[2],cg?.[2]??cb[2],draft??cb[2]),
    maxZ=Math.max(z1,cb[2],cg?.[2]??cb[2],draft??cb[2]);
  const spanX=Math.max(1e-6,maxX-minX),spanZ=Math.max(1e-6,maxZ-minZ);
  const sx=x=>50+clamp((x-minX)/spanX,0,1)*470;
  const sz=z=>245-clamp((z-minZ)/spanZ,0,1)*180;
  const circle=(p,label,color)=>'<circle cx="'+sx(p[0])+'" cy="'+sz(p[2])+
    '" r="5" fill="'+color+'"/>'+
    '<text x="'+(sx(p[0])+7)+'" y="'+(sz(p[2])-8)+'" font-size="12" fill="'+color+'">'+label+'</text>';
  const arrow=(point,positive,label,color)=>{
    const x=sx(point[0]),y=sz(point[2]);
    const tip=clamp(y+(positive?-52:52),12,275);
    const head=positive?
      'M'+(x-6)+' '+(tip+11)+'L'+x+' '+tip+'L'+(x+6)+' '+(tip+11):
      'M'+(x-6)+' '+(tip-11)+'L'+x+' '+tip+'L'+(x+6)+' '+(tip-11);
    return '<path d="M'+x+' '+y+'V'+tip+' '+head+
      '" fill="none" stroke="'+color+'" stroke-width="3" stroke-linejoin="round"/>'+
      circle(point,label,color);
  };
  // A side-view LOCATION drawing: arrow lengths are schematic, not force scale.
  const datum=Number.isFinite(draft)?sz(draft):null;
  const sideSVG='<svg class="hydro-force-visual" viewBox="0 0 570 290" role="img" '+
    'aria-label="Longitudinal X-Z side view of centre of buoyancy upward and '+
    'known centre of gravity downward; arrow lengths are schematic">'+
    '<rect x="45" y="12" width="480" height="245" fill="var(--surface-sunk)" stroke="var(--line)"/>'+
    (datum!==null?'<path d="M45 '+datum+'H525" stroke="var(--accent)" stroke-dasharray="6 4" stroke-width="1.5"/>'+
      '<text x="48" y="'+Math.max(15,datum-6)+'" fill="var(--accent)" font-size="11">Reference waterline</text>':"")+
    arrow(cb,true,"CB ↑","var(--accent)")+
    (force.positionKnown?arrow(cg,false,"CG ↓","var(--danger)"):"")+
    '<text x="48" y="275" fill="var(--ink-2)" font-size="11">Longitudinal X (m): '+fmt(minX,1)+' to '+fmt(maxX,1)+'</text>'+
    '<text x="524" y="275" text-anchor="end" fill="var(--ink-2)" font-size="11">Vertical Z (m)</text>'+
    '</svg>';
  const maxB=Math.max(1,...force.components.map(c=>c.buoyancyKN));
  const byComponent=force.components.slice(0,24).map(c=>
    '<div class="hydro-force-component"><span>'+esc(c.name)+'</span>'+
    '<div class="hydro-force-track"><i style="width:'+clamp(100*c.buoyancyKN/maxB,0,100).toFixed(2)+'%"></i></div>'+
    '<strong>'+fmt(c.buoyancyKN,2)+' kN</strong></div>').join("");
  const masses=pointWeightSummary?[
    ...(pointWeightSummary.pointWeights||[]).map((p,i)=>({
      label:"Point "+(i+1),mass:p.massTonnes,position:[p.x,p.y,p.z]
    })),
    ...(pointWeightSummary.areaLoads||[]).map((p,i)=>({
      label:"Area "+(i+1),mass:p.massTonnes,position:[p.x,p.y,p.z]
    }))
  ]:[];
  const details=masses.map(entry=>
    '<tr><td>'+esc(entry.label)+'</td><td>'+fmt(entry.mass,3)+'</td>'+
    '<td>'+fmt(entry.mass*9.80665,2)+'</td><td>'+
    entry.position.map(x=>fmt(x,2)).join(" / ")+'</td></tr>').join("");
  return '<section class="hydro-force-section" aria-label="Hydrostatic buoyancy and gravity force balance">'+
    '<header><strong>Buoyancy versus gravity · reference draft</strong>'+
    '<span>Volume-based resultant forces; not shell pressure or structural load distribution</span></header>'+
    '<div class="hydro-force-numbers"><div><span>Hydrostatic buoyancy (↑)</span><strong>'+
    fmt(force.buoyancyKN,2)+' kN</strong></div><div><span>Entered mass gravity (↓)</span><strong>'+
    (force.massKnown?fmt(force.gravityKN,2)+' kN':'Unknown — enter hull/load mass')+
    '</strong></div><div><span>Net vertical resultant (↑ positive)</span><strong>'+
    (force.massKnown?fmt(force.residualKN,2)+' kN':'Not evaluable')+'</strong></div></div>'+
    (force.massKnown?'<p class="hydro-force-equilibrium">'+
      (force.balanced?'Approximate force balance at displayed reference draft':
      'Not in vertical force equilibrium at this reference draft')+
      ' · tolerance ±'+fmt(force.toleranceKN,2)+' kN. No heel/trim moment equilibrium is implied.</p>':
      '<p class="hydro-force-equilibrium">A reference displacement is not automatically treated as a known hull weight.</p>')+
    sideSVG+
    '<details><summary>Buoyancy per included geometry component</summary>'+
    '<div class="hydro-force-components">'+byComponent+
    (force.components.length>24?'<small>Showing first 24 of '+force.components.length+' components.</small>':"")+
    '</div><small>Sum of component displaced volumes × water density × g. Components must represent non-overlapping displaced hull volume.</small></details>'+
    '<details><summary>Applied mass distribution and lever arms</summary>'+
    (masses.length?'<div class="hydro-force-table-wrap"><table><thead><tr>'+
    '<th>Type</th><th>Mass (t)</th><th>Gravity (kN)</th><th>CG x/y/z (m)</th>'+
    '</tr></thead><tbody>'+details+'</tbody></table></div>':
    '<p>No additional masses applied. Pending editor rows are excluded until Apply is used.</p>')+
    '</details><small>Arrow positions use computed CB and entered combined CG. Arrow lengths are schematic. '+
    'The separate pressure audit can integrate wetted mesh faces on request; '+
    'this CB/CG diagram shows only global resultant forces.</small></section>';
}
