import {analyticsConfigured,analyticsConsentChoice,setAnalyticsConsent} from "./analytics.js?v=93c51a9ec39df9dd75862e8e2072639ecdd7d0e5";

/**
 * Compact consent choice. Google tag may preload with analytics denied.
 * The site works normally if the visitor declines analytics.
 */
export function mountAnalyticsNotice(doc=globalThis.document){
  if(!doc||!analyticsConfigured()||analyticsConsentChoice()!=="unset")
    return ()=>{};
  const notice=doc.createElement("aside");
  notice.className="analytics-consent-notice";
  notice.setAttribute("aria-label","Optional website statistics");
  notice.setAttribute("role","region");
  const message=doc.createElement("p");
  message.textContent="May we measure visits using Google Analytics? "+
    "This is optional. Reports are private to the site owner; no public visitor statistics are shown.";
  const actions=doc.createElement("div");
  actions.className="analytics-consent-actions";
  const reject=doc.createElement("button");
  reject.className="btn";reject.type="button";reject.textContent="No thanks";
  const accept=doc.createElement("button");
  accept.className="btn primary";accept.type="button";accept.textContent="Allow analytics";
  const preferences=doc.createElement("a");
  preferences.href="#/settings/privacy";
  preferences.textContent="Privacy settings";
  function choose(value){setAnalyticsConsent(value);notice.remove()}
  reject.addEventListener("click",()=>choose(false));
  accept.addEventListener("click",()=>choose(true));
  actions.append(reject,accept,preferences);
  notice.append(message,actions);
  doc.body.append(notice);
  const changed=()=>{if(analyticsConsentChoice()!=="unset")notice.remove()};
  globalThis.window?.addEventListener("folk:analytics-consent",changed);
  return ()=>{
    notice.remove();
    globalThis.window?.removeEventListener("folk:analytics-consent",changed);
  };
}
