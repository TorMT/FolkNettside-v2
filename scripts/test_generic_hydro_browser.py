#!/usr/bin/env python3
"""End-to-end local STL import, shell selection and gated Hydro in Chrome."""
import json,sys,time,urllib.request

DRIVER="http://127.0.0.1:9516"
def call(method,path,data=None):
    payload=None if data is None else json.dumps(data).encode()
    with urllib.request.urlopen(urllib.request.Request(DRIVER+path,data=payload,method=method,
         headers={"Content-Type":"application/json"}),timeout=35) as r:
        result=json.load(r)
    val=result.get("value")
    if isinstance(val,dict) and val.get("error"):raise RuntimeError(json.dumps(val))
    return val
def js(session,script):
    return call("POST",f"/session/{session}/execute/sync",{"script":script,"args":[]})
def wait(session,fn,what,seconds=35):
    start=time.monotonic()
    while time.monotonic()-start<seconds:
        result=js(session,fn)
        if result:return result
        time.sleep(.35)
    raise RuntimeError("Timed out: "+what+"; page="+str(js(session,"return document.body.innerText.slice(-1800)")))
def main(url):
    sid=None
    try:
        for _ in range(80):
            try:call("GET","/status");break
            except Exception:time.sleep(.15)
        else:raise RuntimeError("Chromedriver missing")
        response=call("POST","/session",{"capabilities":{"alwaysMatch":{
            "browserName":"chrome","goog:chromeOptions":{"args":[
              "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
              "--window-size=1440,1000"]}}}})
        sid=response.get("sessionId")
        if not sid:raise RuntimeError("No ChromeDriver session")
        call("POST",f"/session/{sid}/url",{"url":url})
        wait(sid,"return !!document.querySelector('#engineering-hull-file')","Engineering file input")
        script="""
        const done=arguments[arguments.length-1];
        (async()=>{
          const {boxMesh}=await import('/src/hydro/fixtures.js');
          const parts=[boxMesh({L:10,B:3,H:2}),boxMesh({L:1,B:1,H:1,origin:[0,0,1]})];
          const text=['solid uploaded'];
          for(const mesh of parts)for(let i=0;i<mesh.indices.length;i+=3){
            text.push(' facet normal 0 0 0','  outer loop');
            for(let j=0;j<3;j++){
              const k=mesh.indices[i+j]*3;
              text.push('   vertex '+mesh.positions.slice(k,k+3).join(' '));
            }
            text.push('  endloop',' endfacet');
          }
          text.push('endsolid uploaded');
          const file=new File([text.join('\\n')],'two-bodies.stl',{type:'application/sla'});
          const dt=new DataTransfer();dt.items.add(file);
          const picker=document.querySelector('#engineering-hull-file');
          picker.files=dt.files;
          picker.dispatchEvent(new Event('change',{bubbles:true}));
          done('file-selected');
        })().catch(error=>done('error: '+error));
        """
        step=call("POST",f"/session/{sid}/execute/async",{"script":script,"args":[]})
        if step!="file-selected":raise RuntimeError(str(step))
        wait(sid,"return document.querySelectorAll('[data-hydro-import-part]').length===2",
             "two disconnected surfaces after import")
        initial=js(sid,"return document.body.innerText.includes('Confirm source units and Z-up')")
        if not initial:raise RuntimeError("Unit/axis acknowledgement not enforced")
        js(sid,"document.querySelector('[data-hydro-import-part]').click();return true")
        wait(sid,"return document.querySelector('[data-hydro-import-part]')?.checked===true",
             "explicit surface selected")
        js(sid,"document.querySelector('#engineering-confirm-import').click();return true")
        wait(sid,"return document.querySelector('.hydro-preflight-pass')!==null","Hydro preflight accepted")
        readout=js(sid,"return document.querySelector('.results-summary')?.innerText||''")
        if "30" not in readout:raise RuntimeError("Expected 30 m3, got "+repr(readout))
        # Exercise the actual Engineering event handlers, not only rendered controls.
        js(sid,"const e=document.querySelector('#hydro-kg');e.value='0.5';e.dispatchEvent(new Event('change',{bubbles:true}));return true")
        wait(sid,"return !!document.querySelector('#hydro-gz')&&!document.querySelector('#hydro-gz').disabled",
             "KG enables GZ/attitude buttons")
        js(sid,"document.querySelector('#hydro-gz').click();return true")
        wait(sid,"return !!document.querySelector('.gz-curve svg')&&!document.querySelector('#hydro-export-gz')?.disabled",
             "GZ button creates computed plot and downloadable table",seconds=60)
        js(sid,"const t=document.querySelector('#hydro-target');t.value='30.75';document.querySelector('#hydro-solve').click();return true")
        wait(sid,"return document.querySelector('.hydro-solve-result')?.innerText.includes('volume residual')",
             "Solve draft updates Hydro result with volume residual",seconds=45)
        js(sid,"document.querySelector('#hydro-attitude').click();return true")
        wait(sid,"return !!document.querySelector('.hydro-attitude-result')",
             "Attitude analysis action returns numerical result",seconds=60)
        js(sid,"document.querySelector('#hydro-equilibrium-heel').click();return true")
        wait(sid,"return !!document.querySelector('.hydro-attitude-result')&&document.querySelector('.hydro-attitude-result').innerText.includes('Heel equilibrium')",
             "Heel equilibrium button updates Hydro inspector",seconds=60)
        js(sid,"document.querySelector('#hydro-equilibrium-trim').click();return true")
        wait(sid,"return !!document.querySelector('.hydro-attitude-result')&&document.querySelector('.hydro-attitude-result').innerText.includes('Trim equilibrium')",
             "Trim equilibrium button updates Hydro inspector",seconds=60)
        assert_exports=js(sid,"return !!document.querySelector('#hydro-export-table')&&!document.querySelector('#hydro-export-table').disabled")
        if not assert_exports:raise RuntimeError("Hydrostatic CSV export is disabled")
        # Actual point-weight UI integration: mass added at (x=1, y=.5, z=2)
        # must increase displacement and produce BOTH updated GM directions.
        js(sid,"const w=document.querySelector('#hydro-point-weights');w.value='1,1,0.5,2';w.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#hydro-point-apply').click();return true")
        wait(sid,"return !!document.querySelector('.hydro-point-summary')&&document.querySelector('.hydro-point-summary').innerText.includes('GM transverse')&&document.querySelector('.hydro-point-summary').innerText.includes('GM longitudinal')",
            "Point weight recalculates loaded displacement and both initial GM axes",seconds=60)
        loaded=js(sid,"return document.querySelector('.hydro-point-summary')?.innerText||''")
        if "31.750" not in loaded:raise RuntimeError("Point-weight mass balance failed: "+repr(loaded))
        if "Loaded GM unavailable" in loaded:raise RuntimeError("Point-weight draft/GM solver did not converge")
        values=js(sid,'''const cells=[...document.querySelectorAll('.hydro-loaded-gm-grid strong')];
            return cells.map(cell=>Number.parseFloat(cell.textContent));''')
        if not values or len(values)!=4:raise RuntimeError("Loaded GM axes missing in Engineering results")
        mass,draft,gmt,gml=values
        rho=1025.0
        expected_mass=31.75
        expected_draft=(expected_mass*1000/rho)/(10*3)
        expected_kg=(30.75*.5+1*2)/expected_mass
        expected_gmt=expected_draft/2+3**2/(12*expected_draft)-expected_kg
        expected_gml=expected_draft/2+10**2/(12*expected_draft)-expected_kg
        checks=[(mass,expected_mass,.001,"mass"),
          (draft,expected_draft,.0001,"draft"),
          (gmt,expected_gmt,.0002,"GM transverse"),
          (gml,expected_gml,.0002,"GM longitudinal")]
        for actual,expected,tol,name in checks:
            if abs(actual-expected)>tol:
                raise RuntimeError(f"Wrong loaded {name}: {actual}, expected {expected}")
        # Re-enter an explicit hull mass and area load; verify loaded GM
        # numerically against an independent 10 x 3 m box formula.
        js(sid,"document.querySelector('#hydro-point-reset').click();return true")
        wait(sid,"return !!document.querySelector('#hydro-hull-mass')",
             "Explicit hull mass input restored",seconds=35)
        js(sid,"""const set=(id,value)=>{const el=document.querySelector(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))};
          set('#hydro-hull-mass','30.75');
          set('#hydro-point-weights','1,1,0.5,2');
          set('#hydro-area-loads','0.25,-2,2,-1,1,2');
          document.querySelector('#hydro-point-apply').click();
          return true;""")
        wait(sid,"return document.querySelector('.hydro-point-summary')?.innerText.includes('33.750')&&!!document.querySelector('.hydro-loaded-gm-grid')",
             "Hull mass + point and rectangular deck mass leads to loaded GM",seconds=60)
        new_values=js(sid,"return [...document.querySelectorAll('.hydro-loaded-gm-grid strong')].map(e=>Number.parseFloat(e.textContent))")
        target=33.75
        T_expected=(target*1000/1025)/(10*3)
        kg_expected=(30.75*0.5+1*2+2*2)/target
        expected=[target,T_expected,T_expected/2+3**2/(12*T_expected)-kg_expected,
                  T_expected/2+10**2/(12*T_expected)-kg_expected]
        for actual,reference,tolerance,label in zip(new_values,expected,[0.002,0.0002,0.0002,0.0002],["mass","draft","GMt","GMl"]):
            if abs(actual-reference)>tolerance:
                raise RuntimeError(f"Loaded area/point {label}: {actual}, expected {reference}")

        js(sid,"[...document.querySelectorAll('[data-engineering-mode]')].find(e=>e.dataset.engineeringMode==='Structure').click();return true")
        wait(sid,"return !!document.querySelector('#girder-run')",
             "Global hull-girder structure controls visible",seconds=35)
        read=js(sid,"return [document.querySelector('#girder-hull-mass').value,document.querySelector('#girder-cg-z').value]")
        if read!=["30.75","0.5"]:
            raise RuntimeError("Structure must use original hull mass/CG, not loaded CG: "+str(read))
        js(sid,"""const set=(id,value)=>{document.querySelector(id).value=value};
          set('#girder-e','210');set('#girder-i','0.08');
          set('#girder-c','1');set('#girder-neutral-z','1');
          document.querySelector('#girder-axis-confirm').checked=true;
          document.querySelector('#girder-run').click();return true;""")
        wait(sid,"return document.querySelectorAll('.hull-fem-diagram').length===2",
             "Engineering Structure solve and colored stress/deflection diagrams",seconds=60)
        wait(sid,"return !!document.querySelector('#girder-3d-legend')&&!!document.querySelector('#engineering-scene canvas')",
             "3D hull colored by global FEM stress",seconds=60)
        structure_error=js(sid,"return document.querySelector('.hydro-solve-error')?.textContent||''")
        if structure_error:raise RuntimeError("Unexpected global FEM error: "+structure_error)
        print("GENERIC HYDRO BROWSER PASS: 2 STL shells, unit/axis gate, selection, volume, KG, GZ, draft solve, attitude, heel/trim equilibrium point/area loads, loaded GM in both axes, structural contours and export controls")
    finally:
        if sid:
            try:call("DELETE",f"/session/{sid}")
            except Exception:pass

if __name__=="__main__":
    try:main(sys.argv[1])
    except Exception as exc:print("GENERIC HYDRO BROWSER FAIL:",str(exc),file=sys.stderr);sys.exit(1)
