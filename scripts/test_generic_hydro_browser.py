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
        print("GENERIC HYDRO BROWSER PASS: 2 STL shells, unit/axis gate, selection, volume, KG, GZ, draft solve, attitude, heel/trim equilibrium and export controls")
    finally:
        if sid:
            try:call("DELETE",f"/session/{sid}")
            except Exception:pass

if __name__=="__main__":
    try:main(sys.argv[1])
    except Exception as exc:print("GENERIC HYDRO BROWSER FAIL:",str(exc),file=sys.stderr);sys.exit(1)
