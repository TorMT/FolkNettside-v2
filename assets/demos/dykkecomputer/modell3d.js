/* Light 3D viewer for the dive computer page: rev B3 GLB with explode, groups and picking.
 * Same three.js build as the site's CAD tool (esm.sh three@0.180.0). */
import {DIVE_PARTS} from "../../../src/engineering/dive-parts.js";

const THREE_URL = "https://esm.sh/three@0.180.0";
const GLB_URL = "../../models/dykkecomputer-revb3.glb";

export async function mount({stage, msg, pick, explode, groups, views}) {
  msg.textContent = "Laster 3D-modellen …";
  const [THREE, {OrbitControls}, {GLTFLoader}] = await Promise.all([
    import(THREE_URL),
    import(THREE_URL + "/examples/jsm/controls/OrbitControls.js"),
    import(THREE_URL + "/examples/jsm/loaders/GLTFLoader.js")
  ]);
  const gltf = await new GLTFLoader().loadAsync(GLB_URL);

  const byNode = new Map(DIVE_PARTS.map(p => [p.node, p]));
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(0.3, 0.6, 0.4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(-0.4, -0.2, -0.5); scene.add(rim);

  /* GLB is z-up in metres; turn it to three's y-up and work in millimetres */
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; root.scale.setScalar(1000); scene.add(root);
  const model = gltf.scene; root.add(model);
  model.updateMatrixWorld(true);

  const parts = [];
  const whole = new THREE.Box3();
  model.traverse(o => {
    if (!o.isMesh) return;
    const node = o.name && byNode.has(o.name) ? o.name : o.parent?.name;
    const meta = byNode.get(node) || {label: node || "Del", viewerGroup: "Annet"};
    o.material = o.material.clone();
    if (/lens|display-glass/.test(node)) { o.material.transparent = true; o.material.opacity = 0.28; o.material.depthWrite = false; }
    o.geometry.computeBoundingBox();
    const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld.clone().premultiply(new THREE.Matrix4().copy(model.matrixWorld).invert()));
    whole.union(box);
    parts.push({mesh: o, node, meta, center: box.getCenter(new THREE.Vector3()), home: o.position.clone(), baseOpacity: o.material.opacity, baseTransparent: o.material.transparent});
  });
  const c = whole.getCenter(new THREE.Vector3()), size = whole.getSize(new THREE.Vector3());
  model.position.sub(c); // centre at origin (model space, z-up, metres)
  for (const p of parts) {
    const d = p.center.clone().sub(c);
    /* push mostly along the stack (z) so the layers separate, a little outwards in-plane */
    p.dir = new THREE.Vector3(d.x * 0.7, d.y * 0.7, d.z * 2.6 + Math.sign(d.z || 1) * size.z * 0.1);
    // convert model-space offset to the mesh parent's local space (parents are untransformed groups in this GLB)
    p.local = p.dir.clone();
  }

  const camera = new THREE.PerspectiveCamera(35, 4 / 3, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  const radius = Math.max(size.x, size.y, size.z) * 1000 / 2;
  const setView = name => {
    const r = radius * 4.2;
    const dirs = {iso: [0.55, 0.62, 0.75], top: [0.0001, 1, 0.0001], side: [0, 0.18, 1]};
    const v = new THREE.Vector3(...(dirs[name] || dirs.iso)).normalize().multiplyScalar(r * (1 + explodeAmount * 0.9));
    camera.position.copy(v); controls.target.set(0, 0, 0); controls.update();
  };

  msg.remove();
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "3D-modell av dykkecomputeren rev B3. Dra for å rotere.");
  renderer.domElement.tabIndex = 0;

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  };
  let dirty = true;
  new ResizeObserver(resize).observe(stage);
  controls.addEventListener("change", () => { dirty = true; });

  /* explode */
  let explodeAmount = 0;
  const applyExplode = () => {
    for (const p of parts) p.mesh.position.copy(p.home).addScaledVector(p.local, explodeAmount);
    dirty = true;
  };
  explode.disabled = false;
  explode.addEventListener("input", () => {
    const before = 1 + explodeAmount * 0.9;
    explodeAmount = explode.value / 100; applyExplode();
    camera.position.multiplyScalar((1 + explodeAmount * 0.9) / before); controls.update();
  });

  /* groups */
  const groupNames = [...new Set(parts.map(p => p.meta.viewerGroup))].sort((a, b) => a.localeCompare(b, "nb"));
  const state = {hidden: new Set(), solo: null, picked: null};
  const paint = () => {
    for (const p of parts) {
      const g = p.meta.viewerGroup;
      p.mesh.visible = !state.hidden.has(g);
      const ghost = state.solo && state.solo !== g;
      const tr = ghost || p.baseTransparent;
      if (p.mesh.material.transparent !== tr) { p.mesh.material.transparent = tr; p.mesh.material.needsUpdate = true; }
      p.mesh.material.opacity = ghost ? 0.07 : p.baseOpacity;
      p.mesh.material.depthWrite = !p.mesh.material.transparent;
      p.mesh.material.emissive?.setHex(p === state.picked ? 0x2a6fd6 : 0x000000);
    }
    groups.querySelectorAll("label").forEach(l => l.classList.toggle("solo", l.dataset.group === state.solo));
    dirty = true;
  };
  groups.replaceChildren(...groupNames.map(g => {
    const n = parts.filter(p => p.meta.viewerGroup === g).length;
    const label = document.createElement("label"); label.dataset.group = g;
    const box = document.createElement("input"); box.type = "checkbox"; box.checked = true;
    box.addEventListener("change", () => { box.checked ? state.hidden.delete(g) : state.hidden.add(g); paint(); });
    const name = document.createElement("span"); name.textContent = g;
    const count = document.createElement("span"); count.className = "n"; count.textContent = n;
    label.append(box, name, count);
    label.addEventListener("click", e => { if (e.target === box) return; e.preventDefault(); state.solo = state.solo === g ? null : g; paint(); });
    label.title = "Klikk for å vise bare denne gruppen; avkrysningen skjuler den";
    return label;
  }));

  for (const b of views) b.addEventListener("click", () => {
    if (b.dataset.view === "all") { state.hidden.clear(); state.solo = null; state.picked = null; groups.querySelectorAll("input").forEach(i => { i.checked = true; }); pick.hidden = true; paint(); return; }
    setView(b.dataset.view);
  });

  /* picking */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(parts.filter(p => p.mesh.visible && !(state.solo && p.meta.viewerGroup !== state.solo)).map(p => p.mesh), false);
    const hit = hits.find(h => !(h.object.material.transparent && h.object.material.opacity < 0.3)) || hits[0];
    state.picked = hit ? parts.find(p => p.mesh === hit.object) : null;
    pick.hidden = !state.picked;
    if (state.picked) pick.firstElementChild.textContent = state.picked.meta.label + " · " + state.picked.meta.viewerGroup;
    paint();
  });

  setView("iso"); resize(); paint();
  const loop = () => {
    requestAnimationFrame(loop);
    if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; }
  };
  loop();
  return {parts: parts.length};
}
