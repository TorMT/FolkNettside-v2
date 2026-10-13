import {componentSemantic} from "../model/semantic-assembly.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {actuatorDisk} from "./actuator-disk.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";

const EPS=1e-12;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const cross=(a,b)=>[
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0]
];
const norm=a=>Math.hypot(a[0],a[1],a[2]);
const normalize=a=>{
  const n=norm(a);
  if(n<EPS)throw new Error("thruster axis cannot be zero");
  return a.map(v=>v/n);
};

export function transformPoint(matrix,point=[0,0,0],scale=1){
  const m=matrix||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const [x,y,z]=point;
  return [
    (m[0]*x+m[4]*y+m[8]*z+m[12])*scale,
    (m[1]*x+m[5]*y+m[9]*z+m[13])*scale,
    (m[2]*x+m[6]*y+m[10]*z+m[14])*scale
  ];
}

export function transformDirection(matrix,direction=[1,0,0]){
  const m=matrix||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const [x,y,z]=direction;
  return normalize([
    m[0]*x+m[4]*y+m[8]*z,
    m[1]*x+m[5]*y+m[9]*z,
    m[2]*x+m[6]*y+m[10]*z
  ]);
}

export function azimuthAxis(angleDeg,{vertical=0}={}){
  const vz=Number(vertical)||0;
  if(Math.abs(vz)>1)throw new Error("vertical axis component must be between -1 and 1");
  const angle=Number(angleDeg)*Math.PI/180;
  const horizontal=Math.sqrt(Math.max(0,1-vz*vz));
  return normalize([Math.cos(angle)*horizontal,Math.sin(angle)*horizontal,vz]);
}

export function thrusterDirection({axis=[1,0,0],azimuthDeg=null}={}){
  const hasAzimuth=azimuthDeg!==null&&azimuthDeg!==undefined&&azimuthDeg!==""&&Number.isFinite(Number(azimuthDeg));
  return hasAzimuth?azimuthAxis(Number(azimuthDeg)):normalize(axis);
}

export function thrusterForce({thrust,axis=[1,0,0],azimuthDeg=null}){
  const T=Number(thrust);
  if(!Number.isFinite(T))throw new Error("thruster thrust must be finite");
  return mul(thrusterDirection({axis,azimuthDeg}),T);
}

export function thrusterContribution({
  id,name,thrust,diameter=null,inflowSpeed=0,density=1025,
  axis=[1,0,0],azimuthDeg=null,position=[0,0,0],reference=[0,0,0]
}){
  const direction=thrusterDirection({axis,azimuthDeg});
  const force=mul(direction,Number(thrust));
  if(!force.every(Number.isFinite))throw new Error("thruster force must be finite");
  const arm=[position[0]-reference[0],position[1]-reference[1],position[2]-reference[2]];
  const moment=cross(arm,force);

  let disk=null;
  if(Number(diameter)>0&&Number(thrust)>=0){
    disk=actuatorDisk({
      thrust:Number(thrust),diameter:Number(diameter),
      inflowSpeed:Number(inflowSpeed)||0,density:Number(density)||1025
    });
  }

  return {
    id,name,position:[...position],axis:direction,thrust:Number(thrust),
    force,arm,moment,idealPower:disk?.idealPower??null,disk
  };
}

export function analyzeThrusterSystem(thrusters,{reference=[0,0,0]}={}){
  const items=(thrusters||[]).map(thruster=>thrusterContribution({...thruster,reference}));
  const totalForce=items.reduce((sum,item)=>add(sum,item.force),[0,0,0]);
  const totalMoment=items.reduce((sum,item)=>add(sum,item.moment),[0,0,0]);
  return {
    thrusters:items,
    totalForce,totalMoment,
    resultantThrust:norm(totalForce),
    resultantMoment:norm(totalMoment),
    idealPower:items.reduce((sum,item)=>sum+(Number(item.idealPower)||0),0)
  };
}

export function thrustersFromModelDocument(modelDocument){
  const scale=Number(modelDocument?.unitScaleToMeters)||1;
  const thrusters=[];
  for(const component of modelDocument?.components||[]){
    const semantic=componentSemantic(component);
    const propulsion=semantic.thruster;
    if(!propulsion||propulsion.enabled===false)continue;
    const thrustValue=Number(propulsion.thrust);
    if(propulsion.thrust===null||propulsion.thrust===undefined||propulsion.thrust===""||!Number.isFinite(thrustValue))continue;
    const localDirection=thrusterDirection({
      axis:propulsion.axis||[1,0,0],
      azimuthDeg:propulsion.azimuthDeg
    });
    thrusters.push({
      id:component.id,name:component.name,
      type:semantic.subtype||propulsion.type||"thruster",
      subsystem:semantic.subsystem,
      tags:semantic.tags,
      thrust:thrustValue,
      diameter:Number(propulsion.diameter)||null,
      inflowSpeed:Number(propulsion.inflowSpeed)||0,
      density:Number(propulsion.density)||1025,
      axis:transformDirection(component.transform,localDirection),
      // Azimuth is resolved in component-local coordinates before applying
      // the component transform. Do not apply it a second time downstream.
      azimuthDeg:null,
      position:transformPoint(component.transform,propulsion.position||[0,0,0],scale)
    });
  }
  return thrusters;
}
