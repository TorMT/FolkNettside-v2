import {createModelDocument} from "../model/model-document.js?v=1a5d33cf26324c375016ebf9780d16b2bf5c8fad";
/**
 * Convert a THREE scene (glTF/OBJ) to the existing, read-only ModelDocument.
 * Apply each object's full world matrix before passing coordinates to the
 * shared model viewer. Geometry preview is not certified for Hydro.
 */
export function modelDocumentFromThree({scene,name="Imported 3D model",format="3D",unit="meter"}={}){
  if(!scene?.traverse)throw new Error("3D loader did not return a scene");
  scene.updateMatrixWorld(true);
  const components=[];
  let totalVertices=0,totalTriangles=0;
  scene.traverse(object=>{
    if(!object.isMesh||!object.geometry?.attributes?.position)return;
    const geom=object.geometry;
    const position=geom.attributes.position;
    if(position.itemSize!==3)return;
    totalVertices+=position.count;
    if(totalVertices>1_000_000)throw new Error("3D preview exceeds 1 million vertices");
    const positions=[];
    // Explicit matrix multiplication in THREE's column-major convention.
    const m=object.matrixWorld.elements;
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      positions.push(
        m[0]*x+m[4]*y+m[8]*z+m[12],
        m[1]*x+m[5]*y+m[9]*z+m[13],
        m[2]*x+m[6]*y+m[10]*z+m[14]
      );
    }
    let indices;
    if(geom.index)indices=Array.from(geom.index.array);
    else indices=Array.from({length:position.count},(_,i)=>i);
    if(indices.length%3!==0)throw new Error("3D mesh triangle index count is not divisible by three");
    totalTriangles+=indices.length/3;
    if(totalTriangles>1_500_000)throw new Error("3D preview exceeds triangle limit");
    components.push({
      id:"mesh-"+(components.length+1),
      name:object.name||"Mesh "+(components.length+1),
      geometry:{positions,indices},
      metadata:{source:"gltf-obj-visual-preview",hydro:false,uncertified:true}
    });
  });
  if(!components.length)throw new Error("3D file has no triangulated mesh objects");
  const model=createModelDocument({name,format,unit,components});
  model.visualPreviewOnly=true;
  return model;
}
