import {applyBookBasis} from "./coolprop-core.js?v=1d7b19ad95af0e0629853493c00513156a247f75";

export const DIAGRAM_TYPES={
  "log-ph":{id:"log-ph",label:"log P-h",xLabel:"Specific enthalpy h (kJ/kg)",yLabel:"Pressure P (bar)",logY:true},
  "ph":{id:"ph",label:"P-h",xLabel:"Specific enthalpy h (kJ/kg)",yLabel:"Pressure P (bar)",logY:false},
  "ts":{id:"ts",label:"T-s",xLabel:"Specific entropy s (kJ/(kg·K))",yLabel:"Temperature T (°C)",logY:false},
  "pv":{id:"pv",label:"P-v",xLabel:"Specific volume v (m³/kg)",yLabel:"Pressure P (bar)",logY:true}
};

export function diagramType(id){
  return DIAGRAM_TYPES[id]||DIAGRAM_TYPES["log-ph"];
}

export function stateToDiagramPoint(state,type="log-ph"){
  const values=state?.valuesSI||state||{};
  const P=Number(values.P),H=Number(values.H),S=Number(values.S),T=Number(values.T),D=Number(values.D);
  if(type==="ts"){
    if(!Number.isFinite(S)||!Number.isFinite(T))return null;
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
  return {valuesSI};
}

export function generateIsotherms(engine,fluid,type="log-ph",{lines=7,points=28,bookBasis=false}={}){
  const {Tcrit,Pcrit,Ttriple}=criticalData(engine,fluid);
  const output=[];
  const Tmin=Ttriple*1.02,Tmax=Tcrit*1.45;
  const Pmin=Math.max(1e3,Pcrit*1e-4),Pmax=Pcrit*2;
  for(let i=0;i<lines;i++){
    const T=Tmin+(Tmax-Tmin)*(i/(Math.max(1,lines-1)));
    const data=[];
    for(let j=0;j<points;j++){
      const f=j/(Math.max(1,points-1));
      const P=Pmin*Math.pow(Pmax/Pmin,f);
      try{
        const p=stateToDiagramPoint(stateTP(engine,fluid,T,P,bookBasis),type);
        if(p)data.push(p);
      }catch{}
    }
    if(data.length)output.push({label:`T=${(T-273.15).toFixed(0)} °C`,points:data});
  }
  return output;
}

export function generateIsobars(engine,fluid,type="log-ph",{lines=7,points=28,bookBasis=false}={}){
  const {Tcrit,Pcrit,Ttriple}=criticalData(engine,fluid);
  const output=[];
  const Pmin=Math.max(1e3,Pcrit*1e-4),Pmax=Pcrit*2;
  const Tmin=Ttriple*1.02,Tmax=Tcrit*1.45;
  for(let i=0;i<lines;i++){
    const P=Pmin*Math.pow(Pmax/Pmin,i/(Math.max(1,lines-1)));
    const data=[];
    for(let j=0;j<points;j++){
      const T=Tmin+(Tmax-Tmin)*(j/(Math.max(1,points-1)));
      try{
        const p=stateToDiagramPoint(stateTP(engine,fluid,T,P,bookBasis),type);
        if(p)data.push(p);
      }catch{}
    }
    if(data.length)output.push({label:`P=${(P/1e5).toFixed(2)} bar`,points:data});
  }
  return output;
}

export function diagramDatasets(engine,fluid,type,states=[],options={}){
  const datasets=[];
  const bookBasis=Boolean(options.bookBasis);
  const saturation=generateSaturationCurve(engine,fluid,type,{points:options.saturationPoints||60,bookBasis});
  if(saturation.liquid.length)datasets.push({kind:"saturation",label:"Saturated liquid",points:saturation.liquid});
  if(saturation.vapor.length)datasets.push({kind:"saturation",label:"Saturated vapour",points:saturation.vapor});
  if(options.quality!==false){
    for(const line of generateQualityLines(engine,fluid,type,{bookBasis}))datasets.push({kind:"quality",...line});
  }
  if(options.isotherms!==false){
    for(const line of generateIsotherms(engine,fluid,type,{bookBasis}))datasets.push({kind:"isotherm",...line});
  }
  if(options.isobars!==false){
    for(const line of generateIsobars(engine,fluid,type,{bookBasis}))datasets.push({kind:"isobar",...line});
  }
  const statePoints=states.map((state,index)=>{
    const point=stateToDiagramPoint(state,type);
    return point?{...point,label:String(index+1)}:null;
  }).filter(Boolean);
  if(statePoints.length)datasets.push({kind:"states",label:"State points",points:statePoints});
  return datasets;
}

export function dataBounds(datasets,{logY=false}={}){
  const points=datasets.flatMap(dataset=>dataset.points||[]).filter(p=>
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
