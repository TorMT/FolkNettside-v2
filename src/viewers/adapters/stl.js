import {fetchText} from "../utils.js";

function parseASCII(text){
  const expression=/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g;
  const vertices=[];let match;
  while((match=expression.exec(text))) vertices.push(match.slice(1).map(Number));
  const triangles=[];
  for(let i=0;i+2<vertices.length;i+=3) triangles.push([vertices[i],vertices[i+1],vertices[i+2]]);
  return triangles;
}

function project([x,y,z]){return [x-y*.72,(x+y)*.22-z*.52]}

function renderTriangles(triangles){
  const projected=triangles.flat().map(project);
  if(!projected.length) return '<text x="20" y="40" fill="white">No ASCII STL triangles found</text>';

  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(720/Math.max(1,maxX-minX),390/Math.max(1,maxY-minY))*.78;
  const convert=point=>[(point[0]-minX)*scale+70,(point[1]-minY)*scale+55];

  return triangles.map((triangle,index)=>{
    const points=triangle.map(vertex=>convert(project(vertex)).join(",")).join(" ");
    const fill=index%3?"rgba(195,219,230,.11)":"rgba(179,21,122,.14)";
    return `<polygon points="${points}" fill="${fill}" stroke="rgba(214,232,240,.72)" stroke-width="1.2"/>`;
  }).join("");
}

export async function render(container,resource){
  const text=await fetchText(resource.path);
  const triangles=parseASCII(text);
  container.innerHTML=`<div class="model-stage">
    <svg class="model-svg" viewBox="0 0 860 500" role="img" aria-label="STL preview">${renderTriangles(triangles)}</svg>
    <div class="model-meta"><span>ASCII STL</span><span>${triangles.length} triangles</span><span>lightweight fixture renderer</span></div>
  </div>`;
  return {info:`${triangles.length} triangles`};
}
