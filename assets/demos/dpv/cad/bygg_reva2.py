"""DPV (undervannsscooter) rev A2 – enkel startmodell i CadQuery.

Typiske mål ut fra det som må få plass inni (se prosjektlogg rev A2):
  - Trykkrør PVC-U 110x6,6 PN16 (ID 96,8)          verifisert i leverandørkatalog
  - 12 x Molicel P45B 21700 (Ø21,55 x 70,15)        datablad
  - Flipsky 6374 (Ø63 x 74, 10 mm aksel)            produktnavn/tegning – verifiser
  - Turnigy Marine 120A ESC 76x56x25 mm             datablad
  - Propell Ø180 i dyse (printerbegrenset)          antatt
Alle andre mål er plassholdere/typiske og skal erstattes når delene er veid og målt.
Akse: x bakover fra nesetupp, z opp, enheter mm. Kjør:  python3 bygg_reva2.py <utmappe>
"""
import math, sys, os, json
import cadquery as cq

LP = 500.0          # rørlengde (kappes til 390-660 etter veiing)
PIPE_OD, PIPE_ID = 110.0, 96.8
CAP_OD, CAP_L, CAP_WALL = 124.0, 70.0, 10.0
NOSE_L = 80.0
X_PIPE0 = NOSE_L + CAP_WALL          # rørets frontende sitter i bunnen av kappen
X_PIPE1 = X_PIPE0 + LP
PLUG_L, FLANGE_T = 40.0, 10.0
X_FLANGE1 = X_PIPE1 + FLANGE_T
PROP_D, DUCT_ID, DUCT_T, DUCT_L = 180.0, 186.0, 6.0, 90.0

def xcyl(r, length, x0, y=0.0, z=0.0):
    """Sylinder langs x fra x0."""
    return cq.Workplane("YZ", origin=(x0, y, z)).circle(r).extrude(length)

def xtube(ro, ri, length, x0):
    return cq.Workplane("YZ", origin=(x0, 0, 0)).circle(ro).circle(ri).extrude(length)

def box(lx, ly, lz, cx, cy, cz):
    return cq.Workplane("XY").box(lx, ly, lz).translate((cx, cy, cz))

def torus_x(R, r, x):
    return cq.Workplane("XY").add(cq.Solid.makeTorus(R, r, cq.Vector(x, 0, 0), cq.Vector(1, 0, 0)))

parts = {}  # node -> (shape, label, group, material, color)
def add(node, shape, label, group, material, color):
    parts[node] = (shape, label, group, material, color)

# ---------- Nese (PETG, fritt-flømmende skall) med blylommer ----------
pts = [(0, 0)]
for i in range(1, 21):
    t = i / 20
    x = NOSE_L * t
    r = (CAP_OD / 2) * math.sqrt(1 - (1 - t) ** 2)          # elliptisk nese
    pts.append((x, r))
nose_solid = cq.Workplane("XY").polyline([(0, 0)] + pts[1:] + [(NOSE_L, 0)]).close().revolve(360, (0, 0, 0), (1, 0, 0))
inner_pts = [(3 + (NOSE_L - 3) * (i / 20), max(0.1, (CAP_OD / 2 - 3) * math.sqrt(max(0, 1 - (1 - i / 20) ** 2)))) for i in range(1, 21)]
nose_void = cq.Workplane("XY").polyline([(3, 0)] + inner_pts + [(NOSE_L + 1, CAP_OD / 2 - 3), (NOSE_L + 1, 0)]).close().revolve(360, (0, 0, 0), (1, 0, 0))
nose = nose_solid.cut(nose_void)
for a in (0, 120, 240):   # dreneringshull
    ang = math.radians(a)
    nose = nose.cut(xcyl(5, 20, 20, 30 * math.cos(ang), 30 * math.sin(ang)))
nose = nose.union(xtube(24, 21, 48, 30).translate((0, 0, -20)))      # rør for bly-segmenter, lavt
add("dpv-nose", nose, "Nese (PETG, fritt-flømmende)", "Skrog / Nese", "PETG", (0.95, 0.55, 0.10))
add("dpv-lead-trim", xcyl(20.5, 46, 31, 0, -20), "Trimbly ~0,65 kg (segmenter)", "Trim / Bly", "Bly", (0.45, 0.47, 0.50))

# ---------- Trykkhus ----------
cap = xtube(CAP_OD / 2, PIPE_OD / 2, CAP_L - CAP_WALL, NOSE_L + CAP_WALL).union(xcyl(CAP_OD / 2, CAP_WALL, NOSE_L))
add("dpv-front-cap", cap, "Frontkappe PVC-U 110 (limt)", "Skrog / Trykkhus", "PVC-U", (0.55, 0.57, 0.60))
add("dpv-hull-pipe", xtube(PIPE_OD / 2, PIPE_ID / 2, LP, X_PIPE0), f"Trykkrør PVC-U 110x6,6 PN16, L={LP:.0f} mm", "Skrog / Trykkhus", "PVC-U", (0.42, 0.45, 0.50))

plug = xcyl(PIPE_ID / 2 - 0.1, PLUG_L, X_PIPE1 - PLUG_L).union(xcyl(PIPE_OD / 2, FLANGE_T, X_PIPE1))
plug = plug.cut(xcyl(38, 25, X_PIPE1 - PLUG_L - 1))                 # lomme innvendig
for gx in (X_PIPE1 - 32, X_PIPE1 - 16):                              # O-ringspor (mål fra Parker – TBD)
    plug = plug.cut(xtube(PIPE_ID / 2 + 1, PIPE_ID / 2 - 2.8, 4.7, gx - 2.35))
pen_pos = [(22 * math.cos(math.radians(a)), 22 * math.sin(math.radians(a))) for a in (90, 210, 330)]
for (py, pz) in pen_pos:
    plug = plug.cut(xcyl(3.2, PLUG_L + FLANGE_T + 2, X_PIPE1 - PLUG_L - 1, py, pz))
plug = plug.cut(xcyl(4, 60, X_PIPE1 - PLUG_L - 1, 0, -8)).cut(xcyl(6, 60, X_PIPE1 - PLUG_L - 1, 0, 8))
add("dpv-rear-plug", plug, "Bakplugg POM (dobbel radiell O-ring)", "Skrog / Bakplugg", "POM", (0.92, 0.92, 0.88))
for i, gx in enumerate((X_PIPE1 - 32, X_PIPE1 - 16), 1):
    add(f"dpv-oring-{i}", torus_x(PIPE_ID / 2 - 1.8, 1.765, gx), f"O-ring {i} NBR70 (3,53 mm, TBD Parker)", "Skrog / Bakplugg", "NBR", (0.08, 0.08, 0.08))
for i, (py, pz) in enumerate(pen_pos, 1):
    bolt = xcyl(3, 24 + FLANGE_T + 8, X_PIPE1 - 24, py, pz).union(xcyl(5.5, 4, X_FLANGE1, py, pz))
    add(f"dpv-penetrator-{i}", bolt, f"Fasegjennomføring {i} (A4 M6)", "Elektrisk / Gjennomføringer", "A4", (0.75, 0.75, 0.78))
add("dpv-schrader", xcyl(4, 30, X_PIPE1 - 15, 0, -8), "Schrader-ventil (vakuumtest)", "Skrog / Ventiler", "Messing/gummi", (0.80, 0.65, 0.25))
add("dpv-relief", xcyl(6, 22, X_PIPE1 - 8, 0, 8), "Trykkavlastningsventil (fjær + O-ring)", "Skrog / Ventiler", "POM/A4", (0.85, 0.20, 0.15))
for i, a in enumerate((30, 150, 270), 1):
    ang = math.radians(a)
    s = cq.Workplane("XY").add(cq.Solid.makeCylinder(2.5, 16, cq.Vector(X_PIPE1 - 6, 49 * math.cos(ang), 49 * math.sin(ang)), cq.Vector(0, -math.cos(ang), -math.sin(ang))))
    add(f"dpv-retainer-{i}", s, f"Pluggholder {i} (A4 M5, radiell)", "Skrog / Bakplugg", "A4", (0.75, 0.75, 0.78))
    for key in ("dpv-hull-pipe", "dpv-rear-plug"):
        shp, *rest = parts[key]
        parts[key] = (shp.cut(s), *rest)

# ---------- Innmat ----------
BX0, ZOFF = X_PIPE0 + 12, -4.0  # batteriet lavt for rullstabilitet
cells = []
for k in range(9):
    a = math.radians(40 * k); cells.append((33 * math.cos(a), 33 * math.sin(a)))
for k in range(3):
    a = math.radians(120 * k + 20); cells.append((12.4 * math.cos(a), 12.4 * math.sin(a)))
bat = None
for (cy_, cz_) in cells:
    c = xcyl(10.775, 70.15, BX0, cy_, cz_ + ZOFF)
    bat = c if bat is None else bat.union(c)
add("dpv-battery", bat, "Batteri 6S2P Molicel P45B (12 celler)", "Kraft / Batteri", "Li-ion", (0.15, 0.45, 0.85))
add("dpv-bms", box(5, 60, 45, BX0 + 88, 0, ZOFF), "BMS 6S med NTC", "Kraft / Batteri", "PCB", (0.10, 0.50, 0.20))
add("dpv-fuse", box(30, 20, 15, BX0 + 110, 0, -27.5), "Hovedsikring 40 A", "Kraft / Batteri", "-", (0.90, 0.75, 0.10))
RAIL_X0 = BX0 + 95
RAIL_X1 = X_PIPE1 - PLUG_L - 4
sled = box(RAIL_X1 - RAIL_X0, 50, 4, (RAIL_X0 + RAIL_X1) / 2, 0, -38)
for xr in (X_PIPE0 + 2, BX0 + 72, X_PIPE1 - PLUG_L - 12):
    sled = sled.union(xtube(PIPE_ID / 2 - 0.5, PIPE_ID / 2 - 6, 5, xr))
sled = sled.union(xtube(PIPE_ID / 2 - 6, 33, 4, BX0 + 72))   # holderskive bak batteriet
add("dpv-sled", sled, "Indre slede (PETG)", "Innmat / Slede", "PETG", (0.95, 0.80, 0.30))
ESC_X1 = X_PIPE1 - PLUG_L - 4
add("dpv-esc-plate", box(4, 60, 60, ESC_X1 + 2, 0, 0).union(box(100, 50, 4, ESC_X1 - 50, 0, -30)), "Varmeplate aluminium for ESC", "Elektrisk / ESC", "Aluminium", (0.70, 0.72, 0.75))
add("dpv-esc", box(76, 56, 25, ESC_X1 - 40, 0, -15.5), "ESC Turnigy Marine 120A (76x56x25)", "Elektrisk / ESC", "-", (0.12, 0.12, 0.14))
add("dpv-esp32", box(52, 28, 10, ESC_X1 - 135, 0, -30), "ESP32-kort (gass, dødmann, logging)", "Elektrisk / Styring", "PCB", (0.10, 0.30, 0.60))
add("dpv-hall", box(6, 5, 2, X_PIPE1 - 131, 0, PIPE_ID / 2 - 2), "Hall-sensor (trigger)", "Elektrisk / Styring", "-", (0.9, 0.9, 0.2))

# ---------- Drivlinje ----------
MX0 = X_FLANGE1 + 20
mount = xtube(PIPE_OD / 2, 40, 6, X_FLANGE1).union(xtube(36, 31.5, 26, X_FLANGE1))
add("dpv-motor-mount", mount, "Motorfeste (PETG)", "Drivlinje / Feste", "PETG", (0.95, 0.55, 0.10))
motor = xcyl(31.5, 74, MX0).union(xcyl(5, 28, MX0 + 74))
add("dpv-motor", motor, "Motor Flipsky 6374 140KV (våt)", "Drivlinje / Motor", "Stål/Cu", (0.25, 0.25, 0.28))
PX = MX0 + 74 + 8
hub = xcyl(16, 26, PX).cut(xcyl(5, 40, PX - 5))
prop = hub
for k in range(3):
    blade = (cq.Workplane("XY").box(24, 3.5, PROP_D / 2 - 14).translate((0, 0, (PROP_D / 2 - 14) / 2 + 14))
             .rotate((0, 0, 0), (0, 0, 1), 28).rotate((0, 0, 0), (1, 0, 0), 120 * k).translate((PX + 13, 0, 0)))
    prop = prop.union(blade)
add("dpv-propeller", prop, "Propell Ø180, 3 blader (PETG/nylon, plassholder)", "Drivlinje / Propell", "PETG", (0.20, 0.70, 0.75))
DX0 = PX - 30
duct = xtube(DUCT_ID / 2 + DUCT_T, DUCT_ID / 2, DUCT_L, DX0)
stator = None
for k in range(4):
    v = (cq.Workplane("XY").box(6, 4, DUCT_ID / 2 - 15).translate((0, 0, (DUCT_ID / 2 - 15) / 2 + 15))
         .rotate((0, 0, 0), (1, 0, 0), 45 + 90 * k).translate((DX0 + DUCT_L - 6, 0, 0)))
    stator = v if stator is None else stator.union(v)
stator = stator.union(xcyl(16, 10, DX0 + DUCT_L - 11))
for k in range(4):   # skrå stag fra motorfeste (r=48) til dyseveggen (r=96)
    a = math.radians(90 * k)
    p0 = cq.Vector(X_FLANGE1 + 9, 48 * math.cos(a), 48 * math.sin(a))
    p1 = cq.Vector(DX0 + 12, 96 * math.cos(a), 96 * math.sin(a))
    d = p1 - p0
    st = cq.Workplane("XY").add(cq.Solid.makeCylinder(4, d.Length, p0, d.normalized()))
    stator = stator.union(st)
add("dpv-duct", duct.union(stator), "Dyse ID186 med stator og stag (PETG, én print, propellvern)", "Drivlinje / Dyse", "PETG", (0.95, 0.55, 0.10))

# ---------- Håndtak, trigger, klemmer ----------
HX = X_PIPE1 - 110
saddle = xtube(PIPE_OD / 2 + 6, PIPE_OD / 2, 70, HX - 35).intersect(box(80, 140, 60, HX, 0, 45))
post = box(30, 26, 60, HX, 0, PIPE_OD / 2 + 30)
grip = cq.Workplane("XZ", origin=(HX, -130, PIPE_OD / 2 + 60)).circle(15).extrude(-260)
add("dpv-handle", saddle.union(post).union(grip), "Håndtak (PETG)", "Kontroll / Håndtak", "PETG", (0.20, 0.20, 0.22))
trig = box(6, 24, 50, HX - 21, 0, PIPE_OD / 2 + 7 + 25)
trig = trig.union(xcyl(5, 4, HX - 22, 0, PIPE_OD / 2 + 12))  # magnet nederst
add("dpv-trigger", trig, "Trigger med magnet (PETG)", "Kontroll / Trigger", "PETG", (0.85, 0.15, 0.15))
for i, cx in enumerate((HX - 30, HX + 30), 1):
    add(f"dpv-clamp-{i}", torus_x(PIPE_OD / 2 + 7.5, 1.5, cx), f"Slangeklemme {i} (rustfri)", "Kontroll / Håndtak", "A4", (0.75, 0.75, 0.78))
eye = cq.Workplane("XY").add(cq.Solid.makeTorus(6, 2.5, cq.Vector(X_FLANGE1 + 30, 0, -92.5), cq.Vector(0, 1, 0)))
add("dpv-tow-eye", eye, "Festeøye for tow-cord (A4)", "Kontroll / Tow-cord", "A4", (0.75, 0.75, 0.78))

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "ut"
    os.makedirs(out, exist_ok=True)
    meta = []
    for node, (shp, label, group, mat, col) in parts.items():
        cq.exporters.export(shp, os.path.join(out, node + ".step"))
        meta.append({"node": node, "label": label, "viewerGroup": group, "material": mat, "color": col,
                     "volume_mm3": shp.val().Volume() if hasattr(shp.val(), "Volume") else None})
    json.dump({"LP": LP, "parts": meta}, open(os.path.join(out, "deler.json"), "w"), ensure_ascii=False, indent=1)
    print(len(parts), "deler skrevet til", out)
