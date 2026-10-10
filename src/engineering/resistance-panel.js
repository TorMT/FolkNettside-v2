import {ittc1957,resistanceCurve,knots} from "../resistance/ittc1957.js?v=9bf8435c998032db93e884790ca38463e6459db6";

let fixturePromise;
function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
export function loadResistanceFixture(path="./examples/engineering/resistance-ittc.json"){
  if(!fixturePromise){
    fixturePromise=fetch(path).then(response=>{
      if(!response.ok)throw new Error(`HTTP ${response.status} while loading ${path}`);
      return response.json();
    });
  }
  return fixturePromise;
}

function curveSVG(curve,currentSpeed){
  const width=700,height=300,pad=42;
  const maxX=Math.max(...curve.map(p=>p.speed),1);
  const maxY=Math.max(...curve.map(p=>p.frictionResistance),1);
  const sx=x=>pad+x/maxX*(width-2*pad);
  const sy=y=>height-pad-y/maxY*(height-2*pad);
  const points=curve.map(p=>`${sx(p.speed).toFixed(1)},${sy(p.frictionResistance).toFixed(1)}`).join(" ");
  const cx=sx(currentSpeed);
  return `<svg class="resistance-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="ITTC friction resistance curve">
    <path d="M${pad} ${height-pad}H${width-pad}M${pad} ${pad}V${height-pad}" stroke="var(--line-strong)" fill="none"/>
    <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="4"/>
    <line x1="${cx}" x2="${cx}" y1="${pad}" y2="${height-pad}" stroke="var(--warn)" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="${pad}" y="24" fill="var(--ink-2)" font-size="12">ITTC-1957 friction only</text>
  </svg>`;
}

export function resistancePanelHTML(fixture,{speedKnots}={}){
  const speed=Number.isFinite(Number(speedKnots))?Number(speedKnots):Number(fixture.speedKnots)||0;
  const input={
    length:fixture.length,
    wettedSurface:fixture.wettedSurface,
    density:fixture.density,
    kinematicViscosity:fixture.kinematicViscosity,
    speed:knots(speed)
  };
  const result=ittc1957(input);
  const maxSpeedKnots=Math.max(Number(fixture.maxSpeedKnots)||speed,speed,1);
  const curve=resistanceCurve(
    {...input,speed:0},
    {minSpeed:0,maxSpeed:knots(maxSpeedKnots),samples:18}
  );

  return {
    inspector:`
      <h3>Resistance case</h3>
      <label class="field"><span>Speed</span><div><input id="resistance-speed" type="number" min="0" step="0.25" value="${speed}"><span> kn</span></div></label>
      <div class="readout"><span>L</span><strong>${fixture.length} m</strong></div>
      <div class="readout"><span>Wetted surface</span><strong>${fixture.wettedSurface} m²</strong></div>
      <div class="readout"><span>ρ</span><strong>${fixture.density} kg/m³</strong></div>
      <div class="readout"><span>ν</span><strong>${Number(fixture.kinematicViscosity).toExponential(3)} m²/s</strong></div>
      <p class="muted hydro-note">${esc(fixture.notes)}</p>
    `,
    summary:`
      <strong>Friction baseline</strong>
      <div class="readout"><span>Rf</span><strong>${(result.frictionResistance/1000).toFixed(3)} kN</strong></div>
      <div class="readout"><span>Effective power</span><strong>${(result.effectivePower/1000).toFixed(2)} kW</strong></div>
      <div class="readout"><span>Fn</span><strong>${result.froude.toFixed(4)}</strong></div>
    `,
    viewport:`<div class="resistance-stage">${curveSVG(curve,input.speed)}</div>`,
    results:`<div class="resistance-results">
      <div class="hydro-grid">
        <div><span class="muted">Reynolds</span><strong>${result.reynolds.toExponential(4)}</strong></div>
        <div><span class="muted">Cf</span><strong>${result.cf.toFixed(7)}</strong></div>
        <div><span class="muted">Rf</span><strong>${result.frictionResistance.toFixed(1)} N</strong></div>
        <div><span class="muted">Pe</span><strong>${result.effectivePower.toFixed(1)} W</strong></div>
      </div>
      <div class="resistance-warning"><strong>Scope:</strong> frictional resistance only. This is not a total-resistance or CFD result.</div>
    </div>`,
    result,curve,speedKnots:speed
  };
}
