import {createModelDocument} from "../model/model-document.js";

export function threeObjectToModel(object,{name="3D model",format="3D",unit="meter",
  maxTriangles=350000}={}){
  if(!object||typeof object.traverse!=="function"||
     typeof object.updateMatrixWorld!=="function")
    throw new Error("3D model root must be a loaded Three.js object");
  object.updateMatrixWorld(true);
  const components=[];
  let tris=0;
  object.traverse(child=>{
    if(!child.isMesh)return;
    const g=child.geometry,pos=g?.getAttribute?.("position");
    if(!pos||pos.count<3)return;
    const indexed=g.getIndex?.();
    const triangles=indexed?indexed.count/3:pos.count/3;
    tris+=triangles;
    if(!Number.isInteger(triangles)||tris>maxTriangles)
      throw new Error("3D preview exceeds the supported triangle count");
    const p=[];
    const v={x:0,y:0,z:0,applyMatrix4(matrix){
      const e=matrix.elements,x=this.x,y=this.y,z=this.z;
      this.x=e[0]*x+e[4]*y+e[8]*z+e[12];
      this.y=e[1]*x+e[5]*y+e[9]*z+e[13];
      this.z=e[2]*x+e[6]*y+e[10]*z+e[14];
      return this;
    }};
    for(let i=0;i<pos.count;i++){
      v.x=pos.getX(i);v.y=pos.getY(i);v.z=pos.getZ(i);
      v.applyMatrix4(child.matrixWorld);
      if(![v.x,v.y,v.z].every(Number.isFinite))
        throw new Error("Imported 3D mesh has non-finite vertices");
      p.push(v.x,v.y,v.z);
    }
    const indices=indexed?Array.from({length:indexed.count},(_,i)=>indexed.getX(i)):null;
    components.push({id:"imported-mesh-"+(components.length+1),
      name:String(child.name||"Mesh "+(components.length+1)),
      type:"component",geometry:{positions:p,indices},
      metadata:{sourceFormat:format,viewerOnly:true,unitAssumption:unit}});
  });
  if(!components.length)throw new Error("3D file contains no triangular mesh");
  const document=createModelDocument({name,format,unit,components});
  document.source={format,unitAssumption:unit,viewerOnly:true,triangleCount:tris};
  return document;
}
