"""Rev B3 of the dive computer in Fusion: every part as its own design in '08 Rev B3',
with modelled ISO threads on the screws, then a full assembly with hinged buttons, interference check and mass. Run from Text Commands (Py):
  BASE_DIR=r'<this folder>'; exec(open(BASE_DIR + r'\\bygg_b3.py', encoding='utf-8').read()); exec('while parts(20)>0: pass'); assembly()
"""
import adsk.core, adsk.fusion, os, re, time, traceback
BASE = globals().get("BASE_DIR") or os.path.dirname(os.path.abspath(__file__))
PROJECT, FOLDER = "Dykkecomputer", "08 Rev B3"   # older revisions live in Arkiv/
ASSEMBLY = "Dykkecomputer 3.5 rev B3 - sammenstilling"
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

IDS = os.path.join(BASE, "lagret_ids_b3.json")

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

THREADS = {"m25": 2.5, "m2": 2.0, "m16": 1.6, "wet_contact": 2.0}   # part-name key -> nominal diameter, mm

def nominal(n):
    if not n.startswith(("screw", "wet_contact", "insert", "wet_nut")):
        return None
    for k in ("m25", "m16", "m2", "wet_"):
        if k in n:
            return {"m25": 2.5, "m16": 1.6, "m2": 2.0, "wet_": 2.0}[k]
    return None

def add_thread(root, n):
    """Modelled ISO metric thread on the screw shank (external) or the insert/nut bore (internal)."""
    dn = nominal(n)
    if not dn:
        return
    internal = n.startswith(("insert", "wet_nut"))
    des = root.parentDesign
    if des.designType != adsk.fusion.DesignTypes.ParametricDesignType:
        des.designType = adsk.fusion.DesignTypes.ParametricDesignType
    tf = root.features.threadFeatures
    q = tf.threadDataQuery
    T = "ISO Metric profile"
    size = next((sz for sz in q.allSizes(T) if abs(float(sz) - dn) < 1e-6), None)
    if size is None:
        log(f"{n}: ingen gjengestorrelse {dn}"); return
    desig = q.allDesignations(T, size)[0]
    classes = list(q.allClasses(internal, T, desig))
    cls = next((c for c in classes if c in ("6H", "6g")), classes[0])
    faces = [f for b in root.bRepBodies for f in b.faces
             if f.geometry.surfaceType == adsk.core.SurfaceTypes.CylinderSurfaceType and abs(f.geometry.radius - dn / 20) < 1e-4]
    if not faces:
        log(f"{n}: fant ingen sylinderflate for gjenge"); return
    face = max(faces, key=lambda f: f.area)
    info = tf.createThreadInfo(internal, T, desig, cls)
    fc = adsk.core.ObjectCollection.create(); fc.add(face)
    ti = tf.createInput(fc, info)
    ti.isFullLength = True
    ti.isModeled = not internal               # modelled on the screws; cosmetic in the inserts and nuts (the bores stay at nominal)
    try:
        tf.add(ti)
    except Exception as e:
        ti.isModeled = False
        try:
            tf.add(ti); log(f"{n}: kosmetisk gjenge ({e})")
        except Exception as e2:
            log(f"{n}: gjenge feilet ({e2})")

MAT = [("top_ring", ["Aluminum 6061"]), ("back_plate", ["Aluminum 6061"]), ("bezel", ["Aluminum 6061"]),
       ("mid_ring", ["Acetal Resin, White", "Acetal Resin, Black"]), ("lens", ["Glass, Clear Glazing, Tempered", "Glass"]),
       ("qi_window", ["PEEK"]), ("button_lever", ["Acetal Resin, Black"]), ("button_magnet", ["Iron, Cast", "Steel"]),
       ("button_pin", ["Stainless Steel 316L", "Stainless Steel"]), ("button_spring", ["Stainless Steel 316L", "Stainless Steel"]),
       ("insert", ["Brass", "Brass, Yellow"]), ("wet_nut", ["Stainless Steel 316L", "Stainless Steel"]), ("wet_tab", ["Brass", "Copper"]),
       ("display_fpc", ["Polyimide", "Nylon 6"]), ("light_sensor_flex", ["Polyimide", "Nylon 6"]),
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
    if n.startswith(("top_ring", "mid_ring", "bezel", "lens", "back_plate", "qi_window", "wet_", "oring", "screw", "insert", "button_pin", "button_spring")):
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
        try:
            add_thread(root, n)
        except Exception as e:
            log(f"{n}: gjenge feilet ({e})")
        k = 0
        for o in root.allOccurrences:          # KiCad models arrive as "Open CASCADE STEP translator ..." sub-components
            try:
                k += 1; o.component.name = f"{title} {k}"
            except Exception:
                pass
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
        for i in (1, 2, 3):                    # each lever hinges on its pin; magnet rides with the lever
            lev, mag = occs.get(f"button_lever_{i}"), occs.get(f"button_magnet_{i}")
            try:
                c2 = adsk.core.ObjectCollection.create(); c2.add(lev); c2.add(mag); root.rigidGroups.add(c2, False)
                face = next(fc for b in lev.bRepBodies for fc in b.faces
                            if fc.geometry.surfaceType == adsk.core.SurfaceTypes.CylinderSurfaceType and abs(fc.geometry.radius - 0.08) < 1e-3)
                ji = root.asBuiltJoints.createInput(lev, groups["Hus"], adsk.fusion.JointGeometry.createByNonPlanarFace(face, adsk.fusion.JointKeyPointTypes.MiddleKeyPoint))
                ji.setAsRevoluteJointMotion(adsk.fusion.JointDirections.ZAxisJointDirection)
                j = root.asBuiltJoints.add(ji); j.name = f"Knapp {i} hengsel"
                lim = j.jointMotion.rotationLimits
                lim.isMinimumValueEnabled = True; lim.minimumValue = -0.12; lim.isMaximumValueEnabled = True; lim.maximumValue = 0.12
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

THREAD_PAIRS = (("screw", "insert"), ("wet contact", "wet nut"))

def _is_thread_pair(a, b):
    a, b = a.lower(), b.lower()
    return any((a.startswith(x) and b.startswith(y)) or (a.startswith(y) and b.startswith(x)) for x, y in THREAD_PAIRS)

def check():
    """Interference in the open assembly, without the expected overlap where modelled screw threads meet a plain insert bore."""
    des = adsk.fusion.Design.cast(app.activeProduct); root = des.rootComponent
    col = adsk.core.ObjectCollection.create()
    for o in root.allOccurrences:
        if o.bRepBodies.count:
            col.add(o)
    ii = des.createInterferenceInput(col); ii.areCoincidentFacesIncluded = False
    hits = [(r.entityOne.parentComponent.name, r.entityTwo.parentComponent.name, round(r.interferenceBody.volume * 1000, 3)) for r in des.analyzeInterference(ii)]
    thread = [h for h in hits if _is_thread_pair(h[0], h[1])]
    real = [h for h in hits if not _is_thread_pair(h[0], h[1]) and h[2] >= 0.01]
    log(f"kollisjoner: {len(real)} ekte {real[:15]}; {len(thread)} er gjenger mot glatt innsatshull; {len(hits) - len(real) - len(thread)} under 0,01 mm3")
    pp = root.getPhysicalProperties(adsk.fusion.CalculationAccuracy.MediumCalculationAccuracy)
    log(f"masse {pp.mass * 1000:.0f} g")

def open_b3():
    """Make the rev B3 assembly the active document (open it from the folder if needed) and return it."""
    doc = app.activeDocument
    if doc and doc.name.startswith(ASSEMBLY):
        return doc
    for i in range(app.documents.count):
        d = app.documents.item(i)
        if d.name.startswith(ASSEMBLY):
            d.activate(); return d
    df = listing(folder()).get(ASSEMBLY)
    if not df:
        raise RuntimeError("fant ikke " + ASSEMBLY + " i " + FOLDER)
    return app.documents.open(df, True)

def revert_last(expected_description="Rev B3: manglende deler importert"):
    """Undo a save made by fill_missing() in the wrong document: promote the version before it and reopen."""
    doc = app.activeDocument
    df = doc.dataFile
    vers = [df.versions.item(i) for i in range(df.versions.count)]
    latest = max(vers, key=lambda v: v.versionNumber)
    log(f"aktivt dokument: {doc.name}, siste versjon {latest.versionNumber}: {latest.description!r}")
    if latest.description != expected_description:
        log("siste versjon er ikke fra fill_missing(); gjør ingenting"); return
    prev = max((v for v in vers if v.versionNumber < latest.versionNumber), key=lambda v: v.versionNumber)
    prev.promote()
    log(f"versjon {prev.versionNumber} er nå gjeldende; lukker uten å lagre")
    doc.close(False)
    app.documents.open(app.data.findFileById(df.id), True)
    log("åpnet på nytt: " + app.activeDocument.name)

def fill_missing():
    """Insert parts that addByInsert refused into the rev B3 assembly by importing their STEP straight into the group."""
    doc = open_b3()
    if not doc.name.startswith(ASSEMBLY):
        log("feil dokument aktivt: " + doc.name + " — avbryter"); return
    des = adsk.fusion.Design.cast(doc.products.itemByProductType("DesignProductType")); root = des.rootComponent
    groups = {root.occurrences.item(i).component.name: root.occurrences.item(i) for i in range(root.occurrences.count)}
    if not all(g in groups for g in ("Hus", "Elektronikk", "Kraft", "Knapper")):
        log("dokumentet har ikke gruppene Hus/Elektronikk/Kraft/Knapper — avbryter"); return
    present = set()
    for o in root.allOccurrences:
        present.add(re.sub(r" v\d+$", "", o.component.name).strip().lower())   # strip a version suffix, not "veml"
    missing = [n for n in names() if n.replace("_", " ").lower() not in present]
    log(f"{doc.name}: mangler {len(missing)}: {[n for n in missing]}")
    if len(missing) > 10:
        log("for mange mangler; sjekk at riktig sammenstilling er åpen — avbryter"); return
    added = 0
    for n in missing:
        title = n.replace("_", " ")
        g = groups[group(n)]
        try:
            opts = app.importManager.createSTEPImportOptions(os.path.join(BASE, "step", n + ".step"))
            app.importManager.importToTarget(opts, g.component)
            last = g.component.occurrences.item(g.component.occurrences.count - 1)
            last.component.name = title
            mt = material(n)
            if mt:
                for b in last.component.bRepBodies:
                    b.material = mt
            added += 1; log(f"importerte {title}")
        except Exception as e:
            log(f"{n}: {e}")
    log(f"la til {added} deler")
    check()
    if added:
        doc.save("Rev B3: manglende deler importert")
