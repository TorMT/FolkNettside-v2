export const INPUTS={
  P:{label:"Pressure",unit:"bar"},
  T:{label:"Temperature",unit:"°C"},
  H:{label:"Enthalpy",unit:"kJ/kg"},
  U:{label:"Internal energy",unit:"kJ/kg"},
  S:{label:"Entropy",unit:"kJ/(kg·K)"},
  D:{label:"Density",unit:"kg/m³"},
  Q:{label:"Quality",unit:"0–1"}
};

export const OUTPUTS=[
  ["T","Temperature","°C"],
  ["P","Pressure","bar"],
  ["D","Density","kg/m³"],
  ["H","Enthalpy","kJ/kg"],
  ["S","Entropy","kJ/(kg·K)"],
  ["U","Internal energy","kJ/kg"],
  ["Cp","Cp","kJ/(kg·K)"],
  ["Cv","Cv","kJ/(kg·K)"],
  ["viscosity","Viscosity","Pa·s"],
  ["conductivity","Conductivity","W/(m·K)"],
  ["speed_sound","Speed of sound","m/s"],
  ["Prandtl","Prandtl","—"],
  ["Q","Quality","—"]
];

export const DEFAULT_FLUIDS=[
  "Air","Water","Ammonia","Propane","CO2","Nitrogen","Oxygen","R134a"
];

export function inputToSI(key,value){
  const v=Number(value);
  if(!Number.isFinite(v))throw new Error(`Invalid ${key} input`);
  if(key==="P")return v*1e5;
  if(key==="T")return v+273.15;
  if(key==="H"||key==="U")return v*1e3;
  if(key==="S")return v*1e3;
  return v;
}

export function outputFromSI(key,value){
  const v=Number(value);
  if(!Number.isFinite(v))return null;
  if(key==="P")return v/1e5;
  if(key==="T")return v-273.15;
  if(key==="H"||key==="U")return v/1e3;
  if(key==="S"||key==="Cp"||key==="Cv")return v/1e3;
  return v;
}

export function phaseDescription(raw){
  const phase=String(raw||"").toLowerCase();
  if(phase.includes("twophase"))return "Two-phase";
  if(phase.includes("supercritical"))return "Supercritical";
  if(phase.includes("gas"))return "Gas / superheated vapour";
  if(phase.includes("liquid"))return "Liquid";
  return raw?String(raw):"Unknown";
}

export function computeState(engine,{fluid,input1,value1,input2,value2}){
  if(!engine?.propsSI)throw new Error("CoolProp engine is not ready");
  if(input1===input2)throw new Error("Choose two different independent properties");

  const v1=inputToSI(input1,value1);
  const v2=inputToSI(input2,value2);
  const values={};
  const errors={};

  for(const [key] of OUTPUTS){
    try{
      values[key]=outputFromSI(key,engine.propsSI(key,input1,v1,input2,v2,fluid));
    }catch(error){
      values[key]=null;
      errors[key]=String(error?.message||error);
    }
  }

  let phase="Unknown";
  if(engine.phaseSI){
    try{phase=phaseDescription(engine.phaseSI(input1,v1,input2,v2,fluid))}catch{}
  }

  return {fluid,input1,value1:Number(value1),input2,value2:Number(value2),phase,values,errors};
}
