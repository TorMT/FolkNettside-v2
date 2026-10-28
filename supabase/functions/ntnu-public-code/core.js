/** Strictly read-only relay for four already indexed public NTNU course source files.
 * No arbitrary URLs, directory traversal, NTNU credentials or cookie forwarding.
 * New files require explicit review and a new Edge Function deployment.
 */
export const APPROVED_PUBLIC_CODE_PATHS=Object.freeze([
  "/semestre/1/itgk/filer/%C3%98ving1/Avrundingsfeil%20-%20subtraksjon.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Avrundingsfeil%20-%20summering.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Funksjoner%20og%20kalkulasjoner.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Intro%20til%20jupyter.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Priser%20med%20og%20uten%20moms.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Tall-%20og%20Typekonvertering.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Tetraeder.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/Vitenskapelig%20notasjon.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving1/_Oving1.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/Billettpriser%20og%20rabatter.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/Epletigging.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/Sjakkbrett.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/Skatteetaten.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/Ulike%20typer%20if-setninger.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving2/_Oving2.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving3/Doble%20lokker.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving3/Fibonacci.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving3/Geometrisk%20rekke%20(1).ipynb",
  "/semestre/1/itgk/filer/%C3%98ving3/Hangman.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving4/Den%20store%20sporreundersokelsen.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving4/Not%20quite%20Blackjack.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving4/Poenggrenser.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving4/Poenggrenser.txt",
  "/semestre/1/itgk/filer/%C3%98ving4/Resultater.txt",
  "/semestre/1/itgk/filer/%C3%98ving4/Sekantmetoden.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Chattebot.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Intro%20til%20numpy-arrays.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Lotto.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Matriseaddisjon.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Tannfeen.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving5/Teoridelen%20paa%20eksamen.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving6/Kryptering.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving6/Lister%20og%20tupler.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving6/Litt%20sjakk.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving6/Strengmanipulasjon.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Generelt%20om%20dictionary.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Innebygde%20funksjoner%20i%20dictionaries.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Opptaksgrenser.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Soke%20i%20tekst.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Tidtaking.ipynb",
  "/semestre/1/itgk/filer/%C3%98ving7/Tre%20paa%20rad.ipynb",
  "/semestre/1/itgk/quiz/bilder/images_attribution.json",
  "/semestre/2/fysikk/quiz/bilder/images_attribution.json",
  "/semestre/2/mekanikk2/filer/%C3%98ving10/oving10_kode.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving12/oving12.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving7/oving07_koding.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving7/oving07_oppgave3.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving7/oving07_ver2.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving8/oving08_kode1.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving8/oving08_kode2.py",
  "/semestre/2/mekanikk2/filer/%C3%98ving8/oving08_kode3.py",
  "/semestre/3/Fluid/filer/%C3%98ving1/%C3%98ving1Oppgave3Kode.py",
  "/semestre/3/Fluid/filer/%C3%98ving11/Oppgave1PsudoeKode.py",
  "/semestre/3/Fluid/filer/%C3%98ving12/Oppgave2.py",
  "/semestre/3/Fluid/filer/%C3%98ving2/Oppgave2.py",
  "/semestre/3/Fluid/filer/%C3%98ving3/Oppgave%203.py",
  "/semestre/3/Fluid/filer/%C3%98ving5/Oppgave1c.py",
  "/semestre/3/Fluid/filer/%C3%98ving5/Oppgave1d.py",
  "/semestre/3/Fluid/filer/%C3%98ving5/Oppgave4d.py",
  "/semestre/3/Fluid/filer/%C3%98ving6/Oppgave3Kode.py",
  "/semestre/3/Fluid/filer/%C3%98ving7/Oppgave1cKode.py",
  "/semestre/3/Fluid/filer/%C3%98ving8/Oppgave3d.py",
  "/semestre/3/Fluid/filer/%C3%98ving9/Oppgave4bOgc.py",
  "/semestre/3/Fluid/filer/Forelesning.json",
  "/semestre/3/Fluid/filer/Forelesning.txt",
  "/semestre/3/marine-konstruksjoner/filer/%C3%98ving11/Oppgave2dOge.py",
  "/semestre/3/marine-konstruksjoner/filer/%C3%98ving8/Kode2d.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/Funksjoner.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/fungereKoden.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/input.txt",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/input2.txt",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/kok.txt",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/lengder.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/lesinput.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/main.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/momentOgSkj%C3%A6r.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/plotDiagramElement.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/plotDiagramRamme.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/plotDiagramRammeN.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/plotDiagramRammeV.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/printEksporterOutput.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/resultat_boyespenning.csv",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/NyVersjon/resultat_krefter.csv",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/b%C3%B8yespenning.csv",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/beregn_boyestivhet.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/debug.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/elemenlastvektorer.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/fungererKoden.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/input.txt",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/input2.txt",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/lengder.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/lesinput.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/main.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/momentOgSkj%C3%A6r.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/plotDiagramElement.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/plotDiagramRamme.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/plotDiagramRammeN.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/plotDiagramRammeV.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/printEksporterOutput%20copy.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/printEksporterOutput.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/reaksjonsMomenter.py",
  "/semestre/3/marine-konstruksjoner/filer/PythonProsjekt/resultat.csv",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving1/Python%C3%98ving1.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving1/Python%C3%98ving1rot.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving2/Python%C3%98ving2.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving2/Python%C3%98ving2rot.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving3/Python%C3%B8ving3.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving4/Python%C3%98ving4.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving4/snodybde.txt",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving5/Pythonoving5.ipynb",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving5/snodybde.txt",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving6/Python%C3%98ving6.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving6/leirehaug.txt",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving7/Python%C3%98ving7.py",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving7/testdata_HDPE.txt",
  "/semestre/3/mekanikk1/filer/Python%C3%98ving8/Python%C3%98ving8.py",
  "/semestre/3/mekanikk1/filer/test.py",
  "/semestre/3/organisk-kjemi/quiz/bilder/images_attribution.json",
  "/semestre/4/FysikalskKjemi/filer/Forelesning.json",
  "/semestre/4/FysikalskKjemi/filer/Forelesning.txt",
  "/semestre/4/MaterialTeknikk/filer/EksamenKompendie/EksamensKompendieV31_mikrostruktur_oppdatert.tex",
  "/semestre/4/MaterialTeknikk/filer/EksamenKompendie/Gammel/EksamensKompendieV30.tex",
  "/semestre/4/MaterialTeknikk/filer/EksamenKompendie/Gammel/TMM4100_eksamenskompendium_v19.tex",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving1/Oppgave4.py",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving1/Oppgave6.py",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving1/task6Results.csv",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving4/Oppgave6Likningl%C3%B8ser.py",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving4/TempCoolProp.py",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving6/ChatGPTScriptForSjekkeFasitOppgave3b.py",
  "/semestre/4/TermoDynamikk/filer/%C3%98ving9/Oppgave2.py",
  "/semestre/4/TermoDynamikk/filer/TermoLab/RegneEntalpiScript2.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving1/Oppgave2a.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving1/Oppgave2b.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving10/Hollenbach.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving10/Holtrop.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving10/OppgaveB-E.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving10/Sammenligning.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving11/MarinHydro%C3%98ving11Oppgave2.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving12/MarinHydro%C3%98ving12Oppgave3.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving3/Oppgave1.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving3/Oppgave2.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving4/Oppgave4c.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving7/airywavelib.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving7/lab_exercise-2026.ipynb",
  "/semestre/4/marin-Hydro/filer/%C3%98ving7/postprocessing.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving8/horiz_cylinder.py",
  "/semestre/4/marin-Hydro/filer/%C3%98ving9/%C3%98ving9.py",
  "/semestre/4/marin-Hydro/filer/ForelseningKode/Forelsening2Kode.ipynb",
  "/semestre/4/marin-Hydro/filer/Puggehefte/marin_hydro_pugghefte_v7_formelark2026.tex",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving1/MD_exercise1_lab_kode.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/AogDTest.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/const_avg_acc.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/dis_state_space.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/runge_kutta4.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/tmr4182_ex9_calling.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving3/train_s2s.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving4/Oppgave1.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving5/Oppgave2.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving6/%C3%98ving6Oppgave1.py",
  "/semestre/5/Marin-Dynamikk/filer/%C3%98ving6/%C3%98ving6Oppgave4.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/bearing_design.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/design_inputs.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/extreme_load.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/gear_design.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/load_path.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/main.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/motor_design.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/ring_gear.py",
  "/semestre/5/marin-machinery-design-and-condition-monitoring/filer/PitchSystem/KodeSomTilLavGradBleBrukt/PitchSystem/shaft_design.py",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/%C3%98vingR2/Oppgave2.py",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/20260911083041.csv",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/analysis.py",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/analysisSummary.csv",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/functions.py",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/processedData.csv",
  "/semestre/5/marin-teknikk-4-propulsjon/filer/Prosjekt/voyageSummary.csv"
]);
const APPROVED=new Set(APPROVED_PUBLIC_CODE_PATHS);
const NTNU_ORIGIN="https://tormt.folk.ntnu.no";
const ORIGINS=new Set(["https://tormt.github.io","https://tormt.folk.ntnu.no"]);
const MAX_BYTES=16_000_000;
const TYPE="text/plain; charset=utf-8";
function cors(origin){return origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{}}
function error(status,message,origin){
 return new Response(JSON.stringify({error:message}),{status,headers:{
  ...cors(origin),"Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
 }});
}
export function resolvePublicCodePath(requestURL){
 const url=new URL(requestURL);
 if(url.hash||[...url.searchParams].length!==1||
    !url.searchParams.has("path"))throw Error("Invalid relay request");
 const path=url.searchParams.get("path");
 if(!APPROVED.has(path))throw Error("Not an approved public course source file");
 return path;
}
async function readBounded(response){
 const declared=Number(response.headers.get("content-length")||0);
 if(!Number.isFinite(declared)||declared>MAX_BYTES)
   throw new RangeError("course source file too large");
 const reader=response.body?.getReader();
 if(!reader){
  const data=await response.arrayBuffer();
  if(data.byteLength>MAX_BYTES)throw new RangeError("course source file too large");
  return new Uint8Array(data);
 }
 const chunks=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>MAX_BYTES)throw new RangeError("course source file too large");
   chunks.push(value);
  }
 }finally{try{await reader.cancel()}catch{}}
 const data=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
 return data;
}
export async function handlePublicCodeRequest(request,{fetchUpstream=fetch}={}){
 const origin=request.headers.get("Origin");
 if(origin&&!ORIGINS.has(origin))return error(403,"Origin not permitted",null);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
  ...cors(origin),"Access-Control-Allow-Methods":"GET, OPTIONS",
  "Access-Control-Allow-Headers":"content-type","Access-Control-Max-Age":"300",
  "Cache-Control":"no-store"
 }});
 if(request.method!=="GET")return error(405,"Read-only endpoint",origin);
 let path;
 try{path=resolvePublicCodePath(request.url)}
 catch{return error(404,"Public course source file not approved",origin)}
 try{
  const response=await fetchUpstream(NTNU_ORIGIN+path,{
   method:"GET",redirect:"error",cache:"no-store",credentials:"omit",
   headers:{Accept:"application/octet-stream, text/plain;q=0.9"},
   signal:AbortSignal.timeout(18000)
  });
  if(!response.ok)return error(502,"Public NTNU course file unavailable",origin);
  const contentType=response.headers.get("content-type")||"";
  if(/text\/html|application\/xhtml\+xml/i.test(contentType))
    return error(502,"NTNU did not return a course source file",origin);
  const bytes=await readBounded(response);
  const opening=new TextDecoder("latin1").decode(bytes.subarray(0,80)).trimStart().toLowerCase();
  if(opening.startsWith("<!doctype")||opening.startsWith("<html")||
     opening.startsWith("<head"))return error(502,"NTNU returned HTML, not course source data",origin);
  return new Response(bytes,{status:200,headers:{
   ...cors(origin),"Content-Type":TYPE,"X-Content-Type-Options":"nosniff",
   "Content-Length":String(bytes.byteLength),
   "Cache-Control":"public, max-age=300","Content-Disposition":"inline"
  }});
 }catch(e){
  return error(e instanceof RangeError?413:502,
   e instanceof RangeError?"course source file exceeds the 12 MB preview limit":"Public NTNU file unavailable",origin);
 }
}
