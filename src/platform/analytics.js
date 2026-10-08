/**
 * Optional GA4 page-view integration. Set window.__FOLK_ANALYTICS_ID__ to
 * the existing public G-XXXXXXXXXX measurement ID at deployment time.
 * Report/dashboard access always remains in the private Google account.
 * Tracking is disabled unless the visitor explicitly opts in.
 */
const CONSENT_KEY="folk.analytics.consent.v1";
const GA_ID=/^G-[A-Z0-9]+$/;
function measurementId(){
  const id=String(globalThis.__FOLK_ANALYTICS_ID__||"").trim();
  return GA_ID.test(id)?id:"";
}
export function analyticsConsent(){
  try{return localStorage.getItem(CONSENT_KEY)==="granted"}catch{return false}
}
export function setAnalyticsConsent(value){
  try{localStorage.setItem(CONSENT_KEY,value?"granted":"denied")}catch{}
  if(!value && typeof globalThis.gtag==="function")globalThis.gtag("consent","update",{analytics_storage:"denied"});
  if(value){
    if(enabled&&typeof globalThis.gtag==="function")globalThis.gtag("consent","update",{analytics_storage:"granted"});
    enableAnalytics();
  }
}
let enabled=false;
export function enableAnalytics(){
  const id=measurementId();
  if(!id||!analyticsConsent()||enabled)return false;
  enabled=true;
  globalThis.dataLayer=globalThis.dataLayer||[];
  globalThis.gtag=globalThis.gtag||function(){globalThis.dataLayer.push(arguments)};
  globalThis.gtag("js",new Date());
  globalThis.gtag("consent","default",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
  globalThis.gtag("config",id,{send_page_view:false,anonymize_ip:true});
  const script=document.createElement("script");
  script.async=true;
  script.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);
  document.head.append(script);
  trackPage();
  return true;
}
export function trackPage(){
  const id=measurementId();
  if(!id||!enabled||!analyticsConsent())return;
  globalThis.gtag("event","page_view",{page_title:document.title,page_location:location.href,page_path:location.pathname+location.hash,send_to:id});
}
if(typeof window!=="undefined"){
  window.addEventListener("hashchange",trackPage);
  queueMicrotask(enableAnalytics);
}
