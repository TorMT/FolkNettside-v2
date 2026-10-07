export const IDENTITY_4=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

export function multiplyMatrix(a,b){
  const out=new Array(16).fill(0);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++){
    for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];
  }
  return out;
}

export function attitudeMatrix({heel=0,trim=0,yaw=0}={}){
  const x=Number(heel||0)*Math.PI/180;
  const y=Number(trim||0)*Math.PI/180;
  const z=Number(yaw||0)*Math.PI/180;
  const cx=Math.cos(x),sx=Math.sin(x);
  const cy=Math.cos(y),sy=Math.sin(y);
  const cz=Math.cos(z),sz=Math.sin(z);

  const rx=[1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1];
  const ry=[cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1];
  const rz=[cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1];
  return multiplyMatrix(multiplyMatrix(rz,ry),rx);
}

export function transformPoint(matrix,point=[0,0,0]){
  const m=matrix||IDENTITY_4;
  const [x,y,z]=point;
  return [
    m[0]*x+m[4]*y+m[8]*z+m[12],
    m[1]*x+m[5]*y+m[9]*z+m[13],
    m[2]*x+m[6]*y+m[10]*z+m[14]
  ];
}

export function transformedModelDocument(modelDocument,attitude={}){
  const global=attitudeMatrix(attitude);
  return {
    ...modelDocument,
    components:(modelDocument?.components||[]).map(component=>({
      ...component,
      transform:multiplyMatrix(global,component.transform||IDENTITY_4)
    }))
  };
}
