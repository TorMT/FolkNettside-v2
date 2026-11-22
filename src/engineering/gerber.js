// Gerber RS-274X and Excellon drill parsing for the browser Gerber viewer.
// Pure functions (no DOM): text in, a list of drawing operations out, all in millimetres with y up.
// Supported: FS/MO, standard apertures (C, R, O, P), aperture macros with expressions (primitives 1, 4, 5, 20, 21, 22),
// linear and circular interpolation (G01/G02/G03, G74/G75), regions (G36/G37), polarity (LPD/LPC), flashes.
// Excellon: METRIC/INCH, tool table, decimal or implied-decimal coordinates, G85 slots and M15/M16 routed slots.

const MAX_OPS = 400000;

// ---------------------------------------------------------------- aperture macro expressions
function evalExpr(src, vars) {
  const s = String(src).replace(/\s+/g, "");
  let i = 0;
  const peek = () => s[i];
  function num() {
    if (peek() === "(") { i++; const v = sum(); if (s[i] === ")") i++; return v; }
    if (peek() === "$") {
      i++; let k = ""; while (/[0-9]/.test(s[i] || "")) k += s[i++];
      return Number(vars[Number(k)] ?? 0);
    }
    if (peek() === "-") { i++; return -num(); }
    if (peek() === "+") { i++; return num(); }
    let k = ""; while (/[0-9.]/.test(s[i] || "")) k += s[i++];
    return k ? Number(k) : 0;
  }
  function prod() {
    let v = num();
    while (s[i] === "x" || s[i] === "X" || s[i] === "/") { const op = s[i++]; const w = num(); v = op === "/" ? v / w : v * w; }
    return v;
  }
  function sum() {
    let v = prod();
    while (s[i] === "+" || s[i] === "-") { const op = s[i++]; const w = prod(); v = op === "+" ? v + w : v - w; }
    return v;
  }
  const v = sum();
  return Number.isFinite(v) ? v : 0;
}

function rot(x, y, deg) {
  if (!deg) return [x, y];
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}

function circlePoly(cx, cy, r, n = 24) {
  const pts = [];
  for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}

// Expand a macro into shapes relative to the flash point: {type:"circle",x,y,r,dark} | {type:"poly",pts,dark}
function expandMacro(body, params) {
  const vars = {};
  params.forEach((p, k) => { vars[k + 1] = Number(p); });
  const shapes = [];
  for (const raw of body) {
    const stmt = raw.trim();
    if (!stmt || stmt.startsWith("0")) { if (stmt.startsWith("0 ") || stmt === "0") continue; }
    const asg = stmt.match(/^\$(\d+)=(.*)$/);
    if (asg) { vars[Number(asg[1])] = evalExpr(asg[2], vars); continue; }
    const f = stmt.split(",").map(t => t.trim());
    const code = Number(f[0]);
    const v = k => evalExpr(f[k] ?? "0", vars);
    if (code === 1) {
      const dark = v(1) !== 0, d = v(2), [x, y] = rot(v(3), v(4), f.length > 5 ? v(5) : 0);
      shapes.push({ type: "circle", x, y, r: d / 2, dark });
    } else if (code === 20 || code === 2) {
      const dark = v(1) !== 0, w = v(2), x1 = v(3), y1 = v(4), x2 = v(5), y2 = v(6), r = v(7);
      const len = Math.hypot(x2 - x1, y2 - y1) || 1e-9, nx = -(y2 - y1) / len * w / 2, ny = (x2 - x1) / len * w / 2;
      shapes.push({ type: "poly", dark, pts: [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]].map(p => rot(p[0], p[1], r)) });
    } else if (code === 21) {
      const dark = v(1) !== 0, w = v(2), h = v(3), cx = v(4), cy = v(5), r = v(6);
      shapes.push({ type: "poly", dark, pts: [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]].map(p => rot(p[0], p[1], r)) });
    } else if (code === 22) {
      const dark = v(1) !== 0, w = v(2), h = v(3), x = v(4), y = v(5), r = v(6);
      shapes.push({ type: "poly", dark, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(p => rot(p[0], p[1], r)) });
    } else if (code === 4) {
      const dark = v(1) !== 0, n = Math.round(v(2)), pts = [];
      for (let k = 0; k <= n; k++) pts.push([v(3 + 2 * k), v(4 + 2 * k)]);
      const r = v(5 + 2 * n);
      shapes.push({ type: "poly", dark, pts: pts.map(p => rot(p[0], p[1], r)) });
    } else if (code === 5) {
      const dark = v(1) !== 0, n = Math.max(3, Math.round(v(2))), cx = v(3), cy = v(4), d = v(5), r = v(6), pts = [];
      for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; pts.push(rot(cx + d / 2 * Math.cos(a), cy + d / 2 * Math.sin(a), r)); }
      shapes.push({ type: "poly", dark, pts });
    } else if (code === 7) {                     // thermal: draw the outer ring as a dark circle (good enough to show)
      const [x, y] = rot(v(1), v(2), v(6));
      shapes.push({ type: "circle", x, y, r: v(3) / 2, dark: true });
      shapes.push({ type: "circle", x, y, r: v(4) / 2, dark: false });
    }
  }
  return shapes;
}

function standardAperture(type, p) {
  const n = p.map(Number);
  if (type === "C") {
    const s = [{ type: "circle", x: 0, y: 0, r: n[0] / 2, dark: true }];
    if (n[1]) s.push({ type: "circle", x: 0, y: 0, r: n[1] / 2, dark: false });
    return { shapes: s, stroke: n[0] };
  }
  if (type === "R") {
    const w = n[0], h = n[1];
    return { shapes: [{ type: "poly", dark: true, pts: [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] }], stroke: Math.min(w, h) };
  }
  if (type === "O") {
    const w = n[0], h = n[1], r = Math.min(w, h) / 2, pts = [];
    if (w >= h) {
      const c = (w - h) / 2;
      for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + Math.PI * k / 16; pts.push([c + r * Math.cos(a), r * Math.sin(a)]); }
      for (let k = 0; k <= 16; k++) { const a = Math.PI / 2 + Math.PI * k / 16; pts.push([-c + r * Math.cos(a), r * Math.sin(a)]); }
    } else {
      const c = (h - w) / 2;
      for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; pts.push([r * Math.cos(a), c + r * Math.sin(a)]); }
      for (let k = 0; k <= 16; k++) { const a = Math.PI + Math.PI * k / 16; pts.push([r * Math.cos(a), -c + r * Math.sin(a)]); }
    }
    return { shapes: [{ type: "poly", dark: true, pts }], stroke: Math.min(w, h) };
  }
  if (type === "P") {
    const d = n[0], k = Math.max(3, Math.round(n[1])), r = n[2] || 0, pts = [];
    for (let i = 0; i < k; i++) { const a = 2 * Math.PI * i / k; pts.push(rot(d / 2 * Math.cos(a), d / 2 * Math.sin(a), r)); }
    return { shapes: [{ type: "poly", dark: true, pts }], stroke: d };
  }
  return { shapes: [], stroke: 0 };
}

function arcPoints(x0, y0, x1, y1, cx, cy, cw) {
  const r = Math.hypot(x0 - cx, y0 - cy);
  let a0 = Math.atan2(y0 - cy, x0 - cx), a1 = Math.atan2(y1 - cy, x1 - cx);
  if (cw) { while (a1 >= a0) a1 -= 2 * Math.PI; } else { while (a1 <= a0) a1 += 2 * Math.PI; }
  if (Math.abs(x0 - x1) < 1e-9 && Math.abs(y0 - y1) < 1e-9) a1 = a0 + (cw ? -2 : 2) * Math.PI;
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 32)));
  const pts = [];
  for (let k = 1; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}

/** Parse RS-274X text. Returns {ops, bounds, units, warnings}. ops: {kind:"flash"|"stroke"|"region", dark, ...} */
export function parseGerber(text) {
  const src = String(text);
  let fmt = { xi: 2, xd: 6, yi: 2, yd: 6, trailing: false }, scale = 1;
  const apertures = new Map(), macros = new Map();
  const ops = [], warnings = [];
  let x = 0, y = 0, interp = 1, multi = true, cur = null, dark = true, region = null, contour = null;
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const grow = (px, py, r = 0) => {
    if (px - r < b.minX) b.minX = px - r; if (py - r < b.minY) b.minY = py - r;
    if (px + r > b.maxX) b.maxX = px + r; if (py + r > b.maxY) b.maxY = py + r;
  };
  const coord = (str, isX) => {
    if (str == null) return null;
    if (str.includes(".")) return Number(str) * scale;
    const dec = isX ? fmt.xd : fmt.yd, neg = str.startsWith("-"), digits = str.replace(/^[+-]/, "");
    let v;
    if (fmt.trailing) { const tot = (isX ? fmt.xi : fmt.yi) + dec; v = Number(digits.padEnd(tot, "0")) / 10 ** dec; }
    else v = Number(digits) / 10 ** dec;
    return (neg ? -v : v) * scale;
  };
  // split into extended (%...%) blocks and word commands (...*)
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === "%") {
      const end = src.indexOf("%", i + 1);
      if (end < 0) break;
      const block = src.slice(i + 1, end).replace(/[\r\n]/g, "");
      i = end + 1;
      const cmd = block.slice(0, 2);
      if (cmd === "FS") {
        const m = block.match(/FS([LT])?([AI])?X(\d)(\d)Y(\d)(\d)/);
        if (m) fmt = { trailing: m[1] === "T", xi: +m[3], xd: +m[4], yi: +m[5], yd: +m[6] };
      } else if (cmd === "MO") {
        scale = block.startsWith("MOIN") ? 25.4 : 1;
      } else if (cmd === "LP") {
        dark = block[2] !== "C";
      } else if (cmd === "AM") {
        const parts = block.slice(2).split("*");
        macros.set(parts[0], parts.slice(1).filter(s => s.trim() && !/^0(\s|$)/.test(s.trim())));
      } else if (cmd === "AD") {
        const m = block.match(/^ADD(\d+)([^,*]+),?([^*]*)\*?$/);
        if (m) {
          const params = m[3] ? m[3].split("X").map(Number).map(v => v * scale) : [];
          let ap;
          if (["C", "R", "O", "P"].includes(m[2])) {
            const p = m[2] === "P" ? [params[0], params[1] / scale, (params[2] || 0) / scale] : params;
            ap = standardAperture(m[2], p);
          } else if (macros.has(m[2])) {
            const raw = m[3] ? m[3].split("X").map(Number) : [];
            const shapes = expandMacro(macros.get(m[2]), raw).map(s => s.type === "circle"
              ? { ...s, x: s.x * scale, y: s.y * scale, r: s.r * scale } : { ...s, pts: s.pts.map(([px, py]) => [px * scale, py * scale]) });
            ap = { shapes, stroke: 0 };
          } else { warnings.push("unknown aperture " + m[2]); ap = { shapes: [], stroke: 0 }; }
          let ext = 0;
          for (const s of ap.shapes) ext = Math.max(ext, s.type === "circle" ? Math.hypot(s.x, s.y) + s.r : Math.max(...s.pts.map(p => Math.hypot(p[0], p[1]))));
          ap.extent = ext;
          apertures.set(Number(m[1]), ap);
        }
      } else if (cmd === "SR" && block !== "SR") {
        warnings.push("step and repeat is not supported");
      }
      continue;
    }
    if (ch === "\n" || ch === "\r" || ch === " " || ch === "\t") { i++; continue; }
    const end = src.indexOf("*", i);
    if (end < 0) break;
    let w = src.slice(i, end).trim();
    i = end + 1;
    if (!w || w.startsWith("G04") || w.startsWith("G4 ")) continue;
    if (w === "M02" || w === "M00") break;
    // G codes may prefix coordinate words (deprecated but common)
    let gm;
    while ((gm = w.match(/^G0*(\d+)/))) {
      const g = Number(gm[1]);
      if (g === 1 || g === 2 || g === 3) interp = g;
      else if (g === 74) multi = false;
      else if (g === 75) multi = true;
      else if (g === 36) { region = []; contour = null; }
      else if (g === 37) {
        if (contour && contour.length > 2) region.push(contour);
        if (region && region.length) { ops.push({ kind: "region", dark, contours: region }); region.forEach(c => c.forEach(p => grow(p[0], p[1]))); }
        region = null; contour = null;
      } else if (g === 54 || g === 55 || g === 70 || g === 71 || g === 90 || g === 91) { /* deprecated, ignore */ }
      w = w.slice(gm[0].length);
      if (!w) break;
    }
    if (!w) continue;
    const dsel = w.match(/^D0*(\d+)$/);
    if (dsel && Number(dsel[1]) >= 10) { cur = apertures.get(Number(dsel[1])) || null; continue; }
    const m = w.match(/^(?:X([+-]?[\d.]+))?(?:Y([+-]?[\d.]+))?(?:I([+-]?[\d.]+))?(?:J([+-]?[\d.]+))?(?:D0*(\d+))?$/);
    if (!m) { if (!/^(M0?1|IP|LN|IN|OF)/.test(w)) warnings.push("skipped: " + w.slice(0, 20)); continue; }
    const nx = m[1] != null ? coord(m[1], true) : x, ny = m[2] != null ? coord(m[2], false) : y;
    const ci = m[3] != null ? coord(m[3], true) : 0, cj = m[4] != null ? coord(m[4], false) : 0;
    const d = m[5] != null ? Number(m[5]) : 1;
    if (d >= 10) { cur = apertures.get(d) || null; continue; }
    if (ops.length > MAX_OPS) { warnings.push("too many operations, stopped"); break; }
    if (d === 2) {
      if (region) { if (contour && contour.length > 2) region.push(contour); contour = [[nx, ny]]; }
    } else if (d === 1) {
      let pts;
      if (interp === 1) pts = [[nx, ny]];
      else {
        let cx = x + ci, cy = y + cj;
        if (!multi) {          // single quadrant: pick the sign combination whose centre is equidistant
          let best = null;
          for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const tx = x + sx * Math.abs(ci), ty = y + sy * Math.abs(cj);
            const e = Math.abs(Math.hypot(x - tx, y - ty) - Math.hypot(nx - tx, ny - ty));
            if (!best || e < best[0]) best = [e, tx, ty];
          }
          cx = best[1]; cy = best[2];
        }
        pts = arcPoints(x, y, nx, ny, cx, cy, interp === 2);
      }
      if (region) {
        if (!contour) contour = [[x, y]];
        contour.push(...pts);
      } else if (cur) {
        const path = [[x, y], ...pts];
        const ap = cur;
        if (ap.stroke > 0) ops.push({ kind: "stroke", dark, width: ap.stroke, path });
        else ops.push({ kind: "stroke", dark, width: Math.max(ap.extent, 0.01), path });
        path.forEach(p => grow(p[0], p[1], (ap.stroke || ap.extent) / 2));
      }
    } else if (d === 3) {
      if (cur) { ops.push({ kind: "flash", dark, x: nx, y: ny, shapes: cur.shapes }); grow(nx, ny, cur.extent); }
    }
    x = nx; y = ny;
  }
  return { ops, bounds: b, warnings };
}

/** Parse an Excellon drill file. Returns {holes:[{x,y,d}], slots:[{x1,y1,x2,y2,d}], bounds} */
export function parseExcellon(text) {
  const lines = String(text).split(/\r?\n/);
  let scale = 1, header = true, tool = 0, x = 0, y = 0, implied = { int: 3, dec: 3 }, routing = false, route = null, g = 5;
  const tools = new Map(), holes = [], slots = [];
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const grow = (px, py, r) => { b.minX = Math.min(b.minX, px - r); b.minY = Math.min(b.minY, py - r); b.maxX = Math.max(b.maxX, px + r); b.maxY = Math.max(b.maxY, py + r); };
  const decimalFile = /(^|\n)\s*(?:G0?[0-9]+)?[XY][+-]?\d*\.\d/.test(String(text));   // KiCad "decimal" format writes X3 for 3.000
  const num = s => {
    if (s == null) return null;
    if (s.includes(".") || decimalFile) return Number(s) * scale;
    const neg = s.startsWith("-"), dg = s.replace(/^[+-]/, "");
    const v = Number(dg) / 10 ** implied.dec;
    return (neg ? -v : v) * scale;
  };
  for (let raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(";")) continue;
    if (/^(METRIC|M71)/.test(line)) { scale = 1; implied = { int: 3, dec: 3 }; const m = line.match(/,(?:LZ|TZ)?,?0*(\d+)\.(\d+)/); if (m) implied = { int: m[1].length, dec: m[2].length }; continue; }
    if (/^(INCH|M72)/.test(line)) { scale = 25.4; implied = { int: 2, dec: 4 }; continue; }
    if (line === "%" || line === "M95") { header = false; continue; }
    if (line === "M48") { header = true; continue; }
    const td = line.match(/^T0*(\d+)(?:F[\d.]+|S[\d.]+)*C([\d.]+)/);
    if (td) { tools.set(Number(td[1]), Number(td[2]) * scale); continue; }
    const ts = line.match(/^T0*(\d+)$/);
    if (ts) { tool = Number(ts[1]); continue; }
    if (line === "M30" || line === "M00") break;
    if (line === "M15") { routing = true; route = [[x, y]]; continue; }
    if (line === "M16" || line === "M17") {
      if (route && route.length > 1) { const d = tools.get(tool) || 0; for (let k = 1; k < route.length; k++) { slots.push({ x1: route[k - 1][0], y1: route[k - 1][1], x2: route[k][0], y2: route[k][1], d }); grow(route[k][0], route[k][1], d / 2); } }
      routing = false; route = null; continue;
    }
    const gc = line.match(/^G0*(\d+)/);
    let rest = line;
    if (gc && !line.includes("G85")) { g = Number(gc[1]); rest = line.slice(gc[0].length); if (!rest) continue; }
    const slot = rest.match(/^X([+-]?[\d.]+)?Y?([+-]?[\d.]+)?G85X([+-]?[\d.]+)?Y?([+-]?[\d.]+)?$/);
    if (slot) {
      const x1 = slot[1] != null ? num(slot[1]) : x, y1 = slot[2] != null ? num(slot[2]) : y;
      const x2 = slot[3] != null ? num(slot[3]) : x1, y2 = slot[4] != null ? num(slot[4]) : y1;
      const d = tools.get(tool) || 0;
      slots.push({ x1, y1, x2, y2, d }); grow(x1, y1, d / 2); grow(x2, y2, d / 2); x = x2; y = y2; continue;
    }
    const m = rest.match(/^(?:X([+-]?[\d.]+))?(?:Y([+-]?[\d.]+))?$/);
    if (m && (m[1] != null || m[2] != null) && !header) {
      x = m[1] != null ? num(m[1]) : x; y = m[2] != null ? num(m[2]) : y;
      if (routing && route) route.push([x, y]);
      else if (g === 5 || g === 81 || g === 0 && !routing) {
        if (g === 0) continue;               // positioning move before M15
        const d = tools.get(tool) || 0; holes.push({ x, y, d }); grow(x, y, d / 2);
      }
    }
  }
  return { holes, slots, bounds: b };
}

/** Identify a fabrication file by name. Returns {role, side} or null. */
export function classifyLayer(name) {
  const n = String(name).toLowerCase(), base = n.split("/").pop();
  if (/drl_map|-job\.gbrjob|\.gbrjob$|readme|\.(txt|csv|pdf|png|jpg|md|zip|step|kicad_pcb|brd|sch)$/.test(base)) return null;
  const rules = [
    [/(\.gtl$|f[_.]cu|copper_top|top[_ ]?copper|\.cmp$|toplayer)/, "copper", "top"],
    [/(\.gbl$|b[_.]cu|copper_bottom|bottom[_ ]?copper|\.sol$|bottomlayer)/, "copper", "bottom"],
    [/(\.g(\d+)$|\.gp(\d+)$|in(\d+)[_.]cu|inner)/, "copper", "inner"],
    [/(\.gts$|f[_.]mask|soldermask_top|top[_ ]?mask|\.stc$)/, "mask", "top"],
    [/(\.gbs$|b[_.]mask|soldermask_bottom|bottom[_ ]?mask|\.sts$)/, "mask", "bottom"],
    [/(\.gto$|f[_.]silk|silkscreen_top|top[_ ]?silk|\.plc$)/, "silk", "top"],
    [/(\.gbo$|b[_.]silk|silkscreen_bottom|bottom[_ ]?silk|\.pls$)/, "silk", "bottom"],
    [/(\.gtp$|f[_.]paste|paste_top|\.crc$)/, "paste", "top"],
    [/(\.gbp$|b[_.]paste|paste_bottom|\.crs$)/, "paste", "bottom"],
    [/(\.gm1$|\.gko$|\.gml$|\.gm$|edge[_.]cuts|outline|profile|\.dim$)/, "outline", "all"],
    [/(\.drl$|\.xln$|\.exc$|\.drd$|\.txt$|drill)/, "drill", "all"],
    [/\.gbr$/, "other", "all"]
  ];
  for (const [re, role, side] of rules) if (re.test(base)) {
    let order = 0;
    if (role === "copper" && side === "inner") { const m = base.match(/in(\d+)[_.]cu|\.g(\d+)$|\.gp(\d+)$/); order = Number(m?.[1] || m?.[2] || m?.[3] || 1); }
    return { role, side, order };
  }
  return null;
}

/** Chain outline strokes into closed loops for filling the board shape. */
export function outlineLoops(ops, tol = 0.02) {
  const segs = [];
  for (const op of ops) if (op.kind === "stroke") for (let k = 1; k < op.path.length; k++) segs.push([op.path[k - 1], op.path[k]]);
  const loops = [];
  const used = new Array(segs.length).fill(false);
  const near = (a, c) => Math.abs(a[0] - c[0]) < tol && Math.abs(a[1] - c[1]) < tol;
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const loop = [segs[s][0], segs[s][1]];
    let grew = true;
    while (grew && !near(loop[0], loop[loop.length - 1])) {
      grew = false;
      const end = loop[loop.length - 1];
      for (let t = 0; t < segs.length; t++) {
        if (used[t]) continue;
        if (near(segs[t][0], end)) { loop.push(segs[t][1]); used[t] = true; grew = true; break; }
        if (near(segs[t][1], end)) { loop.push(segs[t][0]); used[t] = true; grew = true; break; }
      }
    }
    if (loop.length > 3 && near(loop[0], loop[loop.length - 1])) loops.push(loop);
  }
  for (const op of ops) if (op.kind === "region") loops.push(...op.contours);
  return loops;
}

export const _test = { evalExpr, expandMacro, arcPoints };
