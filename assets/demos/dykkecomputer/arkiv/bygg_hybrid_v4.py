"""Rev B hybrid of the dive computer in Fusion: every part as its own design in '06 Rev B hybrid',
then a full assembly with joints, interference check and mass. Run from Text Commands (Py):
  BASE_DIR=r'<this folder>'; exec(open(BASE_DIR + r'\\bygg_hybrid.py', encoding='utf-8').read()); parts(15)   # repeat until 0 left
  assembly()
"""
import adsk.core, adsk.fusion, os, time, traceback
BASE = globals().get("BASE_DIR") or os.path.dirname(os.path.abspath(__file__))
PROJECT, FOLDER = "Dykkecomputer", "06 Rev B hybrid"
ASSEMBLY = "Dykkecomputer 3.5 rev B hybrid - sammenstilling"
app = adsk.core.Application.get()
LOG = os.path.join(BASE, "logg_hybrid.txt")

def log(m):
    line = time.strftime("%H:%M:%S ") + str(m)
    print(line)
    open(LOG, "a", encoding="utf-8").write(line + "\n")

def wait(s):
    t = time.time()
    while time.time() - t < s:
        adsk.doEvents(); time.sleep(0.05)

def folder():
    hub = app.data.activeHub
    proj = [hub.dataProjects.item(i) for i in range(hub.dataProjects.count) if hub.dataProjects.item(i).name == PROJECT][0]
    f = proj.rootFolder.dataFolders.itemByName(FOLDER)
    return f if f else proj.rootFolder.dataFolders.add(FOLDER)

IDS = os.path.join(BASE, "lagret_ids.json")

def saved():
    """Name -> DataFile id, kept in a local file (listing a fresh cloud folder is unreliable)."""
    import json
    try:
        return json.load(open(IDS, encoding="utf-8"))
    except Exception:
        return {}

def remember(name, fid):
    import json
    d = saved(); d[name] = fid
    json.dump(d, open(IDS, "w", encoding="utf-8"), indent=0)

def listing(f, want=0):
    """Name -> DataFile from the cloud folder, retrying while uploads settle."""
    out = {}
    for _ in range(40):
        out = {}
        try:
            fs = f.dataFiles
            for i in range(fs.count):
                try:
                    df = fs.item(i); out[df.name] = df
                except Exception:
                    pass
        except Exception:
            pass
        if len(out) >= want:
            break
        wait(3)
    return out

def resolve(fid, title, cache):
    """The id from saveAs can be a temporary one, so fall back to the folder listing by name."""
    if fid:
        try:
            df = app.data.findFileById(fid)
            if df:
                return df
        except Exception:
            pass
    return cache.get(title)

MAT = [("top_ring", ["Aluminum 6061"]), ("back_plate", ["Aluminum 6061"]), ("bezel", ["Aluminum 6061"]),
       ("mid_ring", ["Acetal Resin, White", "Acetal Resin, Black"]), ("lens", ["Glass, Clear Glazing, Tempered", "Glass"]),
       ("qi_window", ["PEEK"]), ("button_lever", ["Acetal Resin, Black"]), ("button_magnet", ["Iron, Cast", "Steel"]),
       ("oring", ["Rubber, Nitrile", "Rubber", "Rubber, Silicone"]), ("screw", ["Stainless Steel 316L", "Stainless Steel"]),
       ("wet_contact", ["Stainless Steel 316L", "Stainless Steel"]), ("pogo", ["Copper"]), ("foam", ["Foam", "Rubber, Silicone", "ABS Plastic"]),
       ("battery_tray", ["Nylon 12 (with Formlabs Fuse 1 3D Printer)", "Nylon 6"]), ("main_pcb", ["FR4"]), ("sensor_board", ["FR4"]),
       ("display", ["Glass"]), ("lipo", ["Aluminum"]), ("qi_coil", ["Copper"]), ("rx_coil", ["Copper"]), ("qi_ferrite", ["Iron, Cast"]),
       ("rx_ferrite", ["Iron, Cast"]), ("vibration", ["Steel"]), ("", ["Epoxy Resin", "ABS Plastic"])]
_m = None
def material(name):
    global _m
    if _m is None:
        lib = app.materialLibraries.itemByName("Fusion Material Library")
        _m = {lib.materials.item(i).name: lib.materials.item(i) for i in range(lib.materials.count)}
    for key, cands in MAT:
        if name.startswith(key):
            for c in cands:
                if c in _m:
                    return _m[c]
    return None

def group(n):
    if n.startswith(("top_ring", "mid_ring", "bezel", "lens", "back_plate", "qi_window", "wet_contact", "oring", "screw")):
        return "Hus"
    if n.startswith("button"):
        return "Knapper"
    if n.startswith(("lipo", "battery_tray", "qi_coil", "qi_ferrite", "rx_")):
        return "Kraft"
    return "Elektronikk"

def names():
    return sorted(f[:-5] for f in os.listdir(os.path.join(BASE, "step")) if f.endswith(".step"))

def parts(limit=15):
    f = folder(); have = saved(); made = 0
    for n in names():
        title = n.replace("_", " ")
        if title in have:
            continue
        if made >= limit:
            break
        doc = app.importManager.importToNewDocument(app.importManager.createSTEPImportOptions(os.path.join(BASE, "step", n + ".step")))
        root = adsk.fusion.Design.cast(doc.products.itemByProductType("DesignProductType")).rootComponent
        mt = material(n)
        if mt:
            root.material = mt
        doc.saveAs(title, f, "Rev B hybrid, " + group(n), "")
        for _ in range(60):
            wait(0.5)
            try:
                if doc.dataFile and doc.dataFile.id:
                    break
            except Exception:
                pass
        remember(title, doc.dataFile.id)
        doc.close(False); made += 1
    left = len([n for n in names() if n.replace("_", " ") not in saved()])
    log(f"lagret {made}, igjen {left}")
    return left

def assembly():
    try:
        f = folder()
        if saved().get("__assembly__"):
            log("sammenstillingen finnes"); return
        cache = listing(f, len(names()))
        log(f"mappa har {len(cache)} filer")
        doc = app.activeDocument
        if doc and doc.name.startswith(ASSEMBLY):
            # reuse the half-built assembly from an earlier run instead of saving a second copy
            des = adsk.fusion.Design.cast(doc.products.itemByProductType("DesignProductType"))
            root = des.rootComponent
            while root.occurrences.count:
                root.occurrences.item(0).deleteMe()
            fresh = False
        else:
            doc = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
            des = adsk.fusion.Design.cast(app.activeProduct)
            root = des.rootComponent
            fresh = True
        des.designType = adsk.fusion.DesignTypes.ParametricDesignType
        if fresh:
            doc.saveAs(ASSEMBLY, f, "Rev B: hybridhus, montert innmat, 28,5 mm", ""); wait(3)
        groups = {}
        for g in ("Hus", "Elektronikk", "Kraft", "Knapper"):
            o = root.occurrences.addNewComponent(adsk.core.Matrix3D.create()); o.component.name = g; groups[g] = o
        have = saved(); occs = {}
        for n in names():
            df = resolve(have.get(n.replace("_", " ")), n.replace("_", " "), cache)
            if not df:
                log("mangler " + n); continue
            for a in range(10):
                try:
                    o = groups[group(n)].component.occurrences.addByInsert(df, adsk.core.Matrix3D.create(), True)
                    occs[n] = o.createForAssemblyContext(groups[group(n)]); break
                except Exception as e:
                    if a == 9: log(f"{n}: {e}")
                    wait(3)
        log(f"satt inn {len(occs)} av {len(names())}")
        groups["Hus"].isGrounded = True
        col = adsk.core.ObjectCollection.create()
        for g in ("Hus", "Elektronikk", "Kraft"):
            col.add(groups[g])
        root.rigidGroups.add(col, True)
        for i in (1, 2, 3):
            lev, mag = occs.get(f"button_lever_{i}"), occs.get(f"button_magnet_{i}")
            try:
                c2 = adsk.core.ObjectCollection.create(); c2.add(lev); c2.add(mag); root.rigidGroups.add(c2, False)
                face = next(fc for b in lev.bRepBodies for fc in b.faces if fc.geometry.surfaceType == adsk.core.SurfaceTypes.CylinderSurfaceType)
                ji = root.asBuiltJoints.createInput(lev, groups["Hus"], adsk.fusion.JointGeometry.createByNonPlanarFace(face, adsk.fusion.JointKeyPointTypes.MiddleKeyPoint))
                ji.setAsSliderJointMotion(adsk.fusion.JointDirections.ZAxisJointDirection)
                j = root.asBuiltJoints.add(ji); j.name = f"Knapp {i}"
                lim = j.jointMotion.slideLimits
                lim.isMinimumValueEnabled = True; lim.minimumValue = -0.15; lim.isMaximumValueEnabled = True; lim.maximumValue = 0.15
            except Exception as e:
                log(f"knapp {i}: {e}")
        c3 = adsk.core.ObjectCollection.create()
        for o in occs.values():
            c3.add(o)
        ii = des.createInterferenceInput(c3); ii.areCoincidentFacesIncluded = False
        res = des.analyzeInterference(ii)
        hits = [(r.entityOne.parentComponent.name, r.entityTwo.parentComponent.name, round(r.interferenceBody.volume * 1000, 3)) for r in res]
        log(f"kollisjoner: {len(hits)} {hits[:10]}")
        pp = root.getPhysicalProperties(adsk.fusion.CalculationAccuracy.MediumCalculationAccuracy)
        log(f"masse {pp.mass * 1000:.0f} g")
        app.activeViewport.fit()
        doc.save("Rev B hybrid: deler, ledd, kollisjonssjekk")
        remember("__assembly__", doc.dataFile.id)
        log("lagret " + ASSEMBLY)
    except Exception:
        log(traceback.format_exc())
