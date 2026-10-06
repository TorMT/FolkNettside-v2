export const FLUIDS={
  air:{name:"Luft",density:[1.2922,-0.0045,0,0],viscosity:[1.716e-5,5e-8,-3e-11,0],cp:[1005,0.017,0.00001,0],k:[0.02428,0.0000758,-1e-8,0],rangeC:[15,100],note:"Legacy fit at approximately 1 atm."},
  water:{name:"Vann",density:[999.8,-0.06,-0.0048,0],viscosity:[0.001792,-0.00005,1.5e-6,-2e-8],cp:[4217,-1.3,0.009,0],k:[0.569,0.0017,-6e-6,0],rangeC:[0,100],note:"Legacy polynomial fit."},
  co2:{name:"Karbondioksid",density:[1.977,-0.0073,0,0],viscosity:[1.37e-5,5e-8,0,0],cp:[820,0.45,0.0005,0],k:[0.0146,0.00007,0,0],rangeC:null,note:"Legacy normal-pressure fit; explicit validity range was not documented."},
  argon:{name:"Argon",density:[1.784,-0.0066,0,0],viscosity:[2.1e-5,5.5e-8,0,0],cp:[520,0,0,0],k:[0.0163,0.00005,0,0],rangeC:null,note:"Legacy normal-pressure fit; explicit validity range was not documented."},
  helium:{name:"Helium",density:[0.1785,-0.00066,0,0],viscosity:[1.865e-5,3.8e-8,0,0],cp:[5193,0,0,0],k:[0.142,0.00036,0,0],rangeC:null,note:"Legacy normal-pressure fit; explicit validity range was not documented."},
  nitrogen:{name:"Nitrogen",density:[1.251,-0.0046,0,0],viscosity:[1.663e-5,5e-8,0,0],cp:[1040,0.01,0,0],k:[0.0242,0.00007,0,0],rangeC:null,note:"Legacy normal-pressure fit; explicit validity range was not documented."}
};

export function toCelsius(value,unit="C"){
  const t=Number(value);
  if(!Number.isFinite(t))throw new Error("Temperature must be finite");
  if(unit==="C")return t;
  if(unit==="F")return (t-32)*5/9;
  if(unit==="K")return t-273.15;
  throw new Error(`Unsupported temperature unit: ${unit}`);
}

export function polynomial(coefficients,t){
  return coefficients[0]+coefficients[1]*t+coefficients[2]*t*t+coefficients[3]*t*t*t;
}

export function fluidProperties(fluidId,temperature,unit="C"){
  const fluid=FLUIDS[fluidId];
  if(!fluid)throw new Error(`Unknown fluid: ${fluidId}`);
  const temperatureC=toCelsius(temperature,unit);
  const temperatureK=temperatureC+273.15;
  if(temperatureK<=0)throw new Error("Temperature must be above absolute zero");

  const density=polynomial(fluid.density,temperatureC);
  const dynamicViscosity=polynomial(fluid.viscosity,temperatureC);
  const cp=polynomial(fluid.cp,temperatureC);
  const conductivity=polynomial(fluid.k,temperatureC);

  if(!(density>0&&dynamicViscosity>0&&cp>0&&conductivity>0)){
    throw new Error("Legacy polynomial produced a non-physical property at this temperature");
  }

  const warnings=[];
  if(fluid.rangeC&&(temperatureC<fluid.rangeC[0]||temperatureC>fluid.rangeC[1])){
    warnings.push(`Outside documented legacy fit range ${fluid.rangeC[0]}–${fluid.rangeC[1]} °C`);
  }
  if(!fluid.rangeC)warnings.push("Legacy source did not document an explicit validity range for this fluid");

  const kinematicViscosity=dynamicViscosity/density;
  const thermalDiffusivity=conductivity/(density*cp);
  const prandtl=dynamicViscosity*cp/conductivity;
  const thermalExpansion=1/temperatureK;

  return {
    fluidId,name:fluid.name,temperatureC,temperatureK,
    density,dynamicViscosity,kinematicViscosity,cp,conductivity,
    thermalDiffusivity,prandtl,thermalExpansion,
    warnings,note:fluid.note
  };
}
