import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseGerber, parseExcellon, classifyLayer, outlineLoops, _test} from "../src/engineering/gerber.js";
import {viewerKind} from "../src/viewers/registry.js";
import {lazyRouteKeys} from "../src/shell/lazy-routes.js";

const ROUNDRECT = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
G01*
%AMRoundRect*
0 Rectangle with rounded corners*
4,1,4,$2,$3,$4,$5,$6,$7,$8,$9,$2,$3,0*
1,1,$1+$1,$2,$3*
20,1,$1+$1,$2,$3,$4,$5,0*%
%ADD10RoundRect,0.100000X-0.400000X-0.300000X0.400000X-0.300000X0.400000X0.300000X-0.400000X0.300000X0*%
%ADD11C,0.150000*%
%ADD12R,1.000000X2.000000*%
D10*
X1000000Y2000000D03*
D11*
X0Y0D02*
X5000000Y0D01*
G75*
G03*
X5000000Y5000000I0J2500000D01*
G01*
%LPC*%
D12*
X3000000Y3000000D03*
%LPD*%
G36*
X10000000Y10000000D02*
X12000000Y10000000D01*
X12000000Y12000000D01*
X10000000Y12000000D01*
X10000000Y10000000D01*
G37*
M02*
`;

test("gerber: aperture macro, strokes, arcs, polarity and regions", () => {
  const g = parseGerber(ROUNDRECT);
  assert.deepEqual(g.warnings, []);
  const kinds = g.ops.map(o => o.kind);
  assert.deepEqual(kinds, ["flash", "stroke", "stroke", "flash", "region"]);
  const flash = g.ops[0];
  assert.equal(flash.x, 1); assert.equal(flash.y, 2);
  assert.ok(flash.shapes.length >= 3, "macro expands to polygon + circle + vector line");
  assert.equal(flash.shapes[1].r, 0.1, "circle diameter $1+$1 = 0.2");
  const arc = g.ops[2];
  assert.equal(arc.width, 0.15);
  const endPt = arc.path[arc.path.length - 1];
  assert.ok(Math.abs(endPt[0] - 5) < 1e-6 && Math.abs(endPt[1] - 5) < 1e-6, "arc ends at X5 Y5");
  const mid = arc.path[Math.floor(arc.path.length / 2)];
  assert.ok(mid[0] > 7.4, "counter-clockwise arc bulges to +x around centre (5, 2.5)");
  assert.equal(g.ops[3].dark, false, "LPC flash is clear");
  assert.equal(g.ops[4].contours[0].length, 5);
  assert.ok(Math.abs(g.bounds.maxX - 12) < 1e-9 && Math.abs(g.bounds.maxY - 12) < 1e-9);
});

test("gerber: expressions and inch units", () => {
  assert.equal(_test.evalExpr("$1+$1", {1: 0.25}), 0.5);
  assert.equal(_test.evalExpr("($1-0.1)x2/4", {1: 1.1}), 0.5);
  const g = parseGerber("%FSLAX24Y24*%\n%MOIN*%\n%ADD10C,0.0100*%\nD10*\nX10000Y0D03*\nM02*\n");
  assert.ok(Math.abs(g.ops[0].x - 25.4) < 1e-9);
  assert.ok(Math.abs(g.ops[0].shapes[0].r - 0.127) < 1e-9);
});

test("excellon: tools, decimal coordinates and routed slots", () => {
  const d = parseExcellon(`M48
METRIC
T1C0.300
T2C0.800
%
G90
G05
T1
X1.5Y-2.25
X3Y-2.25
T2
G00X10Y10
M15
G01X12Y10
M16
G05
M30
`);
  assert.equal(d.holes.length, 2);
  assert.equal(d.holes[0].d, 0.3);
  assert.deepEqual([d.holes[1].x, d.holes[1].y], [3, -2.25]);
  assert.equal(d.slots.length, 1);
  assert.deepEqual([d.slots[0].x1, d.slots[0].x2, d.slots[0].d], [10, 12, 0.8]);
});

test("layer names from KiCad, EAGLE and Protel conventions", () => {
  assert.deepEqual(classifyLayer("board-F_Cu.gtl"), {role: "copper", side: "top", order: 0});
  assert.equal(classifyLayer("board-In2_Cu.g3").side, "inner");
  assert.equal(classifyLayer("board-In2_Cu.g3").order, 2);
  assert.equal(classifyLayer("x.gbs").role, "mask");
  assert.equal(classifyLayer("x-Edge_Cuts.gm1").role, "outline");
  assert.equal(classifyLayer("x-PTH.drl").role, "drill");
  assert.equal(classifyLayer("x-PTH-drl_map.gbr"), null);
  assert.equal(classifyLayer("x-job.gbrjob"), null);
});

test("outline strokes chain into a closed board loop", () => {
  const g = parseGerber("%FSLAX46Y46*%\n%MOMM*%\n%ADD10C,0.1*%\nD10*\nX0Y0D02*\nX10000000Y0D01*\nX10000000Y5000000D01*\nX0Y5000000D01*\nX0Y0D01*\nM02*\n");
  const loops = outlineLoops(g.ops);
  assert.equal(loops.length, 1);
  assert.equal(loops[0].length, 5);
});

test("gerber files open in the Gerber viewer and the route is lazy loaded", () => {
  for (const n of ["a.gtl", "a.gbl", "a.gbr", "a.gm1", "a.drl"]) assert.equal(viewerKind({name: n, path: n}), "gerber");
  assert.deepEqual(lazyRouteKeys("/engineering/gerber"), ["gerber"]);
  assert.deepEqual(lazyRouteKeys("/engineering/gerber/dykkecomputer"), ["gerber"]);
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /data-go="\/engineering\/gerber"/);
  const page = readFileSync(new URL("../assets/demos/dykkecomputer/index.html", import.meta.url), "utf8");
  assert.match(page, /#\/engineering\/gerber\/dykkecomputer/);
});
