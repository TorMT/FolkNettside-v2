export const INPUTS={
  P:{label:"Pressure"},
  T:{label:"Temperature"},
  H:{label:"Enthalpy"},
  U:{label:"Internal energy"},
  S:{label:"Entropy"},
  D:{label:"Density"},
  Q:{label:"Quality"}
};

export const OUTPUTS=[
  ["T","Temperature"],
  ["P","Pressure"],
  ["D","Density"],
  ["H","Enthalpy"],
  ["S","Entropy"],
  ["U","Internal energy"],
  ["Cp","Cp"],
  ["Cv","Cv"],
  ["viscosity","Viscosity"],
  ["conductivity","Conductivity"],
  ["speed_sound","Speed of sound"],
  ["Prandtl","Prandtl"],
  ["Q","Quality"]
];

export const DEFAULT_FLUIDS=["Air","Water","Ammonia","Propane","CO2","Nitrogen","Oxygen","R134a"];

export const TABLE4_R_SPEC={
  Air:287.058,
  Water:461.526,
  Nitrogen:296.803,
  CO2:188.924,
  CarbonDioxide:188.924
};

export const TABLE4_PRESETS={
  Air:{
    label:"Legacy Air Table 4",
    fluid:"Air",
    format:"TP",
    units:{pressure:"bar",temperature:"C"},
    rows:"25,1\n790,1\n30,12\n810,12\n-120,40\n390,40"
  },
  Water:{
    label:"Legacy Water-vapour Table 4",
    fluid:"Water",
    format:"TP",
    units:{pressure:"bar",temperature:"C"},
    rows:"90,0.5\n310,0.5\n150,3\n410,3\n410,300\n880,300"
  }
};

export const DEFAULT_UNITS={
  pressure:"bar",
  temperature:"C",
  energy:"kJkg",
  entropy:"kJkgK"
};

export const PROCESS_TYPES={
  isobaric:{label:"Isobaric",constant:"P",targets:["T","H","S","Q","D"]},
  isothermal:{label:"Isothermal",constant:"T",targets:["P","H","S","Q","D"]},
  isentropic:{label:"Isentropic",constant:"S",targets:["P","T","H","Q","D"]},
  isochoric:{label:"Isochoric",constant:"D",targets:["P","T","H","S"]},
  isenthalpic:{label:"Isenthalpic",constant:"H",targets:["P","T","S","Q"]}
};

const CALIB_T=1000;
const CALIB_P=1e5;
const CALIB_H_BOOK=1046.04e3;
const CALIB_U_BOOK=758.94e3;
const bookOffsetCache=new WeakMap();

function unitsWithDefaults(units={}){
  return {...DEFAULT_UNITS,...units};
}

export function unitLabel(param,units={}){
  const u=unitsWithDefaults(units);
  if(param==="P")return u.pressure;
  if(param==="T")return u.temperature==="C"?"°C":"K";
  if(param==="H"||param==="U")return u.energy==="kJkg"?"kJ/kg":"J/kg";
  if(param==="S"||param==="Cp"||param==="Cv")return u.entropy==="kJkgK"?"kJ/(kg·K)":"J/(kg·K)";
  if(param==="D")return "kg/m³";
  if(param==="viscosity")return "Pa·s";
  if(param==="conductivity")return "W/(m·K)";
  if(param==="speed_sound")return "m/s";
  return "";
}

export function inputToSI(param,value,units={}){
  const v=Number(value);
  if(!Number.isFinite(v))throw new Error(`Invalid ${param} input`);
  const u=unitsWithDefaults(units);
  if(param==="P"){
    if(u.pressure==="bar")return v*1e5;
    if(u.pressure==="kPa")return v*1e3;
    if(u.pressure==="MPa")return v*1e6;
    return v;
  }
  if(param==="T")return u.temperature==="C"?v+273.15:v;
  if(param==="H"||param==="U")return u.energy==="kJkg"?v*1e3:v;
  if(param==="S"||param==="Cp"||param==="Cv")return u.entropy==="kJkgK"?v*1e3:v;
  return v;
}

export function outputFromSI(param,value,units={}){
  const v=Number(value);
  if(!Number.isFinite(v))return null;
  const u=unitsWithDefaults(units);
  if(param==="P"){
    if(u.pressure==="bar")return v/1e5;
    if(u.pressure==="kPa")return v/1e3;
    if(u.pressure==="MPa")return v/1e6;
    return v;
  }
  if(param==="T")return u.temperature==="C"?v-273.15:v;
  if(param==="H"||param==="U")return u.energy==="kJkg"?v/1e3:v;
  if(param==="S"||param==="Cp"||param==="Cv")return u.entropy==="kJkgK"?v/1e3:v;
  return v;
}

export function phaseDescription(raw){
  const phase=String(raw||"").toLowerCase();
  if(phase.includes("twophase"))return "Two-phase";
  if(phase.includes("supercritical"))return "Supercritical";
  if(phase.includes("gas"))return "Gas / superheated vapour";
  if(phase.includes("liquid"))return "Liquid / subcooled";
  return raw?String(raw):"Unknown";
}

function bookOffsets(engine){
  if(bookOffsetCache.has(engine))return bookOffsetCache.get(engine);
  let h=0,u=0;
  try{
    h=CALIB_H_BOOK-engine.propsSI("H","T",CALIB_T,"P",CALIB_P,"Air");
    u=CALIB_U_BOOK-engine.propsSI("U","T",CALIB_T,"P",CALIB_P,"Air");
  }catch{}
  const offsets={H:h,U:u};
  bookOffsetCache.set(engine,offsets);
  return offsets;
}

export function applyBookBasis(engine,fluid,prop,value,enabled=false){
  if(!enabled||String(fluid).toLowerCase()!=="air"||(prop!=="H"&&prop!=="U"))return value;
  return value+(bookOffsets(engine)[prop]||0);
}

export function computeStateSI(engine,{
  fluid,
  input1,
  value1SI,
  input2,
  value2SI,
  units=DEFAULT_UNITS,
  bookBasis=false
}){
  if(!engine?.propsSI)throw new Error("CoolProp engine is not ready");
  if(input1===input2)throw new Error("Choose two different independent properties");

  const valuesSI={};
  const values={};
  const errors={};

  for(const [key] of OUTPUTS){
    try{
      const {value:raw}=propsSIOutput(engine,key,input1,value1SI,input2,value2SI,fluid);
      const adjusted=applyBookBasis(engine,fluid,key,raw,bookBasis);
      valuesSI[key]=adjusted;
      values[key]=outputFromSI(key,adjusted,units);
    }catch(error){
      valuesSI[key]=null;
      values[key]=null;
      errors[key]=String(error?.message||error);
    }
  }

  let phaseRaw="";
  let phase="Unknown";
  if(engine.phaseSI){
    try{
      phaseRaw=engine.phaseSI(input1,value1SI,input2,value2SI,fluid);
      phase=phaseDescription(phaseRaw);
    }catch{}
  }

  return {
    fluid,input1,input2,value1SI,value2SI,
    valuesSI,values,phase,phaseRaw,errors
  };
}

export function saturationWarning(engine,{
  fluid,
  input1,
  value1,
  input2,
  value2,
  units=DEFAULT_UNITS
}){
  const pair=new Set([input1,input2]);
  if(!(pair.has("P")&&pair.has("T"))||!engine?.propsSI)return null;

  const pressureInput=input1==="P"?value1:value2;
  const temperatureInput=input1==="T"?value1:value2;
  const pressureSI=inputToSI("P",pressureInput,units);
  const temperatureSI=inputToSI("T",temperatureInput,units);

  try{
    const saturationTemperature=engine.propsSI("T","P",pressureSI,"Q",0,fluid);
    if(!Number.isFinite(saturationTemperature))return null;
    const deltaK=Math.abs(temperatureSI-saturationTemperature);
    if(deltaK>=5)return null;
    return {
      severity:deltaK<.5?"critical":"warning",
      deltaK,
      saturationTemperatureK:saturationTemperature,
      saturationTemperature:outputFromSI("T",saturationTemperature,units),
      pressure:pressureInput,
      temperature:temperatureInput,
      message:deltaK<.5
        ?"P and T are at or extremely close to saturation. P and T alone do not determine vapour quality in the two-phase region; use Q, H, S or D as an independent property."
        :"P and T are close to saturation. If the state is two-phase, add Q, H, S or D to determine the state unambiguously."
    };
  }catch{
    return null;
  }
}

export function computeState(engine,{
  fluid,
  input1,
  value1,
  input2,
  value2,
  units=DEFAULT_UNITS,
  bookBasis=false
}){
  return computeStateSI(engine,{
    fluid,input1,value1SI:inputToSI(input1,value1,units),
    input2,value2SI:inputToSI(input2,value2,units),
    units,bookBasis
  });
}

export function batchFormat(format){
  const map={TP:["T","P"],PT:["P","T"],PH:["P","H"],PU:["P","U"]};
  return map[format]||null;
}

export function parseBatchRows(text){
  return String(text||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
    const values=line.split(/[,;\s]+/).filter(Boolean).map(Number);
    if(values.length<2||!Number.isFinite(values[0])||!Number.isFinite(values[1])){
      return {index:index+1,status:"FAIL",error:"Need two valid numeric values",raw:line};
    }
    return {index:index+1,status:"OK",value1:values[0],value2:values[1],raw:line};
  });
}

export function computeBatch(engine,{
  fluid,
  format="TP",
  rows="",
  outputs=["H","S","Phase"],
  units=DEFAULT_UNITS,
  bookBasis=false
}){
  const pair=batchFormat(format);
  if(!pair)throw new Error(`Unsupported batch format: ${format}`);
  const [input1,input2]=pair;
  return parseBatchRows(rows).map(parsed=>{
    if(parsed.status!=="OK")return parsed;
    try{
      const state=computeState(engine,{
        fluid,input1,value1:parsed.value1,input2,value2:parsed.value2,units,bookBasis
      });
      const values={};
      for(const key of outputs){
        if(key==="Phase")values.Phase=state.phase;
        else values[key]=state.values[key];
      }
      return {
        ...parsed,
        input1,input2,
        inputs:{[input1]:parsed.value1,[input2]:parsed.value2},
        values,
        state,
        status:"OK"
      };
    }catch(error){
      return {...parsed,status:"FAIL",error:String(error?.message||error)};
    }
  });
}

export function computeTable4(engine,{
  fluid,
  format="TP",
  rows="",
  units=DEFAULT_UNITS
}){
  if(!engine?.propsSI)throw new Error("CoolProp engine is not ready");
  if(!["TP","PT"].includes(format))throw new Error("Table 4 requires T/P or P/T input");
  const R=TABLE4_R_SPEC[fluid];
  if(!Number.isFinite(R))throw new Error(`Missing legacy R_spec for ${fluid}`);

  return parseBatchRows(rows).map(parsed=>{
    if(parsed.status!=="OK")return parsed;
    const temperatureRaw=format==="TP"?parsed.value1:parsed.value2;
    const pressureRaw=format==="TP"?parsed.value2:parsed.value1;
    try{
      const temperatureK=inputToSI("T",temperatureRaw,units);
      const pressurePa=inputToSI("P",pressureRaw,units);
      if(!(temperatureK>0)||!(pressurePa>0))throw new Error("Invalid T/P");
      const vIdeal=R*temperatureK/pressurePa;
      const density=engine.propsSI("D","T",temperatureK,"P",pressurePa,fluid);
      if(!(Number.isFinite(density)&&density>0))throw new Error("Invalid density");
      const vReal=1/density;
      const diffPercent=Math.abs(vReal-vIdeal)/vIdeal*100;
      const Z=vReal/vIdeal;
      return {
        ...parsed,
        status:"OK",
        fluid,
        temperatureRaw,
        pressureRaw,
        temperatureK,
        pressurePa,
        density,
        vIdeal,
        vReal,
        diffPercent,
        Z
      };
    }catch(error){
      return {...parsed,status:"FAIL",error:String(error?.message||error)};
    }
  });
}

export function processTargetOptions(type){
  return [...(PROCESS_TYPES[type]?.targets||[])];
}

export function computeProcess(engine,{
  fluid,
  start,
  steps=[],
  units=DEFAULT_UNITS,
  bookBasis=false
}){
  const results=[];
  let previous=null;

  try{
    const state=computeState(engine,{...start,fluid,units,bookBasis});
    previous=state;
    results.push({step:1,description:start.description||"Point 1",status:"OK",state});
  }catch(error){
    return [{step:1,description:start.description||"Point 1",status:"FAIL",error:String(error?.message||error)}];
  }

  for(let index=0;index<steps.length;index++){
    const step=steps[index];
    const rule=PROCESS_TYPES[step.processType];
    if(!rule){
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"FAIL",error:"Unsupported process type"});
      previous=null;
      continue;
    }
    if(!previous){
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"FAIL",error:"Previous point is unavailable"});
      continue;
    }
    if(!rule.targets.includes(step.targetType)){
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"FAIL",error:`${step.targetType} is not valid for ${step.processType}`});
      previous=null;
      continue;
    }

    const constantValue=previous.valuesSI[rule.constant];
    if(!Number.isFinite(constantValue)){
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"FAIL",error:`Previous ${rule.constant} is unavailable`});
      previous=null;
      continue;
    }

    try{
      const state=computeStateSI(engine,{
        fluid,
        input1:rule.constant,
        value1SI:constantValue,
        input2:step.targetType,
        value2SI:inputToSI(step.targetType,step.targetValue,units),
        units,bookBasis
      });
      previous=state;
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"OK",processType:step.processType,state});
    }catch(error){
      results.push({step:index+2,description:step.description||`Point ${index+2}`,status:"FAIL",error:String(error?.message||error)});
      previous=null;
    }
  }

  return results;
}

export function rowsToCSV(rows){
  if(!rows?.length)return "";
  const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  const quote=value=>{
    if(value===null||value===undefined)return "";
    const text=typeof value==="object"?JSON.stringify(value):String(value);
    return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
  };
  return [keys.join(","),...rows.map(row=>keys.map(key=>quote(row[key])).join(","))].join("\n");
}

export function rowsToJSON(rows){
  return JSON.stringify(rows??[],null,2);
}
