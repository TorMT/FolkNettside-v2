import {getThreeRuntime} from "../model/three-runtime.js?v=8aa0c11932670c127bfa632341edc0b2d5192849";
import {cellEdges,crystalType,listCrystalTypes,scaledPoints} from "./crystal-structures-core.js?v=8aa0c11932670c127bfa632341edc0b2d5192849";

export function crystalToolHTML(state={type:"bcc",a:1,c:""}){
  const crystal=crystalType(state.type)||crystalType("bcc");
  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / Crystal structures</div>
    <header class="tool-header">
      <div><span class="project-kicker">Materials tool</span><h1>Crystal structures</h1>
      <p>Interactive conventional-cell viewer using the shared Three.js runtime.</p></div>
    </header>
    <section class="crystal-tool-layout">
      <aside class="tool-inputs">
        <label class="field"><span>Structure</span>
          <select id="crystal-type">${listCrystalTypes().map(item=>`<option value="${item.id}" ${item.id===crystal.id?"selected":""}>${item.short} · ${item.name}</option>`).join("")}</select>
        </label>
        <label class="field"><span>Lattice parameter a</span><div><input id="crystal-a" type="number" min="0.01" step="0.1" value="${Number(state.a)||1}"><span>relative</span></div></label>
        ${crystal.cell==="hexagonal"?`<label class="field"><span>c parameter</span><div><input id="crystal-c" type="number" min="0.01" step="0.1" value="${state.c||""}" placeholder="ideal c/a"><span>relative</span></div></label>`:""}
        <div class="readout"><span>Equivalent atoms/cell</span><strong>${crystal.equivalentAtoms}</strong></div>
        <div class="readout"><span>Coordination number</span><strong>${crystal.coordinationNumber}</strong></div>
        ${crystal.idealCA?`<div class="readout"><span>Ideal c/a</span><strong>${crystal.idealCA.toFixed(4)}</strong></div>`:""}
        <p class="muted hydro-note">${crystal.description}</p>
      </aside>
      <section class="crystal-stage-wrap">
        <div id="crystal-stage" class="crystal-stage"></div>
        <div class="model-meta"><span>${crystal.short}</span><span>Render on demand</span><span>Shared Three.js runtime</span></div>
      </section>
    </section>
  </main>`;
}

function addLine(THREE,scene,a,b,material){
  const geometry=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...a),new THREE.Vector3(...b)
  ]);
  const line=new THREE.Line(geometry,material);
  scene.add(line);
  return line;
}

export async function mountCrystalViewer(container,{type="bcc",a=1,c=null}={}){
  const {THREE,OrbitControls}=await getThreeRuntime();
  const canvas=document.createElement("canvas");
  canvas.className="three-canvas";
  container.replaceChildren(canvas);

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x081820);
  const camera=new THREE.PerspectiveCamera(42,1,.01,100);
  camera.position.set(3.2,-4.0,2.8);

  scene.add(new THREE.HemisphereLight(0xd8edf5,0x24313a,2.4));
  const key=new THREE.DirectionalLight(0xffffff,2.2);
  key.position.set(4,-3,6);
  scene.add(key);

  const group=new THREE.Group();
  scene.add(group);
  const atomGeometry=new THREE.SphereGeometry(.11,24,16);
  const atomMaterial=new THREE.MeshStandardMaterial({color:0xb3157a,roughness:.5,metalness:.12});
  const edgeMaterial=new THREE.LineBasicMaterial({color:0x7995a5,transparent:true,opacity:.8});
  const points=scaledPoints(type,{a:Number(a)||1,c:c?Number(c):null});
  for(const point of points){
    const atom=new THREE.Mesh(atomGeometry,atomMaterial);
    atom.position.set(...point);
    group.add(atom);
  }

  const crystal=crystalType(type);
  const cScale=crystal?.cell==="hexagonal"
    ? (c?Number(c):(Number(a)||1)*(crystal.idealCA||1))
    : Number(a)||1;
  const edges=cellEdges(type).map(([p,q])=>[
    [p[0]*(Number(a)||1),p[1]*(Number(a)||1),p[2]*cScale],
    [q[0]*(Number(a)||1),q[1]*(Number(a)||1),q[2]*cScale]
  ]);
  const lines=edges.map(([p,q])=>addLine(THREE,group,p,q,edgeMaterial));

  const box=new THREE.Box3().setFromObject(group);
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  const radius=Math.max(size.length()/2,.5);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=false;
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(radius*1.9,-radius*2.2,radius*1.6));
  controls.update();

  function draw(){renderer.render(scene,camera)}
  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    draw();
  }
  controls.addEventListener("change",draw);
  const observer=new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    cleanup(){
      observer.disconnect();
      controls.dispose();
      atomGeometry.dispose();
      atomMaterial.dispose();
      edgeMaterial.dispose();
      for(const line of lines)line.geometry.dispose();
      renderer.dispose();
    }
  };
}
