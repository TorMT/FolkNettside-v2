/**
 * GA4, shared with legacy FolkNettside but never with its public Looker embed.
 * The tag may load before opt-in, but no manual page-view is emitted until
 * consent. Reporting access remains in
 * the owner's Google account. Page locations are deliberately coarse to avoid
 * disclosing course names, file paths, medical data or URL parameters.
 */
const CONSENT_KEY="folk.analytics.consent.v1";
const GA_ID=/^G-[A-Z0-9]{4,20}$/;
const PRIVATE_PREFIXES=[
  "/diverse/medisin","/diverse/diving","/diverse/dive-map",
  "/diverse/brewing","/tools/vault","/settings/connections"
];
const LABELS=Object.freeze({
  "/":"Home","/about":"About","/cv":"CV","/contact":"Contact",
  "/courses":"Courses","/engineering":"Engineering","/tools":"Tools",
  "/diverse":"Diverse","/projects":"Projects","/settings":"Settings"
});
let loaded=false,configured=false,lastRawRoute="";
let sessionChoice=null;

export function analyticsMeasurementId(value=globalThis.__FOLK_ANALYTICS_ID__){
  const id=String(value||"").trim();
  return GA_ID.test(id)?id:"";
}
export function analyticsConsentChoice(storage){
  try{
    const choice=(storage===undefined?globalThis.localStorage:storage)?.getItem(CONSENT_KEY);
    if(choice==="granted"||choice==="denied")return choice;
  }catch{}
  return sessionChoice??"unset";
}
export function analyticsConsent(){
  return analyticsConsentChoice()==="granted";
}
export function analyticsConfigured(){return Boolean(analyticsMeasurementId())}

/** Returns only an approved coarse page group; never the user-supplied URL. */
export function safeAnalyticsPage(url){
  let parsed;
  try{parsed=new URL(String(url),"https://invalid.example")}catch{return null}
  // Decode once before checking private routes; encoded traversal/PII must
  // never leak, since we only output a canonical fixed set of page names.
  let route;
  try{
    // A raw hash may include query-like '&' parameters without '?'; treat
    // those as private metadata too, not as part of a route identifier.
    const raw=(parsed.hash.slice(1).split(/[?#&]/,1)[0]||"/");
    route=(decodeURIComponent(raw).replace(/\/+$/,"")||"/");
  }catch{return null}
  if(!route.startsWith("/")||route.length>512)return null;
  if(PRIVATE_PREFIXES.some(prefix=>route===prefix||route.startsWith(prefix+"/")))
    return null;
  if(/^\/(?:viewer|courses|study)\//.test(route)){
    if(route.startsWith("/viewer/"))route="/courses/viewer";
    else if(/^\/(?:courses|study)\/\d+\/[^/]+$/.test(route))route="/courses/course";
    else route="/courses/semester";
  }else if(/^\/engineering\//.test(route)){
    const mode=route.split("/")[2];
    route=["model","hydro","structure","resistance","propulsion","cad","kisssoft"].includes(mode)?
      "/engineering/"+mode:"/engineering";
  }else if(/^\/tools\//.test(route)){
    route="/tools/"+(["python","fluid","model-inspector","coolprop","chemistry-editor",
      "crystal","periodic"].includes(route.split("/")[2])?route.split("/")[2]:"other");
  }else if(/^\/diverse\//.test(route)){
    route="/diverse/"+(["laos","andrekok","matpris","sandalen"].includes(route.split("/")[2])?
      route.split("/")[2]:"other");
  }else if(/^\/settings\//.test(route)){
    route="/settings/"+(["appearance","engineering","courses","privacy","advanced"].includes(
      route.split("/")[2])?route.split("/")[2]:"other");
  }else if(/^\/projects\//.test(route))route="/projects/detail";
  else if(!LABELS[route])return null;
  const section=route.split("/")[1]||"home";
  return {route,section,
    title:"FolkNettside V2 · "+(LABELS[route]||
      route.replace(/^\//,"").split("/").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" · "))};
}
export function analyticsStatus(){
  return {configured:analyticsConfigured(),choice:analyticsConsentChoice(),
    loaded,active:loaded&&analyticsConsent()};
}
export function trackPage(){
  if(!loaded||!analyticsConsent())return false;
  const page=safeAnalyticsPage(globalThis.location?.href);
  // A private or unknown route breaks the last-public-page sequence; when
  // visitors return to the same public page, count a new visit to that page.
  if(!page){lastRawRoute="";return false;}
  const rawRoute=String(globalThis.location?.hash||"");
  if(lastRawRoute===rawRoute)return false;
  lastRawRoute=rawRoute;
  const id=analyticsMeasurementId();
  if(!id||typeof globalThis.gtag!=="function")return false;
  // Do not expose the original hash/path/query/search/file names to Google.
  const base=globalThis.location.origin+globalThis.location.pathname;
  globalThis.gtag("event","page_view",{
    send_to:id,page_location:base+"#"+page.route,
    page_path:globalThis.location.pathname+"#"+page.route,
    page_title:page.title,page_referrer:"",
    site_version:"v2",site_area:page.section
  });
  return true;
}
/** Preload the Google tag with analytics_storage denied, without measuring visits. */
export function loadAnalytics(){
  const id=analyticsMeasurementId();
  if(!id||typeof document==="undefined")return false;
  if(loaded)return true;
  loaded=true;
  globalThis.dataLayer=globalThis.dataLayer||[];
  globalThis.gtag=globalThis.gtag||function(){globalThis.dataLayer.push(arguments)};
  // Set Consent Mode before the tag is loaded. Ads stay denied permanently.
  globalThis.gtag("consent","default",{
    analytics_storage:"denied",ad_storage:"denied",
    ad_user_data:"denied",ad_personalization:"denied"
  });
  globalThis.gtag("js",new Date());
  // Delay GA4 *configuration* as well as page views until opt-in. Loading
  // third-party JS itself still makes a Google network request.
  const script=document.createElement("script");
  script.async=true;
  script.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);
  script.referrerPolicy="strict-origin-when-cross-origin";
  script.dataset.folkAnalytics="v2";
  document.head.append(script);
  return true;
}
export function enableAnalytics(){
  if(!analyticsConsent()||!loadAnalytics())return false;
  const id=analyticsMeasurementId();
  globalThis.gtag("consent","update",{analytics_storage:"granted"});
  if(!configured){
    configured=true;
    globalThis.gtag("config",id,{
      send_page_view:false,anonymize_ip:true,allow_google_signals:false,
      allow_ad_personalization_signals:false,
      page_location:globalThis.location.origin+globalThis.location.pathname+"#/",
      page_referrer:""
    });
  }
  trackPage();
  return true;
}
export function setAnalyticsConsent(value,storage){
  const choice=value?"granted":"denied";
  sessionChoice=choice;
  try{(storage===undefined?globalThis.localStorage:storage)?.setItem(CONSENT_KEY,choice)}catch{}
  if(!value){
    lastRawRoute="";
    if(loaded)globalThis.gtag?.("consent","update",{analytics_storage:"denied"});
  }else enableAnalytics();
  if(typeof window!=="undefined"&&typeof CustomEvent!=="undefined")
    window.dispatchEvent(new CustomEvent("folk:analytics-consent",{detail:choice}));
  return choice;
}
if(typeof window!=="undefined"){
  window.addEventListener("hashchange",trackPage);
  queueMicrotask(()=>{loadAnalytics();enableAnalytics()});
}
