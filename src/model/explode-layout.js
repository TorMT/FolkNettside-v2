/**
 * Deterministic exploded layout for assemblies whose part origins/centres
 * may coincide. Returns offsets in metres, not modified CAD geometry.
 */
export function explodeOffsets(centres,amount=0,{span=1}={}){
 const factor=Number(amount);
 if(!Number.isFinite(factor)||factor<0||factor>3)throw Error("Explode factor outside 0–3");
 if(!(Number.isFinite(span)&&span>0))throw Error("Assembly span must be positive");
 if(!Array.isArray(centres)||centres.some(c=>!Array.isArray(c)||c.length!==3||!c.every(Number.isFinite)))
   throw Error("Valid part centres required");
 if(!centres.length)return [];
 if(factor===0)return centres.map(()=>[0,0,0]);
 const global=centres.reduce((sum,c)=>sum.map((v,j)=>v+c[j]),[0,0,0]).map(v=>v/centres.length);
 return centres.map((centre,i)=>{
   let direction=centre.map((v,j)=>v-global[j]);
   let length=Math.hypot(...direction);
   if(length<span*1e-5){
     // Fibonacci-sphere directions prevent stacked, concentric parts from
     // staying overlapped while preserving stable layout on slider changes.
     const z=1-2*(i+.5)/centres.length,theta=i*2.399963229728653;
     const radial=Math.sqrt(Math.max(0,1-z*z));
     direction=[radial*Math.cos(theta),radial*Math.sin(theta),z];
     length=1;
   }
   const distance=factor*(.14*span+.34*Math.min(length,span));
   return direction.map(v=>v/length*distance);
 });
}
