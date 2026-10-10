import {componentSemantic} from "./semantic-assembly.js?v=aea0dc54b4840d4b95c890f209b51965789e75ca";
import {transformPoint,transformDirection} from "../propulsion/thruster-system.js?v=aea0dc54b4840d4b95c890f209b51965789e75ca";

const finite3=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
function normalized(v){
 if(!finite3(v))throw Error("A finite three-dimensional thruster axis is required");
 const n=Math.hypot(...v);
 if(n<1e-10)throw Error("Thruster axis must not be zero");
 return v.map(value=>value/n);
}
/** Thrust +axis means WATER is accelerated -axis.
 * Intake is on the +axis side; rings visually move towards the disk (-axis).
 * These are direction markers only, never CFD velocity streamlines.
 */
export function intakeFlowDescriptor({id,position,thrustAxis,diameter,source="manual"}){
 const axis=normalized(thrustAxis);
 if(!finite3(position))throw Error("Thruster centre must be an XYZ vector in metres");
 if(!(Number(diameter)>0&&Number(diameter)<=200&&Number.isFinite(Number(diameter))))
   throw Error("Thruster diameter must be a finite positive number in metres");
 const diameterM=Number(diameter);
 return {id:String(id),position:[...position],axis,
   intakeSide:axis,flowDirection:axis.map(value=>-value),
   diameterM,source,kind:"illustrative-intake"};
}
export function bboxCenter(geometry){
 const p=geometry?.positions;
 if(!p||p.length<3)return [0,0,0];
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.length;i+=3)for(let axis=0;axis<3;axis++){
   const n=Number(p[i+axis]);
   if(!Number.isFinite(n))throw Error("Non-finite source mesh coordinate");
   lo[axis]=Math.min(lo[axis],n);hi[axis]=Math.max(hi[axis],n);
 }
 return lo.map((value,i)=>(value+hi[i])/2);
}
export function identifiedThrusterIntakes(documentModel){
 const scale=documentModel?.unitScaleToMeters??1;
 return (documentModel?.components||[]).flatMap(component=>{
   const config=componentSemantic(component).thruster;
   if(!config||config.enabled===false)return [];
   // Rated power, arbitrary component name or thrust alone do NOT identify
   // the direction in which the inlet points. Explicit axis & disk required.
   if(!finite3(config.axis)||!(Number(config.diameter)>0))return [];
   try{
     const origin=Array.isArray(config.position)?config.position:bboxCenter(component.geometry);
     return [intakeFlowDescriptor({
       id:component.id,
       position:transformPoint(component.transform,origin,scale),
       thrustAxis:transformDirection(component.transform,config.axis),
       diameter:Number(config.diameter),
       source:"model-metadata"
     })];
   }catch{return []}
 });
}
export function modelThrusterCandidates(documentModel){
 return (documentModel?.components||[]).filter(component=>component.geometry&&
   (componentSemantic(component).role==="thruster"||
    /thruster|propeller|azimuth|rim.?drive|propuls/i.test(component.name||"")));
}

/** User-labeled visual inlet on a selected component; axis is explicit and
 * expressed in the model's X/Y/Z reference system, not inferred from name.
 */
export function manualThrusterAtComponent(model,componentId,{thrustAxis,diameter}){
 const component=model.components.find(c=>c.id===componentId);
 if(!component?.geometry)throw Error("Select a CAD component with geometry");
 const scale=model.unitScaleToMeters??1;
 return intakeFlowDescriptor({
   id:component.id,
   position:transformPoint(component.transform,bboxCenter(component.geometry),scale),
   thrustAxis:normalized(thrustAxis),
   diameter,source:"manual-direction-only"
 });
}
