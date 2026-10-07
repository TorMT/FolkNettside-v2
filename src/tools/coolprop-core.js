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

export const COOLPROP_OUTPUT_ALIASES={
  Cp:["Cp","Cpmass","C","CPMASS"],
  Cv:["Cv","Cvmass","O","CVMASS"],
  speed_sound:["speed_sound","speed_of_sound","A","SPEED_OF_SOUND"],
  viscosity:["viscosity","V","VISCOSITY"],
  conductivity:["conductivity","L","CONDUCTIVITY"],
  Prandtl:["Prandtl","PRANDTL"]
};

export function propsSIOutput(engine,key,input1,value1SI,input2,value2SI,fluid){
  const candidates=COOLPROP_OUTPUT_ALIASES[key]||[key];
  let lastError=null;
  for(const candidate of candidates){
    try{
      const value=engine.propsSI(candidate,input1,value1SI,input2,value2SI,fluid);
      if(Number.isFinite(Number(value)))return {value:Number(value),key:candidate};
      lastError=new Error(`${candidate} returned a non-finite value`);
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error(`CoolProp output unavailable: ${key}`);
}

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

export const TABLE_REFERENCE_PROFILES={
  Air:{
    id:"air-table-a22",
    label:"Air · Table A-22",
    source:"Course Table A-22 · Ideal Gas Properties of Air",
    calibration:{
      T:1000,
      P:1e5,
      H:1046.04e3,
      U:758.94e3,
      S:2.96770e3
    },
    checkpoints:[
      {T:300,H:300.19e3,U:214.07e3,S:1.70203e3},
      {T:400,H:400.98e3,U:286.16e3,S:1.99194e3},
      {T:1000,H:1046.04e3,U:758.94e3,S:2.96770e3},
      {T:1200,H:1277.79e3,U:933.33e3,S:3.17888e3}
    ]
  }
};

const tableReferenceOffsetCache=new WeakMap();

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

export const COOLPROP_PHASE_INDEX={
  0:"liquid",
  1:"supercritical",
  2:"supercritical_gas",
  3:"supercritical_liquid",
  4:"critical_point",
  5:"gas",
  6:"twophase",
  7:"unknown",
  8:"not_imposed"
};

export function phaseDescription(raw){
  const numeric=Number(raw);
  const normalized=Number.isFinite(numeric)&&String(raw).trim()!==""?
    (COOLPROP_PHASE_INDEX[Math.round(numeric)]||"unknown"):
    String(raw||"").toLowerCase();
  if(normalized.includes("twophase"))return "Two-phase";
  if(normalized.includes("critical_point"))return "Critical point";
  if(normalized.includes("supercritical_gas"))return "Supercritical gas";
  if(normalized.includes("supercritical_liquid"))return "Supercritical liquid";
  if(normalized.includes("supercritical"))return "Supercritical";
  if(normalized.includes("gas"))return "Gas / superheated vapour";
  if(normalized.includes("liquid"))return "Liquid / subcooled";
  return normalized&&normalized!=="unknown"&&normalized!=="not_imposed"?String(raw):"Unknown";
}

export function tableReferenceProfile(fluid){
  const normalized=String(fluid||"").toLowerCase();
  return Object.values(TABLE_REFERENCE_PROFILES).find(profile=>
    profile.id.startsWith(normalized+"-")||profile.label.toLowerCase().startsWith(normalized+" ")
  )||null;
}

export function tableReferenceOffsets(engine,fluid="Air"){
  const profile=tableReferenceProfile(fluid);
  if(!profile||!engine?.propsSI)return {};
  let byFluid=tableReferenceOffsetCache.get(engine);
  if(!byFluid){
    byFluid=new Map();
    tableReferenceOffsetCache.set(engine,byFluid);
  }
  if(byFluid.has(profile.id))return byFluid.get(profile.id);

  const offsets={};
  const {T,P}=profile.calibration;
  for(const prop of ["H","U","S"]){
    const target=Number(profile.calibration[prop]);
    if(!Number.isFinite(target))continue;
    try{
      const raw=Number(engine.propsSI(prop,"T",T,"P",P,fluid));
      if(Number.isFinite(raw))offsets[prop]=target-raw;
    }catch{}
  }
  byFluid.set(profile.id,offsets);
  return offsets;
}

function supportsTableReference(fluid,prop){
  return Boolean(tableReferenceProfile(fluid))&&["H","U","S"].includes(prop);
}

export function applyBookBasis(engine,fluid,prop,value,enabled=false){
  if(!enabled||!supportsTableReference(fluid,prop))return value;
  return Number(value)+(tableReferenceOffsets(engine,fluid)[prop]||0);
}

export function removeBookBasis(engine,fluid,prop,value,enabled=false){
  if(!enabled||!supportsTableReference(fluid,prop))return value;
  return Number(value)-(tableReferenceOffsets(engine,fluid)[prop]||0);
}

export function verifyTableReference(engine,fluid="Air"){
  const profile=tableReferenceProfile(fluid);
  if(!profile)throw new Error(`No table reference profile for ${fluid}`);
  return profile.checkpoints.map(reference=>{
    const values={},errors={};
    for(const prop of ["H","U","S"]){
      try{
        const raw=engine.propsSI(prop,"T",reference.T,"P",profile.calibration.P,fluid);
        const adjusted=applyBookBasis(engine,fluid,prop,raw,true);
        values[prop]=adjusted;
        errors[prop]=adjusted-reference[prop];
      }catch(error){
        values[prop]=null;
        errors[prop]=null;
      }
    }
    return {...reference,values,errors};
  });
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

  const engineValuesSI={};
  const valuesSI={};
  const values={};
  const errors={};

  for(const [key] of OUTPUTS){
    try{
      const {value:raw}=propsSIOutput(engine,key,input1,value1SI,input2,value2SI,fluid);
      engineValuesSI[key]=raw;
      const adjusted=applyBookBasis(engine,fluid,key,raw,bookBasis);
      valuesSI[key]=adjusted;
      values[key]=outputFromSI(key,adjusted,units);
    }catch(error){
      engineValuesSI[key]=null;
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
  if(phase==="Unknown"){
    try{
      phaseRaw=engine.propsSI("Phase",input1,value1SI,input2,value2SI,fluid);
      phase=phaseDescription(phaseRaw);
    }catch{}
  }

  return {
    fluid,input1,input2,value1SI,value2SI,
    engineValuesSI,valuesSI,values,phase,phaseRaw,errors
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
  const value1SI=removeBookBasis(engine,fluid,input1,inputToSI(input1,value1,units),bookBasis);
  const value2SI=removeBookBasis(engine,fluid,input2,inputToSI(input2,value2,units),bookBasis);
  return computeStateSI(engine,{
    fluid,input1,value1SI,
    input2,value2SI,
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

    const constantValue=previous.engineValuesSI?.[rule.constant]??removeBookBasis(
      engine,fluid,rule.constant,previous.valuesSI[rule.constant],bookBasis
    );
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
        value2SI:removeBookBasis(
          engine,fluid,step.targetType,inputToSI(step.targetType,step.targetValue,units),bookBasis
        ),
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
