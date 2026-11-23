"""Eksporter rev A2: GLB (meter, z opp), STEP per del + sammenstilling, STL for printdeler,
og masse-/oppdriftsbalanse fra CAD-volumer. Kjør: python3 eksport.py <utmappe>"""
import sys, os, json, math, zipfile, importlib.util
import numpy as np, trimesh, cadquery as cq
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("m", os.path.join(here, "bygg_reva2.py"))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
out = sys.argv[1]; os.makedirs(out, exist_ok=True)

# tetthet [g/cm3] eller kjent masse [kg] (datablad) – "kjent" overstyrer volum*tetthet
RHO = {"PETG": 1.27, "PVC-U": 1.40, "POM": 1.41, "A4": 7.9, "NBR": 1.2, "Bly": 11.3, "Aluminium": 2.7,
       "Messing/gummi": 4.0, "POM/A4": 3.0, "PCB": 1.9, "Li-ion": None, "Stål/Cu": None, "-": 2.0}
KNOWN = {"dpv-battery": 0.816, "dpv-motor": 0.86, "dpv-esc": 0.155, "dpv-esp32": 0.02, "dpv-bms": 0.04, "dpv-fuse": 0.03, "dpv-hall": 0.001}
INSIDE = {"dpv-battery", "dpv-bms", "dpv-fuse", "dpv-sled", "dpv-esc-plate", "dpv-esc", "dpv-esp32", "dpv-hall"}
HULL = {"dpv-front-cap", "dpv-hull-pipe", "dpv-rear-plug", "dpv-oring-1", "dpv-oring-2"}
PRINT = [k for k, v in m.parts.items() if v[3] == "PETG"]

scene = trimesh.Scene(); rows = []
for node, (shp, label, group, mat, col) in m.parts.items():
    solid = shp.val()
    verts, tris = solid.tessellate(0.3, 0.3)
    v = np.array([(p.x, p.y, p.z) for p in verts]) / 1000.0
    mesh = trimesh.Trimesh(v, np.array(tris), process=True)
    mesh.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        name=node, baseColorFactor=[*col, 1.0], metallicFactor=0.3 if mat in ("A4", "Aluminium") else 0.0, roughnessFactor=0.6))
    scene.add_geometry(mesh, node_name=node, geom_name=node)
    vol = solid.Volume() / 1000.0                    # cm3
    c = solid.Center()
    mass = KNOWN.get(node, vol * (RHO.get(mat) or 1.0) / 1000.0)
    rows.append(dict(node=node, label=label, group=group, mat=mat, vol_cm3=vol, mass_kg=mass, x=c.x, z=c.z))
    if node in PRINT:
        mesh_mm = trimesh.Trimesh(v * 1000, np.array(tris)); mesh_mm.export(os.path.join(out, node + ".stl"))
    cq.exporters.export(shp, os.path.join(out, node + ".step"))
scene.export(os.path.join(out, "dpv-reva2.glb"))
asm = cq.Assembly()
for node, (shp, *_r) in m.parts.items(): asm.add(shp, name=node)
asm.save(os.path.join(out, "dpv-reva2-sammenstilling.step"))

# --- masse og oppdrift ---
W = {r["node"]: r for r in rows}
r_o = m.PIPE_OD / 2
cap_env = math.pi * (m.CAP_OD / 2) ** 2 * m.CAP_L
pipe_env = math.pi * r_o ** 2 * (m.LP - (m.CAP_L - m.CAP_WALL))
flange_env = math.pi * r_o ** 2 * m.FLANGE_T
x_cap = m.NOSE_L + m.CAP_L / 2; x_pipe = m.NOSE_L + m.CAP_L + (m.LP - (m.CAP_L - m.CAP_WALL)) / 2; x_fl = m.X_PIPE1 + m.FLANGE_T / 2
V = [(cap_env / 1000, x_cap, 0), (pipe_env / 1000, x_pipe, 0), (flange_env / 1000, x_fl, 0)]   # cm3, x, z
for r in rows:
    if r["node"] in INSIDE or r["node"] in HULL: continue
    vol = 860 / 6.5 if r["node"] == "dpv-motor" else r["vol_cm3"]      # våt motor: materialvolum, ikke ytre sylinder
    V.append((vol, r["x"], r["z"]))
mt = sum(r["mass_kg"] for r in rows); Vt = sum(v[0] for v in V) / 1000  # L
xG = sum(r["mass_kg"] * r["x"] for r in rows) / mt; zG = sum(r["mass_kg"] * r["z"] for r in rows) / mt
xB = sum(v[0] * v[1] for v in V) / sum(v[0] for v in V); zB = sum(v[0] * v[2] for v in V) / sum(v[0] for v in V)
res = {"LP_mm": m.LP, "masse_kg": round(mt, 3), "fortrengning_L": round(Vt, 3),
       "netto_sjo_kg": round(1.025 * Vt - mt, 3), "netto_fersk_kg": round(1.000 * Vt - mt, 3),
       "xG_mm": round(xG, 1), "xB_mm": round(xB, 1), "xG_minus_xB_mm": round(xG - xB, 1),
       "zG_mm": round(zG, 1), "zB_mm": round(zB, 1),
       "lengde_mm": round(max(s[0].val().BoundingBox().xmax for s in m.parts.values()), 1),
       "dyse_OD_mm": m.DUCT_ID + 2 * m.DUCT_T}
# rørlengde som gir nøytral i sjø med samme bly: d(netto)/dLP = (1.025*pi r^2 - rho_pvc*A_vegg) per mm
dn = (1.025 * math.pi * r_o ** 2 - 1.40 * math.pi * (r_o ** 2 - (m.PIPE_ID / 2) ** 2)) / 1e6  # kg/mm
res["LP_noytral_sjo_mm"] = round(m.LP - res["netto_sjo_kg"] / dn, 0)
json.dump({"resultat": res, "deler": rows}, open(os.path.join(out, "masse-oppdrift.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False, indent=1))
