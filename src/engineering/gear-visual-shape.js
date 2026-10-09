/** Approximate visually helical teeth; NOT involute CAD geometry. */
export function conceptualHelicalToothGeometry(THREE,{
 pitchRadius,radialSize,tangentialSize,width,helixAngleDeg=0
}){
 const radius=Number(pitchRadius),b=Number(helixAngleDeg),w=Number(width);
 if(!(radius>0&&w>0&&radialSize>0&&tangentialSize>0))throw Error("Positive gear visual dimensions required");
 if(!Number.isFinite(b)||Math.abs(b)>=75)throw Error("Unsupported visual helix angle");
 const geo=new THREE.BoxGeometry(radialSize,tangentialSize,w,1,1,12);
 const pos=geo.getAttribute("position"),tan=Math.tan(b*Math.PI/180);
 for(let i=0;i<pos.count;i++){
   const z=pos.getZ(i),x=radius+pos.getX(i),y=pos.getY(i),angle=z*tan/radius;
   pos.setXY(i,x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle));
 }
 pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
 return geo;
}
