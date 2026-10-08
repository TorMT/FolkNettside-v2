import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {executeHydroRequest} from "../src/hydro/hydro-service.js";
import {hydrostaticParticulars,rectangularBargeStability} from "../src/hydro/stability.js";
import {auditHydroCurve,draftSolutionResidual} from "../src/hydro/numerical-audit.js";
import {hydroPanelHTML} from "../src/engineering/hydro-panel.js";

const L=10,B=4,H=3,T=1,KG=0.5,RHO=1025;
const near=(a,b,tol=1e-6)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
  `Expected ${a} within ${tol} of ${b}`);
function block({origin=[0,0,0],size=[L,B,H],scale=1}={}){
 const geometry=boxMesh({L:size[0],B:size[1],H:size[2],origin});
 return {name:"10 x 4 x 3 test block",unitScaleToMeters:scale,components:[{
   id:"external-hull",name:"Closed box",geometry,metadata:{hydro:true}
 }]};
}
const dispatch=(model,type,payload)=>executeHydroRequest(model,type,payload);

test("ALL block hydrostatics: volume, mass, buoyancy, Awp, LCF, TPC, Ixx/Iyy/Ixy, BM, KM, GM",()=>{
 const model=block();
 const validation=dispatch(model,"validate");
 assert.equal(validation.passed,true,JSON.stringify(validation.errors));
 const r=dispatch(model,"analyze",{waterline:T});
 near(r.volume,L*B*T);
 near(r.centerOfBuoyancy[0],0);near(r.centerOfBuoyancy[1],0);near(r.centerOfBuoyancy[2],T/2);
 near(r.waterplane.area,L*B);
 near(r.waterplane.centroid[0],0);near(r.waterplane.centroid[1],0);
 near(r.waterplane.ixx,L*B**3/12);near(r.waterplane.iyy,B*L**3/12);near(r.waterplane.ixy,0);
 const p=hydrostaticParticulars(r,{density:RHO,kg:KG});
 near(p.displacementTonnes,41);
 near(p.waterplaneArea,40);near(p.tonnesPerCm,0.41);
 near(p.kb,0.5);near(p.bmTransverse,4**2/(12*T));near(p.bmLongitudinal,10**2/(12*T));
 near(p.kmTransverse,.5+4**2/12);near(p.kmLongitudinal,.5+10**2/12);
 near(p.gmTransverse,4**2/12);near(p.gmLongitudinal,10**2/12);
 near(p.principalMomentMajor,10**2*4/12*10);
 near(p.principalMomentMinor,10*4**3/12);
 const analytical=rectangularBargeStability({L,B,T,kg:KG});
 near(p.gmTransverse,analytical.gmTransverse);
 near(p.gmLongitudinal,analytical.gmLongitudinal);
});
test("ALL block hydrostatic curves and inverse draft: 11 draft samples, no skipped or non-monotone values",()=>{
 const m=block();
 const curve=dispatch(m,"curve",{minWaterline:.25,maxWaterline:2.75,samples:11});
 assert.equal(curve.length,11);
 assert.equal(auditHydroCurve(curve).status,"pass");
 for(const point of curve){
   near(point.volume,40*point.waterline);
   near(point.waterplane.area,40);
   near(point.centerOfBuoyancy[2],point.waterline/2);
 }
 const solved=dispatch(m,"solve",{targetVolume:52,minWaterline:0,maxWaterline:3,tolerance:1e-8,maxIterations:80});
 near(solved.waterline,1.3,1e-7);
 assert.equal(solved.converged,true);
 assert.equal(draftSolutionResidual(solved,52,1e-8).passed,true);
 assert.throws(()=>dispatch(m,"solve",{targetVolume:140,minWaterline:0,maxWaterline:3}),/outside the bracket/);
});
test("signed block GZ: ±5° and ±10° righting arms, moments, density and analytic wall-sided formula",()=>{
 const m=block(),target=40;
 const curve=dispatch(m,"gz",{targetVolume:target,kg:KG,density:RHO,minHeel:-10,maxHeel:10,step:5});
 assert.deepEqual(curve.map(p=>p.heelDeg),[-10,-5,0,5,10]);
 for(const point of curve){
   near(point.volume,target,1e-6);
   near(point.displacementMass,41000);
   near(point.rightingMoment,point.gz*41000*9.80665,1e-4);
 }
 for(const degrees of [5,10]){
   const pos=curve.find(x=>x.heelDeg===degrees);
   const neg=curve.find(x=>x.heelDeg===-degrees);
   near(pos.gz,-neg.gz,2e-5);
   near(pos.rightingMoment,-neg.rightingMoment,.5);
   // Wall-sided GZ = sin(phi) * (GMt + BMt/2 * tan²(phi)).
   const phi=degrees*Math.PI/180;
   const reference=Math.sin(phi)*((4**2/12)+.5*(4**2/12)*Math.tan(phi)**2);
   near(pos.gz,reference,.004);
 }
 near(curve[2].gz,0,1e-12);
});
test("ALL block attitude controls: heel, trim, yaw at zero, sampling and constant displaced volume",()=>{
 const m=block(),options={targetVolume:40,centerOfGravity:[0,0,KG],density:RHO};
 const upright=dispatch(m,"attitude",{...options,heelDeg:0,trimDeg:0,yawDeg:0});
 near(upright.waterline,1);near(upright.volume,40);
 near(upright.rollLever,0);near(upright.pitchLever,0);
 near(upright.rollMoment,0);near(upright.pitchMoment,0);
 const heelPlus=dispatch(m,"attitude",{...options,heelDeg:5});
 const heelMinus=dispatch(m,"attitude",{...options,heelDeg:-5});
 near(heelPlus.volume,40);near(heelMinus.volume,40);
 near(heelPlus.rollLever,-heelMinus.rollLever,2e-5);
 near(heelPlus.rollMoment,-heelMinus.rollMoment,1);
 const trimPlus=dispatch(m,"attitude",{...options,trimDeg:3});
 const trimMinus=dispatch(m,"attitude",{...options,trimDeg:-3});
 near(trimPlus.pitchLever,-trimMinus.pitchLever,2e-5);
 const heelCurve=dispatch(m,"attitudeCurve",{...options,axis:"heel",start:-5,end:5,step:5});
 const trimCurve=dispatch(m,"attitudeCurve",{...options,axis:"trim",start:-3,end:3,step:3});
 assert.deepEqual(heelCurve.map(x=>x.heelDeg),[-5,0,5]);
 assert.deepEqual(trimCurve.map(x=>x.trimDeg),[-3,0,3]);
 for(const point of [...heelCurve,...trimCurve])near(point.volume,40);
});
test("ALL block equilibrium: shifted LCG solves trim, shifted TCG solves heel and unbracketed root errors",()=>{
 const m=block();
 for(const [axis,cg] of [["heel",[0,.1,KG]],["trim",[.35,0,KG]]]){
   const result=dispatch(m,"equilibrium",{
      axis,minAngle:-12,maxAngle:12,targetVolume:40,
      centerOfGravity:cg,leverTolerance:1e-6,maxIterations:80
   });
   assert.equal(result.axis,axis);
   near(result.volume,40,1e-6);
   assert.ok(Math.abs(result.residual)<=1e-6,`Unconverged ${axis}: ${result.residual}`);
   assert.ok(Math.abs(result.equilibriumAngle)<=12);
 }
 assert.throws(()=>dispatch(m,"equilibrium",{axis:"trim",minAngle:0,maxAngle:1,
   targetVolume:40,centerOfGravity:[2,0,KG]}),/No trim equilibrium bracketed/);
});
test("block UI reports actual computed geometry and stable controls without fabricating numeric approvals",()=>{
 const m=block();
 const result=dispatch(m,"analyze",{waterline:1});
 const curve=dispatch(m,"curve",{minWaterline:.25,maxWaterline:1.75,samples:7});
 const gz=dispatch(m,"gz",{targetVolume:40,kg:KG,minHeel:-10,maxHeel:10,step:5});
 const solved=dispatch(m,"solve",{targetVolume:40,minWaterline:0,maxWaterline:3});
 const panel=hydroPanelHTML({modelDocument:m,result,curve,gz,solved,draft:1,kg:KG,
   lcg:0,tcg:0,config:{minDraft:0,maxDraft:3,density:RHO}});
 assert.equal(panel.qualityAudit.status,"pass");
 assert.equal(panel.gmCrossCheck.status,"pass");
 assert.match(panel.summary,/41\.00 t/);
 assert.match(panel.results,/40\.000 m²/);
 assert.match(panel.results,/0\.410 t\/cm/);
 for(const action of ["hydro-solve","hydro-gz","hydro-attitude","hydro-equilibrium-heel",
   "hydro-equilibrium-trim","hydro-export-table","hydro-export-gz"]){
   assert.match(panel.inspector+panel.results,new RegExp(`id="${action}"`),action);
 }
});
test("invalid box surfaces fail closed for every numerical Hydro operation",()=>{
 const m=block();m.components[0].geometry.indices.splice(0,6);
 assert.equal(dispatch(m,"validate").passed,false);
 for(const [type,payload] of [
   ["analyze",{waterline:1}],["curve",{minWaterline:0,maxWaterline:2,samples:5}],
   ["solve",{targetVolume:40,minWaterline:0,maxWaterline:3}],
   ["attitude",{targetVolume:40,centerOfGravity:[0,0,KG]}],
   ["attitudeCurve",{targetVolume:40,centerOfGravity:[0,0,KG]}],
   ["equilibrium",{targetVolume:40,centerOfGravity:[0,0,KG]}],
   ["gz",{targetVolume:40,kg:KG}]]){
   assert.throws(()=>dispatch(m,type,payload),/Hydro preflight blocked/);
 }
});

test("invalid curve steps and insufficient equilibrium iterations explicitly fail, never loop indefinitely",()=>{
 const m=block();
 for(const [type,payload] of [
   ["gz",{targetVolume:40,kg:KG,minHeel:-10,maxHeel:10,step:0}],
   ["gz",{targetVolume:40,kg:KG,minHeel:-10,maxHeel:10,step:.0001}],
   ["attitudeCurve",{axis:"heel",start:-10,end:10,step:0,targetVolume:40,centerOfGravity:[0,0,KG]}],
   ["attitudeCurve",{axis:"trim",start:-10,end:10,step:.0001,targetVolume:40,centerOfGravity:[0,0,KG]}]
 ]){
   assert.throws(()=>dispatch(m,type,payload),/positive step|sample limit/);
 }
 assert.throws(()=>dispatch(m,"equilibrium",{axis:"heel",minAngle:-12,maxAngle:12,
   targetVolume:40,centerOfGravity:[0,.1,KG],leverTolerance:1e-12,
   maxIterations:1}),e=>e.code==="EQUILIBRIUM_NOT_CONVERGED");
});
