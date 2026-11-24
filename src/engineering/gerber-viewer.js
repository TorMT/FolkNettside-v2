// Gerber viewer: loads a fabrication ZIP (nested ZIPs allowed) or loose Gerber/drill files and draws them on a canvas.
// Views: realistic top, realistic bottom (mirrored as seen from below) and single layers. Wheel/pinch zoom, drag to pan.
// Everything runs in the browser; local files are never uploaded.
import {parseGerber, parseExcellon, classifyLayer, outlineLoops} from "./gerber.js?v=13299706290abf016e20abe6dc9136a9c38fd389";
import {getJSZip} from "../vendor/jszip.js?v=13299706290abf016e20abe6dc9136a9c38fd389";

const T = {
  en: {top: "Top", bottom: "Bottom", layers: "Layers", fit: "Fit", board: "Board", loading: "Loading Gerber files…",
       none: "No Gerber layers found.", size: "Board", holes: "holes", layer: "layers", open: "Open Gerber ZIP or files",
       hint: "Drag to pan, scroll or pinch to zoom, double-click to fit.", cursor: "Cursor", from: "from the lower-left corner",
       roles: {copper: "Copper", mask: "Solder mask", silk: "Silkscreen", paste: "Paste", outline: "Outline", drill: "Drills", other: "Other"},
       sides: {top: "top", bottom: "bottom", inner: "inner", all: ""}},
  no: {top: "Topp", bottom: "Bunn", layers: "Lag", fit: "Tilpass", board: "Kort", loading: "Laster Gerber-filene …",
       none: "Fant ingen Gerber-lag.", size: "Kortet", holes: "hull", layer: "lag", open: "Åpne Gerber-ZIP eller filer",
       hint: "Dra for å flytte, scroll eller knip for å zoome, dobbeltklikk for å tilpasse.", cursor: "Markør", from: "fra nedre venstre hjørne",
       roles: {copper: "Kobber", mask: "Loddemaske", silk: "Silketrykk", paste: "Pasta", outline: "Kontur", drill: "Hull", other: "Annet"},
       sides: {top: "topp", bottom: "bunn", inner: "indre", all: ""}}
};
const LAYER_COLORS = {
  "copper:top": "#d64535", "copper:bottom": "#3f78c9", "copper:inner": "#c9a227", "mask:top": "#7a3fa0", "mask:bottom": "#2f9e8f",
  "silk:top": "#e9e1a0", "silk:bottom": "#b0c8e8", "paste:top": "#9aa3ad", "paste:bottom": "#7f8b96", "outline:all": "#f2f2f2",
  "drill:all": "#ffffff", "other:all": "#c0c0c0"
};
const INNER_COLORS = ["#c9a227", "#47a35a", "#a35a9e", "#5a8fa3"];

let styled = false;
function injectStyle() {
  if (styled || typeof document === "undefined") return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = `
.gv{--gv-line:var(--line,#d6dbe2);--gv-bg:var(--surface,var(--card,#fff));--gv-ink:var(--ink,#1a202c);--gv-muted:var(--ink-2,var(--muted,#5a6574));--gv-acc:var(--accent,var(--primary,#004f9f));--gv-acc-ink:var(--accent-ink,var(--primary-ink,#fff));
  border:1px solid var(--gv-line);border-radius:12px;overflow:hidden;background:var(--gv-bg);color:var(--gv-ink);display:grid;grid-template-columns:minmax(0,1fr) 230px}
@media (max-width:820px){.gv{grid-template-columns:minmax(0,1fr)}}
.gv-stage{position:relative;min-height:320px;aspect-ratio:4/3;max-height:min(78vh,820px);width:100%;background:#10151b;touch-action:none;cursor:grab;max-width:100%}
.gv-stage.drag{cursor:grabbing}
.gv-stage canvas{display:block;width:100%;height:100%}
.gv-msg{position:absolute;inset:0;display:grid;place-items:center;color:#c9d2dc;font-size:.95rem;padding:16px;text-align:center}
.gv-read{position:absolute;left:10px;bottom:10px;right:10px;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#e6edf3;pointer-events:none;text-shadow:0 1px 2px #000}
.gv-panel{border-left:1px solid var(--gv-line);padding:12px;display:flex;flex-direction:column;gap:10px;min-width:0;max-height:640px;overflow:auto}
@media (max-width:820px){.gv-panel{border-left:0;border-top:1px solid var(--gv-line);max-height:none}}
.gv-seg{display:flex;gap:4px;flex-wrap:wrap}
.gv-seg button,.gv-btn{font:inherit;font-size:.85rem;padding:5px 11px;border-radius:999px;border:1px solid var(--gv-line);background:var(--gv-bg);color:var(--gv-ink);cursor:pointer}
.gv-seg button[aria-pressed="true"]{background:var(--gv-acc);border-color:var(--gv-acc);color:#fff}
.gv-btn:focus-visible,.gv-seg button:focus-visible{outline:3px solid var(--gv-acc);outline-offset:2px}
.gv-layers{display:grid;gap:2px;font-size:.85rem}
.gv-layers label{display:flex;gap:8px;align-items:center;padding:2px 4px;border-radius:6px;cursor:pointer}
.gv-layers i{width:12px;height:12px;border-radius:3px;display:inline-block;flex:none;border:1px solid rgba(0,0,0,.2)}
.gv-info{font-size:.82rem;color:var(--gv-muted);line-height:1.45}
.gv-panel select{font:inherit;font-size:.88rem;padding:4px 6px;border:1px solid var(--gv-line);border-radius:6px;background:var(--gv-bg);color:var(--gv-ink);max-width:100%}
.gv-file{font-size:.82rem}
.gv [hidden]{display:none!important}`;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------- geometry -> Path2D runs (built once per layer)
function signedArea(pts) { let a = 0; for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
function addPoly(path, pts, ox = 0, oy = 0) {
  const p = signedArea(pts) < 0 ? [...pts].reverse() : pts;
  path.moveTo(ox + p[0][0], oy + p[0][1]);
  for (let k = 1; k < p.length; k++) path.lineTo(ox + p[k][0], oy + p[k][1]);
  path.closePath();
}
function buildRuns(ops) {
  const runs = [];
  let run = null;
  const get = dark => {
    if (!run || run.dark !== dark) { run = {dark, fill: new Path2D(), strokes: new Map(), n: 0}; runs.push(run); }
    return run;
  };
  for (const op of ops) {
    if (op.kind === "flash") {
      for (const s of op.shapes) {
        const r = get(op.dark === s.dark);
        if (s.type === "circle") { r.fill.moveTo(op.x + s.x + s.r, op.y + s.y); r.fill.arc(op.x + s.x, op.y + s.y, s.r, 0, 2 * Math.PI); }
        else addPoly(r.fill, s.pts, op.x, op.y);
        r.n++;
      }
    } else if (op.kind === "region") {
      const r = get(op.dark);
      for (const c of op.contours) if (c.length > 2) addPoly(r.fill, c);
      r.n++;
    } else if (op.kind === "stroke") {
      const r = get(op.dark), w = Math.round(op.width * 1000) / 1000;
      let p = r.strokes.get(w);
      if (!p) { p = new Path2D(); r.strokes.set(w, p); }
      p.moveTo(op.path[0][0], op.path[0][1]);
      for (let k = 1; k < op.path.length; k++) p.lineTo(op.path[k][0], op.path[k][1]);
      if (op.path.length === 1 || (op.path.length === 2 && op.path[0][0] === op.path[1][0] && op.path[0][1] === op.path[1][1])) p.lineTo(op.path[0][0] + 1e-4, op.path[0][1]);
      r.n++;
    }
  }
  return runs;
}
function drillRuns(drill) {
  const fill = new Path2D(), strokes = new Map();
  for (const h of drill.holes) { fill.moveTo(h.x + h.d / 2, h.y); fill.arc(h.x, h.y, h.d / 2, 0, 2 * Math.PI); }
  for (const s of drill.slots) {
    let p = strokes.get(s.d); if (!p) { p = new Path2D(); strokes.set(s.d, p); }
    p.moveTo(s.x1, s.y1); p.lineTo(s.x2, s.y2);
  }
  return [{dark: true, fill, strokes, n: drill.holes.length + drill.slots.length}];
}

// ---------------------------------------------------------------- loading
async function collectFromZip(buffer, prefix, out, depth = 0) {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(buffer);
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const name = entry.name;
    if (/\.zip$/i.test(name) && depth < 2) {
      const inner = await entry.async("arraybuffer");
      await collectFromZip(inner, prefix + name.replace(/(^|\/)gerber\.zip$/i, "").replace(/\.zip$/i, "") + "/", out, depth + 1);
      continue;
    }
    const c = classifyLayer(name);
    if (!c) continue;
    const size = entry._data?.uncompressedSize ?? 0;
    if (size > 30_000_000) continue;
    out.push({name: prefix + name, text: await entry.async("string"), ...c});
  }
}
function groupSets(files) {
  const sets = new Map();
  for (const f of files) {
    const dir = f.name.includes("/") ? f.name.slice(0, f.name.lastIndexOf("/")) : "";
    const key = dir.replace(/\/gerber$/i, "").replace(/\/+$/, "") || "board";
    if (!sets.has(key)) sets.set(key, []);
    sets.get(key).push(f);
  }
  return [...sets.entries()].filter(([, fs]) => fs.some(f => f.role === "copper" || f.role === "outline"))
    .sort((a, b) => b[1].length - a[1].length);
}

function prepareSet(files, t) {
  const layers = [];
  let innerIx = 0;
  const b = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};
  let outline = null, holes = 0;
  const drills = [];
  for (const f of files.sort((x, y) => x.name.localeCompare(y.name))) {
    try {
      if (f.role === "drill") { const d = parseExcellon(f.text); drills.push(d); holes += d.holes.length + d.slots.length; continue; }
      const g = parseGerber(f.text);
      if (!g.ops.length) continue;
      const key = f.role + ":" + f.side;
      const color = f.side === "inner" ? INNER_COLORS[innerIx++ % INNER_COLORS.length] : (LAYER_COLORS[key] || "#cccccc");
      const layer = {key, role: f.role, side: f.side, order: f.order || 0, name: f.name.split("/").pop(), color, runs: buildRuns(g.ops), ops: g.ops, visible: f.role !== "paste"};
      if (f.role === "outline") { outline = layer; layer.loops = outlineLoops(g.ops); }
      layers.push(layer);
      if (f.role === "outline" || f.role === "copper") for (const k of ["minX", "minY"]) b[k] = Math.min(b[k], g.bounds[k]);
      if (f.role === "outline" || f.role === "copper") for (const k of ["maxX", "maxY"]) b[k] = Math.max(b[k], g.bounds[k]);
    } catch (e) { /* skip unreadable file */ }
  }
  if (outline && Number.isFinite(outline.ops.length)) {
    const ob = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};
    for (const op of outline.ops) for (const p of op.path || []) { ob.minX = Math.min(ob.minX, p[0]); ob.minY = Math.min(ob.minY, p[1]); ob.maxX = Math.max(ob.maxX, p[0]); ob.maxY = Math.max(ob.maxY, p[1]); }
    if (Number.isFinite(ob.minX)) Object.assign(b, ob);
  }
  if (drills.length) {
    const merged = {holes: drills.flatMap(d => d.holes), slots: drills.flatMap(d => d.slots)};
    layers.push({key: "drill:all", role: "drill", side: "all", order: 0, name: t.roles.drill, color: LAYER_COLORS["drill:all"], runs: drillRuns(merged), visible: true});
  }
  const rank = l => ({"silk:bottom": 0, "mask:bottom": 1, "paste:bottom": 2, "copper:bottom": 3, "copper:inner": 4, "copper:top": 6, "paste:top": 7, "mask:top": 8, "silk:top": 9, "outline:all": 10, "drill:all": 11, "other:all": 5})[l.key] ?? 5;
  layers.sort((x, y) => rank(x) - rank(y) || y.order - x.order);
  let boardPath = null;
  if (outline && outline.loops.length) { boardPath = new Path2D(); for (const l of outline.loops) addPoly(boardPath, l); }
  return {layers, bounds: b, boardPath, holes, copperCount: layers.filter(l => l.role === "copper").length};
}

// ---------------------------------------------------------------- mount
export function mountGerberViewer(root, {src = "", files = null, lang = "en", title = ""} = {}) {
  injectStyle();
  const t = T[lang] || T.en;
  root.innerHTML = `<div class="gv">
    <div class="gv-stage"><canvas aria-label="${title ? title + ": " : ""}Gerber"></canvas><div class="gv-msg">${t.loading}</div><div class="gv-read"></div></div>
    <div class="gv-panel">
      <label class="gv-set" hidden>${t.board}<br><select></select></label>
      <div class="gv-seg" role="group" aria-label="View"><button type="button" data-view="top" aria-pressed="true">${t.top}</button><button type="button" data-view="bottom" aria-pressed="false">${t.bottom}</button><button type="button" data-view="layers" aria-pressed="false">${t.layers}</button></div>
      <div class="gv-layers"></div>
      <div><button type="button" class="gv-btn" data-fit>${t.fit}</button></div>
      <div class="gv-info"></div>
      <label class="gv-file">${t.open}<br><input type="file" multiple accept=".zip,.gbr,.gtl,.gbl,.gts,.gbs,.gto,.gbo,.gtp,.gbp,.gm1,.gko,.drl,.xln,.g2,.g3,.g4,.g5"></label>
      <p class="gv-info">${t.hint}</p>
    </div></div>`;
  const stage = root.querySelector(".gv-stage"), canvas = root.querySelector("canvas"), msg = root.querySelector(".gv-msg"), read = root.querySelector(".gv-read");
  const layersEl = root.querySelector(".gv-layers"), info = root.querySelector(".gv-info"), setLabel = root.querySelector(".gv-set"), setSel = setLabel.querySelector("select");
  const ctx = canvas.getContext("2d");
  const off = [document.createElement("canvas"), document.createElement("canvas")];
  let sets = [], cur = null, view = "top", cam = {s: 1, cx: 0, cy: 0}, raf = 0, disposed = false;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  function size() {
    const w = Math.max(1, Math.round(stage.clientWidth * dpr())), h = Math.max(1, Math.round(stage.clientHeight * dpr()));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; for (const o of off) { o.width = w; o.height = h; } }
    return [w, h];
  }
  function fit() {
    if (!cur) return;
    const [w, h] = size(), b = cur.bounds;
    const bw = Math.max(b.maxX - b.minX, 1), bh = Math.max(b.maxY - b.minY, 1);
    cam = {s: 0.92 * Math.min(w / bw, h / bh), cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2};
    draw();
  }
  const mirror = () => view === "bottom" ? -1 : 1;
  function setT(c) {
    const [w, h] = [canvas.width, canvas.height];
    c.setTransform(cam.s * mirror(), 0, 0, -cam.s, w / 2 - mirror() * cam.s * cam.cx, h / 2 + cam.s * cam.cy);
  }
  function paintLayer(c, layer, color) {
    c.save(); setT(c);
    for (const r of layer.runs) {
      c.globalCompositeOperation = r.dark ? "source-over" : "destination-out";
      c.fillStyle = color; c.strokeStyle = color; c.lineCap = "round"; c.lineJoin = "round";
      c.fill(r.fill, "nonzero");
      for (const [w, p] of r.strokes) { c.lineWidth = Math.max(w, 0.5 / cam.s); c.stroke(p); }
    }
    c.restore();
  }
  function onto(c, layer, color, alpha = 1) {
    const o = off[0], oc = o.getContext("2d");
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, o.width, o.height);
    paintLayer(oc, layer, color);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(o, 0, 0); c.restore();
  }
  function realistic(side) {
    const L = k => cur.layers.find(l => l.key === k);
    const copper = L("copper:" + side), mask = L("mask:" + side), silk = L("silk:" + side), drill = L("drill:all");
    const bg = "#10151b";
    ctx.save(); setT(ctx);
    if (cur.boardPath) { ctx.fillStyle = "#1f5c2e"; ctx.fill(cur.boardPath, "evenodd"); }
    else { const b = cur.bounds; ctx.fillStyle = "#1f5c2e"; ctx.fillRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY); }
    ctx.restore();
    if (copper) onto(ctx, copper, "#3c8a4c", 1);                   // copper under the mask shows as lighter green
    if (copper && mask) {                                         // exposed copper = copper inside mask openings, gold
      const a = off[0], ac = a.getContext("2d"), m = off[1], mc = m.getContext("2d");
      ac.setTransform(1, 0, 0, 1, 0, 0); ac.clearRect(0, 0, a.width, a.height); paintLayer(ac, copper, "#d4a94e");
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, m.width, m.height); paintLayer(mc, mask, "#000");
      ac.save(); ac.setTransform(1, 0, 0, 1, 0, 0); ac.globalCompositeOperation = "destination-in"; ac.drawImage(m, 0, 0); ac.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(a, 0, 0); ctx.restore();
    }
    if (silk) onto(ctx, silk, "#f4f4ee", 0.95);
    if (drill) onto(ctx, drill, bg, 1);
    if (cur.boardPath) { ctx.save(); setT(ctx); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1 / cam.s; ctx.stroke(cur.boardPath); ctx.restore(); }
  }
  function draw() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!cur || disposed) return;
      size();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#10151b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (view === "layers") {
        for (const l of cur.layers) if (l.visible) onto(ctx, l, l.color, l.role === "copper" && l.side === "inner" ? 0.45 : 0.78);
      } else realistic(view);
    });
  }
  function renderPanel() {
    layersEl.innerHTML = "";
    layersEl.hidden = view !== "layers";
    for (const l of cur.layers) {
      const lab = document.createElement("label");
      const box = document.createElement("input"); box.type = "checkbox"; box.checked = l.visible;
      box.addEventListener("change", () => { l.visible = box.checked; draw(); });
      const sw = document.createElement("i"); sw.style.background = l.color;
      const tx = document.createElement("span");
      tx.textContent = `${t.roles[l.role] || l.role}${t.sides[l.side] ? " " + t.sides[l.side] : ""}${l.side === "inner" ? " " + (l.order || "") : ""}`;
      tx.title = l.name;
      lab.append(box, sw, tx); layersEl.append(lab);
    }
    const b = cur.bounds;
    info.textContent = `${t.size}: ${(b.maxX - b.minX).toFixed(1)} × ${(b.maxY - b.minY).toFixed(1)} mm · ${cur.copperCount} ${t.layer} · ${cur.holes} ${t.holes}`;
  }
  function select(ix) {
    cur = sets[ix]?.data || null;
    if (!cur || !cur.layers.length) { msg.hidden = false; msg.textContent = t.none; return; }
    msg.hidden = true; renderPanel(); fit();
  }
  async function load(source) {
    msg.hidden = false; msg.textContent = t.loading;
    const got = [];
    try {
      if (source.url) {
        const res = await fetch(source.url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const buf = await res.arrayBuffer();
        if (/\.zip(\?|$)/i.test(source.url)) await collectFromZip(buf, "", got);
        else { const c = classifyLayer(source.url); if (c) got.push({name: source.url.split("/").pop(), text: new TextDecoder().decode(buf), ...c}); }
      } else for (const f of source.files) {
        if (/\.zip$/i.test(f.name)) await collectFromZip(await f.arrayBuffer(), f.name.replace(/\.zip$/i, "") + "/", got);
        else { const c = classifyLayer(f.name); if (c) got.push({name: f.name, text: await f.text(), ...c}); }
      }
    } catch (e) { msg.textContent = String(e.message || e); return; }
    if (disposed) return;
    sets = groupSets(got).map(([name, fs]) => ({name: name.split("/").pop() || name, data: prepareSet(fs, t)}));
    if (!sets.length) { msg.textContent = t.none; return; }
    setSel.innerHTML = sets.map((s, i) => `<option value="${i}">${s.name.replace(/[<>&"]/g, "")}</option>`).join("");
    setLabel.hidden = sets.length < 2;
    select(0);
  }
  setSel.addEventListener("change", () => select(Number(setSel.value)));
  root.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    view = btn.dataset.view;
    root.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    if (cur) { layersEl.hidden = view !== "layers"; draw(); }
  }));
  root.querySelector("[data-fit]").addEventListener("click", fit);
  root.querySelector(".gv-file input").addEventListener("change", e => { if (e.target.files.length) load({files: [...e.target.files]}); });

  // interaction
  const pts = new Map();
  let last = null, pinch = null;
  const world = (px, py) => {
    const r = canvas.getBoundingClientRect(), x = (px - r.left) * dpr(), y = (py - r.top) * dpr();
    return [cam.cx + (x - canvas.width / 2) / (cam.s * mirror()), cam.cy - (y - canvas.height / 2) / cam.s];
  };
  function zoomAt(px, py, f) {
    const [wx, wy] = world(px, py);
    cam.s = Math.min(Math.max(cam.s * f, 0.2), 4000);
    const [nx, ny] = world(px, py);
    cam.cx += wx - nx; cam.cy += wy - ny; draw();
  }
  stage.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, {passive: false});
  stage.addEventListener("pointerdown", e => { stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; stage.classList.add("drag"); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  stage.addEventListener("pointermove", e => {
    if (cur) {
      const [wx, wy] = world(e.clientX, e.clientY), b = cur.bounds;
      read.textContent = `${t.cursor}: ${(wx - b.minX).toFixed(2)}, ${(wy - b.minY).toFixed(2)} mm ${t.from}`;
    }
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / pinch); pinch = d; return;
    }
    if (last) { cam.cx -= (e.clientX - last[0]) * dpr() / (cam.s * mirror()); cam.cy += (e.clientY - last[1]) * dpr() / cam.s; last = [e.clientX, e.clientY]; draw(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; last = pts.size ? [...pts.values()][0] : null; if (!pts.size) stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  stage.addEventListener("dblclick", fit);
  const ro = new ResizeObserver(() => draw()); ro.observe(stage);

  if (files) load({files}); else if (src) load({url: src}); else { msg.textContent = t.open; }
  return () => { disposed = true; ro.disconnect(); cancelAnimationFrame(raf); root.innerHTML = ""; };
}

// ---------------------------------------------------------------- page for #/engineering/gerber
export const GERBER_PRESETS = Object.freeze({
  dykkecomputer: {label: "Dive computer, PCB rev D (main board and sensor board)", src: "./assets/demos/dykkecomputer/dykkecomputer-kretskort-revd.zip"}
});
export function gerberPageHTML() {
  return `<main class="section engineering-gerber-page">
 <p class="crumbs">Engineering / Gerber</p><h1>Gerber viewer</h1>
 <p class="muted">Open the fabrication files of a circuit board (a ZIP from KiCad, Fusion/EAGLE or Altium, or loose Gerber and
 Excellon files) and see the board as it will be made: top, bottom, or one layer at a time. Files are read in your browser
 and are not uploaded.</p>
 <p><a class="btn" href="#/engineering/gerber/dykkecomputer">Example: dive computer PCB rev D</a></p>
 <div data-gerber-root></div>
</main>`;
}
export function mountGerberPage(app, {preset = ""} = {}) {
  const root = app.querySelector("[data-gerber-root]");
  const p = Object.hasOwn(GERBER_PRESETS, preset) ? GERBER_PRESETS[preset] : null;
  return mountGerberViewer(root, {src: p ? p.src : "", title: p ? p.label : "Gerber", lang: "en"});
}
