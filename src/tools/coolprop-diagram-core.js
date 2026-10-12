import {applyBookBasis} from "./coolprop-core.js?v=79586a975aa0b383788b1de8e40d9d0f17450156";

export const DIAGRAM_TYPES={
  "log-ph":{id:"log-ph",label:"log P-h",xLabel:"Specific enthalpy h (kJ/kg)",yLabel:"Pressure P (bar)",logY:true},
  "ph":{id:"ph",label:"P-h",xLabel:"Specific enthalpy h (kJ/kg)",yLabel:"Pressure P (bar)",logY:false},
  "ts":{id:"ts",label:"T-s",xLabel:"Specific entropy s (kJ/(kg·K))",yLabel:"Temperature T (°C)",logY:false},
  "pv":{id:"pv",label:"P-v",xLabel:"Specific volume v (m³/kg)",yLabel:"Pressure P (bar)",logY:true}
};

export function diagramType(id){
  return DIAGRAM_TYPES[id]||DIAGRAM_TYPES["log-ph"];
}

/** Distinguish absent values from physically meaningful 0 J/kg or 0 J/(kg K). */
function stateNumber(value){
  if(value===null||value===undefined||typeof value==="boolean"||
     (typeof value==="string"&&!value.trim()))return NaN;
  const number=Number(value);
  return Number.isFinite(number)?number:NaN;
}
export function stateToDiagramPoint(state,type="log-ph"){
  const values=state?.valuesSI||state||{};
  const P=stateNumber(values.P),H=stateNumber(values.H),S=stateNumber(values.S);
  const T=stateNumber(values.T),D=stateNumber(values.D);
  if(type==="ts"){
    if(!Number.isFinite(S)||!Number.isFinite(T)||T<=0)return null;
    return {x:S/1000,y:T-273.15};
  }
  if(type==="pv"){
    if(!Number.isFinite(P)||!Number.isFinite(D)||D<=0||P<=0)return null;
    return {x:1/D,y:P/1e5};
  }
  if(!Number.isFinite(P)||!Number.isFinite(H)||P<=0)return null;
  return {x:H/1000,y:P/1e5};
}

function criticalData(engine,fluid){
  if(!engine?.props1SI)throw new Error("CoolProp Props1SI is unavailable");
  return {
    Tcrit:Number(engine.props1SI(fluid,"Tcrit")),
    Pcrit:Number(engine.props1SI(fluid,"Pcrit")),
    Ttriple:Number(engine.props1SI(fluid,"Ttriple"))
  };
}

function saturatedState(engine,fluid,T,Q,bookBasis=false){
  const keys=["P","H","S","D"];
  const valuesSI={T};
  for(const key of keys){
    const raw=engine.propsSI(key,"T",T,"Q",Q,fluid);
    valuesSI[key]=applyBookBasis(engine,fluid,key,raw,bookBasis);
  }
  return {valuesSI};
}

export function generateSaturationCurve(engine,fluid,type="log-ph",{points=60,bookBasis=false}={}){
  const {Tcrit,Ttriple}=criticalData(engine,fluid);
  const liquid=[],vapor=[];
  const count=Math.max(8,Math.floor(points));
  const margin=(Tcrit-Ttriple)*1e-5;
  for(let i=0;i<=count;i++){
    const T=Ttriple+margin+(Tcrit-Ttriple-2*margin)*(i/count);
    try{
      const l=stateToDiagramPoint(saturatedState(engine,fluid,T,0,bookBasis),type);
      const v=stateToDiagramPoint(saturatedState(engine,fluid,T,1,bookBasis),type);
      if(l)liquid.push(l);
      if(v)vapor.push(v);
    }catch{}
  }
  return {liquid,vapor};
}

export function generateQualityLines(engine,fluid,type="log-ph",{
  qualities=[.1,.2,.3,.4,.5,.6,.7,.8,.9],
  points=36,
  bookBasis=false
}={}){
  const {Tcrit,Ttriple}=criticalData(engine,fluid);
  const lines=[];
  for(const quality of qualities){
    const data=[];
    for(let i=0;i<points;i++){
      const T=Ttriple+(Tcrit-Ttriple)*((i+.25)/(points+.5));
      try{
        const p=stateToDiagramPoint(saturatedState(engine,fluid,T,quality,bookBasis),type);
        if(p)data.push(p);
      }catch{}
    }
    if(data.length)lines.push({label:`x=${quality.toFixed(1)}`,points:data});
  }
  return lines;
}

function stateTP(engine,fluid,T,P,bookBasis=false){
  const valuesSI={T,P};
  for(const key of ["H","S","D"]){
    const raw=engine.propsSI(key,"T",T,"P",P,fluid);
    valuesSI[key]=applyBookBasis(engine,fluid,key,raw,bookBasis);
  }
  let phase="";
  try{
    phase=String(engine.phaseSI?.("T",T,"P",P,fluid)??engine.propsSI("Phase","T",T,"P",P,fluid));
  }catch{}
  return {valuesSI,phase};
}

function appendContinuousPoint(data,point,phase,lastState){
  if(!point)return {phase,lastPoint:null};
  const normalized=String(phase||"").toLowerCase();
  const previousPhase=String(lastState?.phase||"").toLowerCase();
  const changedPhase=previousPhase&&normalized&&previousPhase!==normalized;
  const previous=lastState?.lastPoint||null;
  const dx=previous?Math.abs(point.x-previous.x):0;
  const dy=previous?Math.abs(point.y-previous.y):0;
  const xScale=previous?Math.max(1,Math.abs(previous.x),Math.abs(point.x)):1;
  const yScale=previous?Math.max(1,Math.abs(previous.y),Math.abs(point.y)):1;
  const jumped=Boolean(previous)&&(dx/xScale>1.5||dy/yScale>1.5);
  data.push({...point,breakBefore:Boolean(lastState?.gap||changedPhase||jumped)});
  return {phase,lastPoint:point,gap:false};
}

export function generateIsotherms(engine,fluid,type="log-ph",{lines=7,points=36,bookBasis=false}={}){
  const {Tcrit,Pcrit,Ttriple}=criticalData(engine,fluid);
  const output=[];
  const Tmin=Ttriple*1.02,Tmax=Tcrit*1.45;
  const Pmin=Math.max(1e3,Pcrit*1e-4),Pmax=Pcrit*2;
  for(let i=0;i<lines;i++){
    const T=Tmin+(Tmax-Tmin)*(i/(Math.max(1,lines-1)));
    const data=[];
    let continuity={phase:"",lastPoint:null,gap:false};
    for(let j=0;j<points;j++){
      const f=j/(Math.max(1,points-1));
      const P=Pmin*Math.pow(Pmax/Pmin,f);
      try{
        const state=stateTP(engine,fluid,T,P,bookBasis);
        const p=stateToDiagramPoint(state,type);
        continuity=appendContinuousPoint(data,p,state.phase,continuity);
      }catch{
        continuity={...continuity,gap:true};
      }
    }
    if(data.length>1)output.push({label:`T=${(T-273.15).toFixed(0)} °C`,points:data});
  }
  return output;
}

export function generateIsobars(engine,fluid,type="log-ph",{lines=7,points=36,bookBasis=false}={}){
  const {Tcrit,Pcrit,Ttriple}=criticalData(engine,fluid);
  const output=[];
  const Pmin=Math.max(1e3,Pcrit*1e-4),Pmax=Pcrit*2;
  const Tmin=Ttriple*1.02,Tmax=Tcrit*1.45;
  for(let i=0;i<lines;i++){
    const P=Pmin*Math.pow(Pmax/Pmin,i/(Math.max(1,lines-1)));
    const data=[];
    let continuity={phase:"",lastPoint:null,gap:false};
    for(let j=0;j<points;j++){
      const T=Tmin+(Tmax-Tmin)*(j/(Math.max(1,points-1)));
      try{
        const state=stateTP(engine,fluid,T,P,bookBasis);
        const p=stateToDiagramPoint(state,type);
        continuity=appendContinuousPoint(data,p,state.phase,continuity);
      }catch{
        continuity={...continuity,gap:true};
      }
    }
    if(data.length>1)output.push({label:`P=${(P/1e5).toFixed(2)} bar`,points:data});
  }
  return output;
}

export function diagramDatasets(engine,fluid,type,states=[],options={}){
  const datasets=[];
  const bookBasis=Boolean(options.bookBasis);
  // Single-phase or unsupported fluids may not expose a saturation dome.
  // Preserve valid user state points rather than failing the entire diagram.
  let saturation={liquid:[],vapor:[]};
  try{saturation=generateSaturationCurve(engine,fluid,type,{points:options.saturationPoints||60,bookBasis})}
  catch{/* No saturation EOS for this fluid; state points still plot. */}
  if(saturation.liquid.length)datasets.push({kind:"saturation",label:"Saturated liquid",points:saturation.liquid,affectsBounds:true});
  if(saturation.vapor.length)datasets.push({kind:"saturation",label:"Saturated vapour",points:saturation.vapor,affectsBounds:true});
  if(saturation.liquid.length&&saturation.vapor.length){
    const liquid=saturation.liquid[saturation.liquid.length-1];
    const vapor=saturation.vapor[saturation.vapor.length-1];
    datasets.push({
      kind:"critical",
      label:"Critical point",
      points:[{x:(liquid.x+vapor.x)/2,y:(liquid.y+vapor.y)/2}],
      affectsBounds:true
    });
  }
  if(options.quality!==false&&saturation.liquid.length&&saturation.vapor.length){
    try{
      for(const line of generateQualityLines(engine,fluid,type,{bookBasis}))datasets.push({kind:"quality",affectsBounds:false,...line});
    }catch{/* Unsupported two-phase quality: retain plotted states. */}
  }
  if(options.isotherms!==false){
    try{
      for(const line of generateIsotherms(engine,fluid,type,{bookBasis}))datasets.push({kind:"isotherm",affectsBounds:false,...line});
    }catch{/* Skip unavailable auxiliary lines, never fabricated values. */}
  }
  if(options.isobars!==false){
    try{
      for(const line of generateIsobars(engine,fluid,type,{bookBasis}))datasets.push({kind:"isobar",affectsBounds:false,...line});
    }catch{/* Skip unavailable auxiliary lines, never fabricated values. */}
  }
  const statePoints=states.map((state,index)=>{
    const point=stateToDiagramPoint(state,type);
    return point?{...point,label:String(index+1)}:null;
  }).filter(Boolean);
  if(statePoints.length)datasets.push({kind:"states",label:"State points",points:statePoints,affectsBounds:true});
  return datasets;
}

export function dataBounds(datasets,{logY=false}={}){
  const bounded=datasets.some(dataset=>dataset.affectsBounds!==false)
    ?datasets.filter(dataset=>dataset.affectsBounds!==false)
    :datasets;
  const points=bounded.flatMap(dataset=>dataset.points||[]).filter(p=>
    Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!logY||p.y>0)
  );
  if(!points.length)return {xmin:0,xmax:1,ymin:logY?.1:0,ymax:1};
  let xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x));
  let ymin=Math.min(...points.map(p=>p.y)),ymax=Math.max(...points.map(p=>p.y));
  const dx=xmax-xmin||Math.max(1,Math.abs(xmax)*.1);
  if(logY){
    ymin=Math.max(ymin,1e-9);
    const logMin=Math.log10(ymin),logMax=Math.log10(Math.max(ymax,ymin*1.01));
    const pad=Math.max(.08,(logMax-logMin)*.08);
    return {xmin:xmin-dx*.06,xmax:xmax+dx*.06,ymin:10**(logMin-pad),ymax:10**(logMax+pad)};
  }
  const dy=ymax-ymin||Math.max(1,Math.abs(ymax)*.1);
  return {xmin:xmin-dx*.06,xmax:xmax+dx*.06,ymin:ymin-dy*.08,ymax:ymax+dy*.08};
}
