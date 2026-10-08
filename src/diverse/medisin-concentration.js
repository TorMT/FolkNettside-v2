// Pure SI-based concentration conversion. No dose recommendations.
const AMOUNT_MASS={g:1,mg:1e-3,mcg:1e-6};
const AMOUNT_MOL={mol:1,mmol:1e-3,umol:1e-6,nmol:1e-9};
const VOLUMES={L:1,mL:1e-3,uL:1e-6};
export const CONCENTRATION_UNITS=["mg/mL","mg/L","mg/uL","mcg/mL","mcg/uL","g/L","mol/L","mmol/L","umol/L","nmol/L"];
function positive(name,value,required=true){
  if(value===""||value===null||value===undefined){
    if(!required)return null;
    throw new Error(name+" mangler.");
  }
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)throw new Error(name+" må være positivt.");
  return n;
}
export function medisinConcentrations({amount,amountUnit,volume,volumeUnit,molecularWeight=""}){
  const value=positive("Stoffmengde",amount),v=positive("Volum",volume);
  if(!Object.hasOwn(VOLUMES,volumeUnit))throw new Error("Ukjent volumenhet.");
  if(!Object.hasOwn(AMOUNT_MASS,amountUnit)&&!Object.hasOwn(AMOUNT_MOL,amountUnit))
    throw new Error("Ukjent mengdeenhet.");
  const mw=positive("Molekylvekt (g/mol)",molecularWeight,false);
  const l=v*VOLUMES[volumeUnit];
  const massG=Object.hasOwn(AMOUNT_MASS,amountUnit)?value*AMOUNT_MASS[amountUnit]:
    mw?value*AMOUNT_MOL[amountUnit]*mw:null;
  const mol=Object.hasOwn(AMOUNT_MOL,amountUnit)?value*AMOUNT_MOL[amountUnit]:
    mw?value*AMOUNT_MASS[amountUnit]/mw:null;
  const gL=massG===null?null:massG/l;
  const molL=mol===null?null:mol/l;
  const output={
    "mg/mL":gL,"mg/L":gL===null?null:gL*1000,
    "mg/uL":gL===null?null:gL/1000,
    "mcg/mL":gL===null?null:gL*1000,
    "mcg/uL":gL,"g/L":gL,
    "mol/L":molL,"mmol/L":molL===null?null:molL*1000,
    "umol/L":molL===null?null:molL*1e6,
    "nmol/L":molL===null?null:molL*1e9
  };
  return {concentrations:output,volumeL:l,amountG:massG,amountMol:mol,molecularWeight:mw};
}
export function medisinSolutionVolume({totalAmount,totalUnit,diluentVolume,diluentUnit,targetAmount,targetUnit,molecularWeight=""}){
  const total=medisinConcentrations({amount:totalAmount,amountUnit:totalUnit,volume:diluentVolume,volumeUnit:diluentUnit,molecularWeight});
  const target=medisinConcentrations({amount:targetAmount,amountUnit:targetUnit,volume:1,volumeUnit:"L",molecularWeight});
  const canMass=total.amountG!==null&&target.amountG!==null;
  const canMol=total.amountMol!==null&&target.amountMol!==null;
  if(!canMass&&!canMol)throw new Error("Molekylvekt trengs for å konvertere mellom masse og mol.");
  const ratio=canMass?target.amountG/total.amountG:target.amountMol/total.amountMol;
  return {fraction:ratio,volumeML:ratio*total.volumeL*1000,volumeUL:ratio*total.volumeL*1e6,
    withinMix:ratio<=1};
}
