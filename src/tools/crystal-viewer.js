import {getThreeRuntime} from "../model/three-runtime.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1";
import {
  cellEdges,crystalPreset,crystalType,distance3,idealHoleCenters,
  listCrystalPresets,listCrystalTypes,replicateCrystal
} from "./crystal-structures-core.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1";

const SPECIES_COLORS={
  A:0xb3157a,B:0x2f7fa4,O:0xd9e7ed,
  Fe:0x9aa6ad,C:0x3e4850,Cr:0x8097a5,Ni:0x8ca0ad,Cu:0xc67d42,
  Al:0xb9c6cc,Si:0x7c8fa0,Na:0x8a70cf,Mg:0x7aa86e
};

function option(value,label,current){
  return `<option value="${value}" ${String(value)===String(current)?"selected":""}>${label}</option>`;
}

export function crystalToolHTML(state={}){
  const type=state.type||"bcc";
  const crystal=crystalType(type)||crystalType("bcc");
  const preset=state.preset||"";
  const nx=Number(state.nx)||1,ny=Number(state.ny)||1,nz=Number(state.nz)||1;

  return `<main class="tool-page">
    <div class="crumbs">Courses / Tools / Crystal structures</div>
    <header class="tool-header">
      <div><span class="project-kicker">Materials tool</span><h1>Crystal structures</h1>
      <p>Shared Three.js crystallography viewer. Legacy structures and material presets are being migrated without removing the full legacy tool.</p>
      <div class="tool-parity-banner"><strong>Migration in progress:</strong> structures, replication, presets, hole visualization and measurement are now in v2. Defects, Miller planes, manual atoms and analyzer remain available in the <a href="https://tormt.folk.ntnu.no/Tools/KrystallStrukturer/krystall-viewer.html" target="_blank" rel="noopener">full legacy tool ↗</a>.</div></div>
    </header>

    <section class="crystal-tool-layout">
      <aside class="tool-inputs crystal-controls">
        <label class="field"><span>Structure</span>
          <select id="crystal-type">${listCrystalTypes().map(item=>option(item.id,`${item.short} · ${item.name}`,crystal.id)).join("")}</select>
        </label>
        <label class="field"><span>Material preset</span>
          <select id="crystal-preset">
            <option value="">None</option>
            ${listCrystalPresets().map(item=>option(item.id,`${item.label} · ${crystalType(item.structure)?.short||item.structure}`,preset)).join("")}
          </select>
        </label>

        <div class="field">
          <span>Replication Nx × Ny × Nz</span>
          <div class="crystal-replication">
            <input id="crystal-nx" type="number" min="1" max="8" step="1" value="${nx}">
            <input id="crystal-ny" type="number" min="1" max="8" step="1" value="${ny}">
            <input id="crystal-nz" type="number" min="1" max="8" step="1" value="${nz}">
          </div>
        </div>

        <label class="field"><span>Lattice parameter a</span><div><input id="crystal-a" type="number" min="0.01" step="0.1" value="${Number(state.a)||1}"><span>relative</span></div></label>
        ${crystal.cell==="hexagonal"?`<label class="field"><span>c parameter</span><div><input id="crystal-c" type="number" min="0.01" step="0.1" value="${state.c||""}" placeholder="ideal c/a"><span>relative</span></div></label>`:""}

        <div class="crystal-toggle-grid">
          <button class="btn ${state.showTetra?"primary":""}" id="crystal-tetra">Tetra holes</button>
          <button class="btn ${state.showOcta?"primary":""}" id="crystal-octa">Octa holes</button>
          <button class="btn ${state.measure?"primary":""}" id="crystal-measure">Measure</button>
          <button class="btn" id="crystal-clear-measure">Clear measurements</button>
        </div>

        <div class="readout"><span>Equivalent atoms/cell</span><strong>${crystal.equivalentAtoms??"—"}</strong></div>
        <div class="readout"><span>Coordination number</span><strong>${crystal.coordinationNumber??"—"}</strong></div>
        ${crystal.idealCA?`<div class="readout"><span>Ideal c/a</span><strong>${crystal.idealCA.toFixed(4)}</strong></div>`:""}
        <div class="readout"><span>Rendered atoms</span><strong id="crystal-atom-count">—</strong></div>
        <p class="muted hydro-note">${crystal.description}</p>
        <div id="crystal-measurements" class="crystal-measurements muted">No measurements.</div>
      </aside>

      <section class="crystal-stage-wrap">
        <div id="crystal-stage" class="crystal-stage"></div>
        <div class="model-meta"><span>${crystal.short}</span><span>Render on demand</span><span>Shared Three.js runtime</span></div>
      </section>
    </section>
  </main>`;
}

function addLine(THREE,scene,a,b,material){
  const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);
  const line=new THREE.Line(geometry,material);
  scene.add(line);
  return line;
}

function speciesColor(species,index){
  if(SPECIES_COLORS[species]!==undefined)return SPECIES_COLORS[species];
  const palette=[0xb3157a,0x2f7fa4,0xd08a3e,0x729d61,0x8170ba,0x9f657f];
  return palette[index%palette.length];
}

export async function mountCrystalViewer(container,state={}){
  const type=state.type||"bcc";
  const a=Number(state.a)||1;
  const c=state.c?Number(state.c):null;
  const nx=Math.max(1,Math.min(8,Number(state.nx)||1));
  const ny=Math.max(1,Math.min(8,Number(state.ny)||1));
  const nz=Math.max(1,Math.min(8,Number(state.nz)||1));
  const preset=state.preset||null;
  const crystal=crystalType(type);
  const {THREE,OrbitControls}=await getThreeRuntime();

  const canvas=document.createElement("canvas");
  canvas.className="three-canvas";
  container.replaceChildren(canvas);

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x081820);
  const camera=new THREE.PerspectiveCamera(42,1,.01,1000);
  scene.add(new THREE.HemisphereLight(0xd8edf5,0x24313a,2.4));
  const key=new THREE.DirectionalLight(0xffffff,2.2);
  key.position.set(4,-3,6);
  scene.add(key);

  const group=new THREE.Group();
  scene.add(group);

  const atomSites=replicateCrystal(type,{nx,ny,nz,a,c,preset});
  const species=[...new Set(atomSites.map(site=>site.species))];
  const atomGeometry=new THREE.SphereGeometry(.11*Math.max(.55,Math.min(1.4,a)),24,16);
  const materialBySpecies=new Map(species.map((name,index)=>[
    name,new THREE.MeshStandardMaterial({color:speciesColor(name,index),roughness:.5,metalness:.12})
  ]));

  const atoms=[];
  for(const site of atomSites){
    const atom=new THREE.Mesh(atomGeometry,materialBySpecies.get(site.species));
    atom.position.set(...site.pos);
    atom.userData.site=site;
    group.add(atom);
    atoms.push(atom);
  }

  const edgeMaterial=new THREE.LineBasicMaterial({color:0x7995a5,transparent:true,opacity:.8});
  const lines=[];
  const baseEdges=cellEdges(type);
  if(crystal?.cell==="cubic"){
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      for(const [p,q] of baseEdges){
        lines.push(addLine(THREE,group,
          [(ix+p[0])*a,(iy+p[1])*a,(iz+p[2])*a],
          [(ix+q[0])*a,(iy+q[1])*a,(iz+q[2])*a],
          edgeMaterial
        ));
      }
    }
  }else{
    const cScale=c||a*(crystal?.idealCA||1);
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      const offset=[ix*1.5*a,iz*Math.sqrt(3)*a+(ix%2)*(Math.sqrt(3)*a/2),iy*cScale];
      for(const [p,q] of baseEdges){
        lines.push(addLine(THREE,group,
          [p[0]*a+offset[0],p[1]*a+offset[1],p[2]*cScale+offset[2]],
          [q[0]*a+offset[0],q[1]*a+offset[1],q[2]*cScale+offset[2]],
          edgeMaterial
        ));
      }
    }
  }

  const holeObjects=[];
  const holes=idealHoleCenters(type);
  const addHole=(position,kind)=>{
    const geometry=kind==="tetra"
      ?new THREE.TetrahedronGeometry(.12*a)
      :new THREE.OctahedronGeometry(.13*a);
    const material=new THREE.MeshStandardMaterial({
      color:kind==="tetra"?0xd36b59:0x4b88c6,
      transparent:true,opacity:.38,wireframe:false,roughness:.45,metalness:.02
    });
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(...position);
    group.add(mesh);
    holeObjects.push(mesh);
  };
  if(crystal?.cell==="cubic"){
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      if(state.showTetra)for(const p of holes.tetra)addHole([(ix+p[0])*a,(iy+p[1])*a,(iz+p[2])*a],"tetra");
      if(state.showOcta)for(const p of holes.octa)addHole([(ix+p[0])*a,(iy+p[1])*a,(iz+p[2])*a],"octa");
    }
  }

  const measurementGroup=new THREE.Group();
  group.add(measurementGroup);
  const measurements=[];
  let firstSite=null;

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

  function addMeasurement(aSite,bSite){
    const start=aSite.pos,end=bSite.pos;
    const distance=distance3(start,end);
    const material=new THREE.LineBasicMaterial({color:0xf2b84b});
    const line=addLine(THREE,measurementGroup,start,end,material);
    measurements.push({distance,start:[...start],end:[...end],line,material});
    updateMeasurementUI();
  }

  const root=container.closest(".crystal-tool-layout");
  const count=root?.querySelector("#crystal-atom-count");
  if(count)count.textContent=String(atomSites.length);
  const measurementList=root?.querySelector("#crystal-measurements");

  function updateMeasurementUI(){
    if(!measurementList)return;
    if(!measurements.length){
      measurementList.textContent=firstSite?"Select second atom.":"No measurements.";
      return;
    }
    measurementList.innerHTML=measurements.map((item,index)=>
      `<div><strong>#${index+1}</strong> ${item.distance.toFixed(4)} relative units</div>`
    ).join("");
  }

  function clearMeasurements(){
    firstSite=null;
    for(const item of measurements){
      measurementGroup.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
    }
    measurements.length=0;
    updateMeasurementUI();
    draw();
  }

  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  function onPointerDown(event){
    if(!state.measure)return;
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(atoms,false)[0]?.object;
    if(!hit)return;
    const site=hit.userData.site;
    if(!firstSite){
      firstSite=site;
      updateMeasurementUI();
    }else{
      addMeasurement(firstSite,site);
      firstSite=null;
    }
  }
  canvas.addEventListener("pointerdown",onPointerDown);

  root?.querySelector("#crystal-clear-measure")?.addEventListener("click",clearMeasurements);

  controls.addEventListener("change",draw);
  const observer=new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    measurements,
    cleanup(){
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointerdown",onPointerDown);
      clearMeasurements();
      atomGeometry.dispose();
      for(const material of materialBySpecies.values())material.dispose();
      edgeMaterial.dispose();
      for(const line of lines)line.geometry.dispose();
      for(const mesh of holeObjects){mesh.geometry.dispose();mesh.material.dispose()}
      renderer.dispose();
    }
  };
}
