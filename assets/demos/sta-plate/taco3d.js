/* Taco test viewer: the same Donut 22 wing, cloth-simulated on four setups
 * (D12 twinset, single tank on the STA, single + plate v0.2, single + frame v0.3).
 * Geometry in millimetres; the GLB keeps the simulation's own axes
 * (x across, y towards the tank/end view, z along the spine). */

const THREE_URL = globalThis.STA_THREE_URL || "https://esm.sh/three@0.180.0";
const ADDONS_URL = globalThis.STA_THREE_ADDONS || THREE_URL + "/examples/jsm";
const GLB_URL = new URL("./taco-oppsett.glb", import.meta.url).href;

export const TACO_SETUPS = {
  D12: "D12 dobbelsett",
  single: "Enkeltflaske på STA",
  plate: "Enkeltflaske + plate v0.2",
  v03: "Enkeltflaske + rammeplate v0.3"
};

const kindOf = k => k.includes("vinge") ? "wing" : /flaske|ventil|manifold/.test(k) ? "tank" : k.includes("backplate") ? "bp" : "hw";
const looks = k =>
  k.includes("vinge") ? [0x2b2f33, {r: 0.9}] :
  k.includes("flaske") ? [0xe9e4d6, {r: 0.4}] :
  /ventil|manifold/.test(k) ? [0xc9ced2, {m: 0.8, r: 0.3}] :
  k.endsWith("_plate") ? [0xff6a2b, {r: 0.6}] :
  k.includes("backplate") ? [0x9aa3a8, {m: 0.7, r: 0.35}] :
  k.includes("sta") ? [0xc0c7cc, {m: 0.7, r: 0.35}] : [0x222222, {}];

export async function mount({stage, msg, cap, tabs, toggles, views, onSetup}) {
  msg.textContent = "Laster simuleringene …";
  const [THREE, {OrbitControls}, {GLTFLoader}] = await Promise.all([
    import(THREE_URL),
    import(ADDONS_URL + "/controls/OrbitControls.js"),
    import(ADDONS_URL + "/loaders/GLTFLoader.js")
  ]);
  const gltf = await new GLTFLoader().loadAsync(GLB_URL);

  const meshes = new Map();
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    const name = o.name && /_/.test(o.name) ? o.name : o.parent?.name;
    const [col, opt] = looks(name);
    o.material = new THREE.MeshStandardMaterial({color: col, roughness: opt.r ?? 0.7, metalness: opt.m || 0, side: THREE.DoubleSide});
    if (name.includes("vinge") || !o.geometry.getAttribute("normal")) { o.geometry.deleteAttribute("normal"); o.geometry.computeVertexNormals(); }
    meshes.set(name, o);
  });
  const all = [...meshes.values()];
  for (const m of all) m.removeFromParent();

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3c3e, 1.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.6); d1.position.set(500, 800, 700); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.6); d2.position.set(-600, -300, -600); scene.add(d2);
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 8000);
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  msg.remove();
  stage.prepend(renderer.domElement);

  const groups = {};
  const build = c => {
    if (groups[c]) return groups[c];
    const root = new THREE.Group(), g = {wing: new THREE.Group(), tank: new THREE.Group(), bp: new THREE.Group(), hw: new THREE.Group()};
    for (const [k, m] of meshes) {
      if (!(k.startsWith(c + "_") || k === "felles_backplate")) continue;
      g[kindOf(k)].add(k === "felles_backplate" ? m.clone() : m);
    }
    Object.values(g).forEach(x => root.add(x));
    root.userData.g = g;
    return (groups[c] = root);
  };
  let shown = null, cur = "v03", dirty = true;
  const applyVis = () => { if (shown) for (const i of toggles) shown.userData.g[i.dataset.k].visible = i.checked; dirty = true; };
  const show = c => {
    cur = c;
    if (shown) scene.remove(shown);
    shown = build(c); scene.add(shown);
    for (const b of tabs) b.setAttribute("aria-pressed", String(b.dataset.c === c));
    cap.textContent = TACO_SETUPS[c];
    applyVis();
    onSetup?.(c);
  };
  const VIEWS = {end: [0, 1150, 60], iso: [880, 600, 950], back: [0, -20, -1150]};
  const setView = v => {
    camera.position.set(...VIEWS[v]);
    camera.up.set(0, v === "end" ? 0 : 1, v === "end" ? 1 : 0);
    controls.target.set(0, -40, 50); controls.update(); dirty = true;
    for (const b of views) b.setAttribute("aria-pressed", String(b.dataset.view === v));
  };
  for (const i of toggles) i.addEventListener("change", applyVis);
  for (const b of tabs) b.addEventListener("click", () => show(b.dataset.c));
  for (const b of views) b.addEventListener("click", () => setView(b.dataset.view));
  controls.addEventListener("change", () => { dirty = true; });

  const resize = () => {
    const w = stage.clientWidth || 640, h = stage.clientHeight || 420;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  };
  new ResizeObserver(resize).observe(stage);
  resize(); show(cur); setView("iso");
  const loop = () => { requestAnimationFrame(loop); if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; } };
  loop();
  return {show, setView, renderer, meshes: meshes.size};
}
