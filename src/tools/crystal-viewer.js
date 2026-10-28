import {getThreeRuntime} from "../model/three-runtime.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {crystalEditorPanelHTML} from "./crystal-editor-panel.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {
  cellEdges,crystalPreset,crystalType,distance3,idealHoleCenters,
  listCrystalPresets,listCrystalTypes,replicateCrystal
} from "./crystal-structures-core.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {analyzeCrystal,applyCrystalEdits,bondPairs,closePackedPlaneSpecs,contactTriangles,coordinationPolyhedron,interstitialVoidPolyhedron,millerPlane,periodicImageSites,planeBoxPolygon,planeContactNetwork,polyhedronEdges,sitesNearPlane} from "./crystal-analysis.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";

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
      <p>Shared Three.js crystallography editor with structures, defects, planes, holes, measurement and analysis.</p>
      <div class="tool-parity-banner"><strong>Legacy parity verified:</strong> the v2 tool preserves the full interactive legacy workflow and now adds real coordination polyhedra plus geometric close-packed plane layers.</div></div>
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
            <input id="crystal-nx" aria-label="Replication along X (Nx)" type="number" min="1" max="8" step="1" value="${nx}">
            <input id="crystal-ny" aria-label="Replication along Y (Ny)" type="number" min="1" max="8" step="1" value="${ny}">
            <input id="crystal-nz" aria-label="Replication along Z (Nz)" type="number" min="1" max="8" step="1" value="${nz}">
          </div>
        </div>

        <label class="field"><span>Lattice parameter a</span><div><input id="crystal-a" type="number" min="0.01" step="0.1" value="${Number(state.a)||1}"><span>relative</span></div></label>
        ${crystal.cell==="hexagonal"?`<label class="field"><span>c parameter</span><div><input id="crystal-c" type="number" min="0.01" step="0.1" value="${state.c||""}" placeholder="ideal c/a"><span>relative</span></div></label>`:""}

        <div class="crystal-toggle-grid">
          <button class="btn ${state.showTetra?"primary":""}" id="crystal-tetra">Tetra holes</button>
          <button class="btn ${state.showOcta?"primary":""}" id="crystal-octa">Octa holes</button>
          <button class="btn ${state.measure?"primary":""}" id="crystal-measure">Measure</button>
          <button class="btn" id="crystal-undo-measure">Undo measurement</button>
          <button class="btn" id="crystal-clear-measure">Clear measurements</button>
        </div>

        ${crystalEditorPanelHTML(state)}

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

function disposeObject3D(object){
  object?.traverse?.(node=>{
    node.geometry?.dispose?.();
    if(Array.isArray(node.material)){
      for(const material of node.material)material?.dispose?.();
    }else{
      node.material?.dispose?.();
    }
  });
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

  const baseSites=replicateCrystal(type,{nx,ny,nz,a,c,preset});
  const edited=applyCrystalEdits(baseSites,state.edits||[]);
  const atomSites=edited.sites.filter(site=>site.active!==false);

  // Interstitial geometry is defined by the host packing lattice. For the
  // FCC-derived compounds, use the FCC framework so occupied tetra/octa
  // sites do not accidentally become vertices of their own hole polyhedra.
  const fccHost=["fcc","diamond","nacl","zns","caf2","spinel"].includes(type);
  const holeHostType=fccHost?"fcc":type;
  const holeHostSites=replicateCrystal(holeHostType,{nx,ny,nz,a,c,preset:fccHost?null:preset});
  const cScale=c||a*(crystal?.idealCA||1);
  const periodicVectors=crystal?.cell==="hexagonal"
    ?[
      [1.5*nx*a,(nx%2)*Math.sqrt(3)*a/2,0],
      [0,nz*Math.sqrt(3)*a,0],
      [0,0,ny*cScale]
    ]
    :[[nx*a,0,0],[0,ny*a,0],[0,0,nz*a]];
  const holeNeighbourSites=periodicImageSites(holeHostSites,periodicVectors,{range:1});

  const atomGeometry=new THREE.SphereGeometry(.11*Math.max(.55,Math.min(1.4,a)),24,16);
  const materialCache=new Map();

  function materialForSite(site,index){
    const key=String(site.color||site.species||"A");
    if(!materialCache.has(key)){
      materialCache.set(key,new THREE.MeshStandardMaterial({
        color:site.color||speciesColor(site.species,index),
        roughness:.5,
        metalness:.12
      }));
    }
    return materialCache.get(key);
  }

  const atoms=[];
  const visibility=state.visibility||"both";
  for(const [index,site] of atomSites.entries()){
    const atom=new THREE.Mesh(atomGeometry,materialForSite(site,index));
    const defaultRadius=.11*Math.max(.55,Math.min(1.4,a));
    const radius=Number(site.radius)||defaultRadius;
    atom.scale.setScalar(radius/defaultRadius);
    atom.position.set(...site.pos);
    atom.userData.site=site;
    atom.visible=visibility!=="holes";
    group.add(atom);
    atoms.push(atom);
  }

  const markerObjects=[];
  for(const marker of edited.markers){
    const geometry=new THREE.SphereGeometry(.075*Math.max(.55,Math.min(1.4,a)),16,12);
    const material=new THREE.MeshStandardMaterial({
      color:marker.color||0x4b88c6,
      emissive:marker.color||0x4b88c6,
      emissiveIntensity:.5,
      transparent:true,
      opacity:.92
    });
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(...marker.pos);
    mesh.userData.marker=marker;
    group.add(mesh);
    markerObjects.push(mesh);
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

  function polyhedronGeometry(polyhedron){
    const positions=[];
    for(const face of polyhedron.faces){
      for(const index of face)positions.push(...polyhedron.points[index]);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    return geometry;
  }

  const addHole=(position,kind)=>{
    const neighbourCount=kind==="tetra"?4:6;
    const polyhedron=coordinationPolyhedron(holeNeighbourSites,position,neighbourCount,{distanceTolerance:.07});

    if(polyhedron.valid){
      const voidPolyhedron=interstitialVoidPolyhedron(polyhedron);
      if(voidPolyhedron.valid){
        const geometry=polyhedronGeometry(voidPolyhedron);
        const material=new THREE.MeshStandardMaterial({
          color:kind==="tetra"?0xd36b59:0x4b88c6,
          emissive:kind==="tetra"?0x3b120d:0x0c2c3a,
          emissiveIntensity:.22,
          transparent:true,opacity:.62,wireframe:false,roughness:.38,metalness:.02,
          side:THREE.DoubleSide,depthWrite:false
        });
        const mesh=new THREE.Mesh(geometry,material);
        mesh.visible=visibility!=="atoms";
        mesh.userData.holeKind=kind;
        mesh.userData.coordination=polyhedron.sourceIndices;
        mesh.userData.shellDistance=polyhedron.distances[0]??null;
        mesh.userData.hostRadius=voidPolyhedron.hostRadius;
        mesh.userData.holeRadius=voidPolyhedron.holeRadius;
        mesh.userData.radiusRatio=voidPolyhedron.radiusRatio;
        group.add(mesh);
        holeObjects.push(mesh);

        const edgeMaterial=new THREE.LineBasicMaterial({
          color:kind==="tetra"?0xffb4a8:0x8ed7f5,
          transparent:true,opacity:.98
        });
        for(const [left,right] of polyhedronEdges(voidPolyhedron.faces)){
          const line=addLine(THREE,group,voidPolyhedron.points[left],voidPolyhedron.points[right],edgeMaterial);
          line.visible=visibility!=="atoms";
          line.userData.sharedHoleEdgeMaterial=edgeMaterial;
          holeObjects.push(line);
        }
      }
    }

    // Keep the legacy center cue even when a legacy "hole" label does not
    // have the requested tetra/octa coordination (for example SC body centre).
    const centerGeometry=new THREE.SphereGeometry(.028*Math.max(.55,Math.min(1.4,a)),12,8);
    const centerMaterial=new THREE.MeshBasicMaterial({
      color:kind==="tetra"?0xffd0c7:0xb7e7fb,
      transparent:true,opacity:polyhedron.valid?.72:.35
    });
    const centerMarker=new THREE.Mesh(centerGeometry,centerMaterial);
    centerMarker.position.set(...position);
    centerMarker.visible=visibility!=="atoms";
    centerMarker.userData.holeKind=kind;
    centerMarker.userData.coordinationValid=polyhedron.valid;
    centerMarker.userData.shellSize=polyhedron.shellSize;
    group.add(centerMarker);
    holeObjects.push(centerMarker);
  };
  if(crystal?.cell==="cubic"){
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      if(state.showTetra)for(const p of holes.tetra)addHole([(ix+p[0])*a,(iy+p[1])*a,(iz+p[2])*a],"tetra");
      if(state.showOcta)for(const p of holes.octa)addHole([(ix+p[0])*a,(iy+p[1])*a,(iz+p[2])*a],"octa");
    }
  }else if(crystal?.cell==="hexagonal"){
    const cScale=c||a*(crystal.idealCA||1);
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      const offset=[ix*1.5*a,iz*Math.sqrt(3)*a+(ix%2)*(Math.sqrt(3)*a/2),iy*cScale];
      const transform=p=>[p[0]*a+offset[0],p[1]*a+offset[1],p[2]*cScale+offset[2]];
      if(state.showTetra)for(const p of holes.tetra)addHole(transform(p),"tetra");
      if(state.showOcta)for(const p of holes.octa)addHole(transform(p),"octa");
    }
  }

  const bondObjects=[];
  const bonds=state.showBonds?bondPairs(edited.sites,Number(state.bondThreshold)||1.15*a):[];
  if(state.showBonds){
    const bondMaterial=new THREE.LineBasicMaterial({color:0x8fb1c2,transparent:true,opacity:.45});
    for(const bond of bonds){
      const left=edited.sites[bond.a],right=edited.sites[bond.b];
      if(!left||!right||left.active===false||right.active===false)continue;
      const line=addLine(THREE,group,left.pos,right.pos,bondMaterial);
      line.userData.sharedBondMaterial=bondMaterial;
      bondObjects.push(line);
    }
  }

  const planeObjects=[];
  const planeMetrics=[];

  function crystalBounds(){
    if(!atomSites.length)return {min:[0,0,0],max:[a,a,a]};
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const site of atomSites){
      for(let axis=0;axis<3;axis++){
        min[axis]=Math.min(min[axis],site.pos[axis]);
        max[axis]=Math.max(max[axis],site.pos[axis]);
      }
    }
    const pad=.08*a;
    return {min:min.map(v=>v-pad),max:max.map(v=>v+pad)};
  }

  const visibleBounds=crystalBounds();

  function addPlane(spec,index){
    const basePoint=spec.point||[.5,.5,.5];
    const cellZ=crystal?.cell==="hexagonal"?(c||a*(crystal?.idealCA||1)):a;
    const point=[basePoint[0]*a,basePoint[1]*a,basePoint[2]*cellZ];
    const polygon=planeBoxPolygon(spec.normal,point,visibleBounds);
    if(polygon.length<3)return;

    const center=polygon.reduce((sum,p)=>[
      sum[0]+p[0],sum[1]+p[1],sum[2]+p[2]
    ],[0,0,0]).map(v=>v/polygon.length);

    const positions=[];
    for(let i=0;i<polygon.length;i++){
      const p0=polygon[i],p1=polygon[(i+1)%polygon.length];
      positions.push(...center,...p0,...p1);
    }

    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    const material=new THREE.MeshBasicMaterial({
      color:index%2?0x2f7fa4:0xb3157a,
      transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false
    });
    const mesh=new THREE.Mesh(geometry,material);
    mesh.userData.planeLabel=spec.label;
    mesh.userData.planePolygon=polygon;
    group.add(mesh);
    planeObjects.push(mesh);

    const outlineMaterial=new THREE.LineBasicMaterial({
      color:index%2?0x69b6d9:0xe062b3,transparent:true,opacity:.8
    });
    const outlineGeometry=new THREE.BufferGeometry().setFromPoints(
      [...polygon,polygon[0]].map(p=>new THREE.Vector3(...p))
    );
    const outline=new THREE.Line(outlineGeometry,outlineMaterial);
    group.add(outline);
    planeObjects.push(outline);

    const n=new THREE.Vector3(...spec.normal).normalize();
    const span=Math.max(
      visibleBounds.max[0]-visibleBounds.min[0],
      visibleBounds.max[1]-visibleBounds.min[1],
      visibleBounds.max[2]-visibleBounds.min[2],
      a
    );
    const arrow=new THREE.ArrowHelper(
      n,
      new THREE.Vector3(...center),
      span*.22,
      index%2?0x69b6d9:0xe062b3,
      span*.07,
      span*.035
    );
    arrow.userData.planeLabel=spec.label;
    group.add(arrow);
    planeObjects.push(arrow);

    const tolerance=Math.max(.04*a,span*.015);
    const planeForSites={normal:spec.normal,point};
    const layerSites=state.planeFamily==="close"?holeHostSites:atomSites;
    const near=sitesNearPlane(layerSites,planeForSites,tolerance);
    const network=planeContactNetwork(layerSites,planeForSites,tolerance,{distanceTolerance:.10});
    planeMetrics.push({
      label:spec.label,
      atoms:network.siteIndices.length,
      contacts:network.contacts.length,
      nearestDistance:network.nearestDistance
    });

    const diskRadius=state.planeFamily==="close"&&network.nearestDistance
      ?network.nearestDistance*.49
      :.135*a;
    for(const item of near){
      const site=layerSites[item.index];
      if(!site)continue;
      const diskGeometry=new THREE.CircleGeometry(diskRadius,32);
      const diskMaterial=new THREE.MeshBasicMaterial({
        color:index%2?0x69b6d9:0xe062b3,
        transparent:true,
        opacity:state.planeFamily==="close"?.25:.12,
        side:THREE.DoubleSide,
        depthWrite:false
      });
      const disk=new THREE.Mesh(diskGeometry,diskMaterial);
      disk.position.set(...site.pos);
      disk.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
      disk.renderOrder=18;
      disk.userData.planeAtom=true;
      group.add(disk);
      planeObjects.push(disk);

      const ringGeometry=new THREE.RingGeometry(diskRadius*.92,diskRadius,32);
      const ringMaterial=new THREE.MeshBasicMaterial({
        color:index%2?0x69b6d9:0xe062b3,
        transparent:true,opacity:.92,
        side:THREE.DoubleSide,
        depthTest:false
      });
      const ring=new THREE.Mesh(ringGeometry,ringMaterial);
      ring.position.set(...site.pos);
      ring.quaternion.copy(disk.quaternion);
      ring.renderOrder=20;
      ring.userData.planeAtom=true;
      group.add(ring);
      planeObjects.push(ring);
    }

    if(state.planeFamily==="close"&&network.contacts.length){
      const contactMaterial=new THREE.LineBasicMaterial({
        color:index%2?0xa9e2fa:0xffa6dd,
        transparent:true,opacity:.95,
        depthTest:false
      });
      for(const contact of network.contacts){
        const left=layerSites[contact.a],right=layerSites[contact.b];
        if(!left||!right)continue;
        const line=addLine(THREE,group,left.pos,right.pos,contactMaterial);
        line.renderOrder=19;
        line.userData.planeContact=true;
        line.userData.planeLabel=spec.label;
        planeObjects.push(line);
      }

      const triangles=contactTriangles(network);
      if(triangles.length){
        const trianglePositions=[];
        for(const tri of triangles){
          const p0=layerSites[tri[0]]?.pos,p1=layerSites[tri[1]]?.pos,p2=layerSites[tri[2]]?.pos;
          if(!p0||!p1||!p2)continue;
          trianglePositions.push(...p0,...p1,...p2);
        }
        if(trianglePositions.length){
          const triangleGeometry=new THREE.BufferGeometry();
          triangleGeometry.setAttribute("position",new THREE.Float32BufferAttribute(trianglePositions,3));
          const triangleMaterial=new THREE.MeshBasicMaterial({
            color:index%2?0x69b6d9:0xe062b3,
            transparent:true,opacity:.12,
            side:THREE.DoubleSide,depthWrite:false,depthTest:false
          });
          const triangleMesh=new THREE.Mesh(triangleGeometry,triangleMaterial);
          triangleMesh.renderOrder=17;
          triangleMesh.userData.closePackedTessellation=true;
          triangleMesh.userData.planeLabel=spec.label;
          group.add(triangleMesh);
          planeObjects.push(triangleMesh);
        }
      }
    }
  }
  let planeSpecs=[];
  if(state.planeFamily==="close")planeSpecs=closePackedPlaneSpecs(type);
  else if(state.planeFamily==="miller"){
    try{planeSpecs=[millerPlane(state.h,state.k,state.l)]}catch{}
  }
  planeSpecs.forEach(addPlane);

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
  const canonicalDirection=new THREE.Vector3(1.9,-2.2,1.6).normalize();
  const canonicalDistance=radius*3.35;
  function resetView(){
    controls.target.copy(center);
    camera.position.copy(center).add(canonicalDirection.clone().multiplyScalar(canonicalDistance));
    controls.update();
    draw();
  }
  resetView();

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
  const analysisTarget=root?.querySelector("#crystal-analysis");
  const analysis=analyzeCrystal({structureId:type,preset,baseSites,edits:state.edits||[]});
  if(analysisTarget){
    const composition=Object.entries(analysis.composition).map(([name,value])=>name+":"+value).join(" · ")||"—";
    const defects=Object.entries(analysis.defects).filter(([,value])=>value>0).map(([name,value])=>name+":"+value).join(" · ")||"none";
    const identification=analysis.identification||{};
    analysisTarget.innerHTML=
      '<div class="readout"><span>Identification</span><strong>'+String(identification.type||analysis.structureName)+'</strong></div>'+
      '<div class="readout"><span>Confidence</span><strong>'+String(identification.confidence??0)+'%</strong></div>'+
      '<div class="readout"><span>Coordination</span><strong>'+String(identification.coordination?.mode??analysis.coordinationNumber??"—")+'</strong></div>'+
      '<div class="readout"><span>Composition</span><strong>'+composition+'</strong></div>'+
      '<div class="readout"><span>Active atoms</span><strong>'+analysis.activeAtoms+'</strong></div>'+
      '<div class="readout"><span>Defects</span><strong>'+defects+'</strong></div>'+
      '<div class="readout"><span>Bonds</span><strong>'+bonds.length+'</strong></div>'+
      '<div class="readout"><span>Planes</span><strong>'+planeSpecs.length+'</strong></div>'+
      (planeMetrics.length?'<div class="readout"><span>Plane atoms</span><strong>'+planeMetrics.reduce((sum,item)=>sum+item.atoms,0)+'</strong></div>':'')+
      (state.planeFamily==="close"&&planeMetrics.length?'<div class="readout"><span>In-plane contacts</span><strong>'+planeMetrics.reduce((sum,item)=>sum+item.contacts,0)+'</strong></div>':'');
  }

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

  function undoMeasurement(){
    firstSite=null;
    const item=measurements.pop();
    if(item){
      measurementGroup.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
    }
    updateMeasurementUI();
    draw();
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
    if(!state.measure&&!["vacancy","dopant"].includes(state.editMode))return;
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(atoms,false)[0]?.object;
    if(!hit)return;
    const site=hit.userData.site;

    if(["vacancy","dopant"].includes(state.editMode)){
      container.dispatchEvent(new CustomEvent("crystal-site-edit",{
        bubbles:true,
        detail:{baseIndex:site.baseIndex,pos:[...site.pos]}
      }));
      return;
    }

    if(!firstSite){
      firstSite=site;
      updateMeasurementUI();
    }else{
      addMeasurement(firstSite,site);
      firstSite=null;
    }
  }
  canvas.addEventListener("pointerdown",onPointerDown);

  root?.querySelector("#crystal-undo-measure")?.addEventListener("click",undoMeasurement);
  root?.querySelector("#crystal-clear-measure")?.addEventListener("click",clearMeasurements);
  root?.querySelector("#crystal-reset-view")?.addEventListener("click",resetView);

  controls.addEventListener("change",draw);
  const observer=new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    measurements,
    analysis,
    resetView,
    undoMeasurement,
    clearMeasurements,
    cleanup(){
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointerdown",onPointerDown);
      clearMeasurements();
      atomGeometry.dispose();
      for(const material of materialCache.values())material.dispose();
      edgeMaterial.dispose();
      for(const line of lines)line.geometry.dispose();
      for(const line of bondObjects){
        line.geometry.dispose();
        line.userData.sharedBondMaterial?.dispose?.();
      }
      for(const object of holeObjects)disposeObject3D(object);
      for(const mesh of markerObjects)disposeObject3D(mesh);
      for(const object of planeObjects)disposeObject3D(object);
      renderer.dispose();
    }
  };
}
