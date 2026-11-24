/* 3D viewer for the STA plate v0.4 page: six printable parts, shown as one
 * assembled plate, exploded, or laid out one by one. Same three.js build as
 * the rest of the site (esm.sh three@0.180.0). The GLB is in millimetres, z-up
 * (x = width, y = along the spine, z = towards the tank). */

const THREE_URL = globalThis.STA_THREE_URL || "https://esm.sh/three@0.180.0";
const ADDONS_URL = globalThis.STA_THREE_ADDONS || THREE_URL + "/examples/jsm";
const GLB_URL = new URL("./sta-plate-v04.glb", import.meta.url).href;

export const STA_PARTS = [
  {node: "nedre_V", label: "Nedre venstre", size: "173 × 200 × 42 mm", volume: 251},
  {node: "nedre_H", label: "Nedre høyre", size: "173 × 200 × 42 mm", volume: 251},
  {node: "midt_V", label: "Midt venstre", size: "173 × 180 × 42 mm", volume: 226},
  {node: "midt_H", label: "Midt høyre", size: "173 × 180 × 42 mm", volume: 226},
  {node: "ovre_V", label: "Øvre venstre", size: "173 × 135 × 42 mm", volume: 171},
  {node: "ovre_H", label: "Øvre høyre", size: "173 × 135 × 42 mm", volume: 171}
];
const ROW = {nedre: -1, midt: 0, ovre: 1};

/* target offset (mm, model space) for each layout */
function layoutOffset(mode, node, center) {
  const [seg, side] = node.split("_");
  const sx = side === "H" ? 1 : -1, row = ROW[seg];
  if (mode === "exploded") return [sx * 45, row * 60, 0];
  if (mode === "separate") return [sx * 115 - center.x, row * 235 - center.y, -center.z + 21];
  return [0, 0, 0];
}

export async function mount({stage, msg, pick, list, modes, views}) {
  msg.textContent = "Laster 3D-modellen …";
  const [THREE, {OrbitControls}, {GLTFLoader}] = await Promise.all([
    import(THREE_URL),
    import(ADDONS_URL + "/controls/OrbitControls.js"),
    import(ADDONS_URL + "/loaders/GLTFLoader.js")
  ]);
  const gltf = await new GLTFLoader().loadAsync(GLB_URL);

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5563, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(300, 600, 400); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(-400, -200, -500); scene.add(rim);

  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scene.add(root);
  const model = gltf.scene; root.add(model); model.updateMatrixWorld(true);

  const meta = new Map(STA_PARTS.map(p => [p.node, p]));
  const parts = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    const node = meta.has(o.name) ? o.name : o.parent?.name;
    if (!meta.has(node)) return;
    o.material = o.material.clone();
    o.material.side = THREE.DoubleSide;
    o.geometry.computeBoundingBox();
    const center = o.geometry.boundingBox.getCenter(new THREE.Vector3());
    parts.push({mesh: o, node, meta: meta.get(node), center, home: o.position.clone(), from: o.position.clone(), to: o.position.clone(), color: o.material.color.clone()});
  });
  if (!parts.length) throw new Error("fant ingen deler i modellen");

  const camera = new THREE.PerspectiveCamera(35, 1, 1, 20000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  msg.remove();
  stage.prepend(renderer.domElement);

  const state = {mode: "assembled", solo: null, picked: null, view: "iso"};
  let dirty = true, anim = null;
  const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const bounds = () => {
    const box = new THREE.Box3();
    for (const p of parts) if (p.mesh.visible) box.expandByObject(p.mesh);
    return box;
  };
  function setView(v) {
    state.view = v;
    const box = bounds(), c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() * 0.5 || 300;
    const dirs = {iso: [0.75, 0.75, 0.9], tank: [0.15, 1.0, 0.35], wing: [0.5, -0.9, 0.7], top: [0, 1, 0.001]};
    const d = new THREE.Vector3(...(dirs[v] || dirs.iso)).normalize();
    const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.95;
    camera.position.copy(c).addScaledVector(d, dist);
    camera.up.set(0, v === "top" ? 0 : 1, v === "top" ? -1 : 0);
    controls.target.copy(c); camera.lookAt(c); controls.update();
    for (const b of views) b.setAttribute("aria-pressed", String(b.dataset.view === v));
    dirty = true;
  }
  function paint() {
    for (const p of parts) {
      const dim = state.solo && state.solo !== p.node;
      p.mesh.visible = !(state.mode === "separate" && dim);
      p.mesh.material.transparent = dim; p.mesh.material.opacity = dim ? 0.18 : 1; p.mesh.material.depthWrite = !dim;
      p.mesh.material.color.copy(p.color);
      if (state.picked === p) p.mesh.material.color.lerp(new THREE.Color(0xffffff), 0.25);
      p.mesh.material.needsUpdate = true;
    }
    for (const b of list.querySelectorAll("button[data-node]")) b.setAttribute("aria-pressed", String(b.dataset.node === state.solo));
    dirty = true;
  }
  function setMode(m) {
    state.mode = m;
    for (const p of parts) {
      const [dx, dy, dz] = layoutOffset(m, p.node, p.center);
      p.from.copy(p.mesh.position);
      p.to.set(p.home.x + dx, p.home.y + dy, p.home.z + dz);
    }
    for (const b of modes) b.setAttribute("aria-pressed", String(b.dataset.mode === m));
    paint();
    const finish = () => { for (const p of parts) p.mesh.position.copy(p.to); anim = null; setView(state.view); };
    if (reduce) return finish();
    anim = {t0: performance.now(), dur: 700, finish};
  }
  function describe(p) {
    pick.hidden = !p;
    if (p) pick.firstElementChild.textContent = `${p.meta.label} · ${p.meta.size} · ca. ${p.meta.volume} cm³`;
  }

  list.textContent = "";
  for (const p of STA_PARTS) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.node = p.node; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="sw sw-${p.node.split("_")[0]}" aria-hidden="true"></span>${p.label}<span class="n">${p.size.split(" × ")[1]} mm</span>`;
    b.addEventListener("click", () => {
      state.solo = state.solo === p.node ? null : p.node;
      state.picked = parts.find(x => x.node === state.solo) || null;
      describe(state.picked); paint();
      if (state.mode === "separate") setView(state.view);
    });
    list.append(b);
  }
  for (const b of modes) b.addEventListener("click", () => setMode(b.dataset.mode));
  for (const b of views) b.addEventListener("click", () => setView(b.dataset.view));

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(parts.filter(p => p.mesh.visible && !p.mesh.material.transparent).map(p => p.mesh), false)[0];
    state.picked = hit ? parts.find(p => p.mesh === hit.object) : null;
    describe(state.picked); paint();
  });
  controls.addEventListener("change", () => { dirty = true; });

  function resize() {
    const w = stage.clientWidth || 640, h = stage.clientHeight || 480;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize(); setMode("assembled"); setView("iso");

  const loop = now => {
    requestAnimationFrame(loop);
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      for (const p of parts) p.mesh.position.lerpVectors(p.from, p.to, e);
      dirty = true;
      if (k >= 1) anim.finish();
    }
    if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; }
  };
  requestAnimationFrame(loop);
  return {parts: parts.length, setMode, setView, renderer};
}
