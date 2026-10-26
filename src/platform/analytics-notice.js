import {analyticsConfigured,analyticsConsentChoice,setAnalyticsConsent} from "./analytics.js?v=ae4843bfa5383ce457bee87b94d92b4b8c307281";

/**
 * Compact opt-in choice. No Google Analytics network request occurs before opt-in.
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
  message.textContent="Website statistics are optional. "+
    "Full analytics uses Google Analytics cookies. "+
    "Limited statistics sends Google cookie-free measurement signals (which may include network/device metadata), "+
    "even though analytics cookies remain denied. You can also refuse all statistics. "+
    "Nothing is sent to Google Analytics until you choose.";
  const actions=doc.createElement("div");
  actions.className="analytics-consent-actions";
  const limited=doc.createElement("button");
  limited.className="btn";limited.type="button";limited.textContent="Limited — no analytics cookies";
  const accept=doc.createElement("button");
  accept.className="btn primary";accept.type="button";accept.textContent="Full analytics";
  const reject=doc.createElement("button");
  reject.className="btn";reject.type="button";reject.textContent="No statistics";
  const preferences=doc.createElement("a");
  preferences.href="#/settings/privacy";
  preferences.textContent="Privacy settings";
  function choose(value){setAnalyticsConsent(value);notice.remove()}
  limited.addEventListener("click",()=>choose("limited"));
  accept.addEventListener("click",()=>choose("granted"));
  reject.addEventListener("click",()=>choose("denied"));
  actions.append(limited,accept,reject,preferences);
  notice.append(message,actions);
  doc.body.append(notice);
  const changed=()=>{if(analyticsConsentChoice()!=="unset")notice.remove()};
  globalThis.window?.addEventListener("folk:analytics-consent",changed);
  return ()=>{
    notice.remove();
    globalThis.window?.removeEventListener("folk:analytics-consent",changed);
  };
}
