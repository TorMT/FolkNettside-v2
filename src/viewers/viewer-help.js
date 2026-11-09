import {viewerKind} from "./registry.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";

// This is a capability guide, not a promise that every remote resource can be
// fetched. Keep format-specific limitations explicit and provide a safe exit.
const GUIDANCE=Object.freeze({
  pdf:["Bla gjennom PDF-sider med scrolling eller sidetall når den innebygde visningen virker.","Nettleser og filserver kan hindre innebygd visning, særlig på mobil."],
  python:["Les og kjør Python lokalt i en isolert Pyodide-økt.","Ikke alle Python-pakker eller lokale hjelpefiler kan lastes automatisk."],
  notebook:["Se lagrede Jupyter-celler og kjør støttede Python-celler.","Ikke en full Jupyter-server; enkelte widgets, pakker og store utdata støttes ikke."],
  office:["Forhåndsvis DOCX, XLSX og PPTX, med ark/lysbilder når formatet tillater det.","Kompleks formatering, formler, makroer og animasjoner er ikke fullt støttet."],
  csv:["Vis tabeller, søk og undersøk data fra CSV/TSV/PSV.","Dette er datavisning, ikke et fullverdig regneark med formler."],
  text:["Les tekst og kode, søk i forhåndsvisningen og kopier originalinnhold.","Svært store filer kan vises forkortet; originalen bevares."],
  latex:["Vis LaTeX-kilde og en begrenset matematisk forhåndsvisning.","Komplett dokumentkompilering og eksterne TeX-avhengigheter støttes ikke."],
  html:["Se HTML i en isolert forhåndsvisning.","Skript og eksterne ressurser kan være blokkert av nettlesersikkerhet."],
  image:["Se bilde og bruk tilgjengelige zoom-/visningsfunksjoner.","Filformat- og nettleserstøtte varierer."],
  video:["Se videoer og bruk avspillingskontroller.","Eksterne videoer kan være utilgjengelige eller begrenset av filserveren."],
  audio:["Spill av lydformat som nettleseren støtter.","Nettlesere støtter ulike kodeker."],
  "lecture-list":["Åpne forelesningsvideoer og tilgjengelige spillelister.","Eksternt video-innhold styres av den opprinnelige leverandøren."],
  youtube:["Se en ekstern video når innbygging er tillatt.","Tilgjengelighet, annonser og avspillingsrettigheter styres av leverandøren."],
  quiz:["Svar på quiz og bruk lokale funksjoner for progresjon.","Serverbasert resultatliste kan være utilgjengelig uten aktiv backend."],
  stl:["Inspiser 3D-geometri, rotér og undersøk komponenter.","Visning er ikke en sertifisert styrke- eller hydrostatikkberegning."],
  "three-mf":["Inspiser 3MF-geometri og tilgjengelige komponenter.","Importerte modeller må kontrolleres for enheter og geometri."],
  gltf:["Undersøk GLB/glTF-modeller i en 3D-viser.","Fysiske egenskaper kan ikke utledes sikkert fra en visuell modell alene."],
  obj:["Undersøk OBJ-geometri i en 3D-viser.","Materialer, enheter og lukkede flater må verifiseres separat."],
  cad:["Prøv forhåndsvisning av STEP/IGES/B-rep når konvertering er tilgjengelig.","Tessellert visning er ikke det samme som eksakt, redigerbar CAD-geometri."],
  fusion:["Undersøk Fusion-arkiv og tilgjengelige eksporterte komponenter.","Full native Fusion-redigering og skybasert oversetting er ikke garantert."],
  kisssoft:["Vis girmetadata og tilgjengelig pedagogisk 3D-geometri.","Ikke en erstatning for KISSsoft eller ISO 6336-styrkeberegning."],
  archive:["Undersøk støttede arkivfiler og tilgjengelig innhold.","Ikke alle arkivtyper og interne filformater kan forhåndsvises."],
  vault:["Åpne støttede krypterte ressursfiler med riktig nøkkel.","Mistet nøkkel eller ikke-støttet krypteringsformat kan ikke omgås."],
  conversion:["Se hvorfor dette formatet trenger eksport eller konvertering.","En 3D-/Office-visning kan ikke genereres direkte for alle originalformater."],
  unsupported:["Åpne originalfilen i et program som støtter formatet.","Nettleseren har ingen sikker innebygd forhåndsvisning for denne filtypen."]
});
const DEFAULT=GUIDANCE.unsupported;

export function viewerHelpContent(kind){
  const key=Object.hasOwn(GUIDANCE,String(kind))?String(kind):"unsupported";
  const [can,limit]=GUIDANCE[key];
  return {can,limit};
}

export function viewerHelpHTML(resource){
  const {can,limit}=viewerHelpContent(viewerKind(resource));
  // HTML below contains only fixed, authored text, never resource metadata.
  return `<dialog class="viewer-help-dialog" id="viewer-help-dialog" aria-labelledby="viewer-help-title">
    <div class="viewer-help-heading">
      <h2 id="viewer-help-title">Hjelp med filvisning</h2>
      <form method="dialog"><button class="btn" type="submit" aria-label="Lukk hjelp">Lukk</button></form>
    </div>
    <div class="viewer-help-body">
      <h3>Hva kan jeg gjøre her?</h3><p>${can}</p>
      <h3>Begrensninger</h3><p>${limit}</p>
      <h3>Hvis filen ikke åpnes</h3>
      <ol>
        <li>Prøv <strong>Open original</strong> for å åpne filen direkte i nettleseren eller laste den ned.</li>
        <li>Hvis <strong>Åpne nedlastet fil</strong> vises, velg en lokal kopi av akkurat denne filen. Den åpnes bare i denne nettleserfanen.</li>
        <li>På mobil: bruk vanlig scrolling i visningen. Dersom nettleseren blokkerer forhåndsvisningen, åpne originalen i en egen fane.</li>
      </ol>
      <p class="muted">Filene i NTNU-kursene ligger fortsatt på den opprinnelige filserveren. Nettleserbegrensninger og tilgangsregler kan gjøre enkelte forhåndsvisninger utilgjengelige.</p>
    </div>
  </dialog>`;
}

export function bindViewerHelp(root){
  const trigger=root.querySelector("#viewer-help-button");
  const dialog=root.querySelector("#viewer-help-dialog");
  if(!trigger||!dialog)return;
  trigger.addEventListener("click",()=>{
    if(dialog.open)return;
    trigger.setAttribute("aria-expanded","true");
    dialog.showModal();
  });
  const restoreFocus=()=>{
    trigger.setAttribute("aria-expanded","false");
    if(trigger.isConnected)trigger.focus();
  };
  const closeNow=()=>{
    if(dialog.open)dialog.close();
    restoreFocus();
  };
  // A submit with method=dialog can dispatch its close event on a later task.
  // Explicit close keeps the trigger state and focus in sync immediately.
  dialog.querySelector('form button')?.addEventListener("click",event=>{
    event.preventDefault();
    closeNow();
  });
  dialog.addEventListener("close",restoreFocus); // Esc / browser-native close
  dialog.addEventListener("click",event=>{
    if(event.target===dialog)closeNow();
  });
}
