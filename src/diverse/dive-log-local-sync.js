/** Best-effort reconciliation for independently mounted local dive-log tabs.
 * This is not an atomic cross-tab or cross-device transaction: authoritative
 * concurrency requires transactional server-side compare-and-swap.
 */
import {mergeDiveLogs,newDiveLog,validateDiveLog} from "./dive-log-model.js?v=31699fd9504dcf90e03825d504eed380d00e1645";

export function reconcileDiveLogLocalWrite(incoming,currentRaw,{previouslySeenRaw=null}={}){
 validateDiveLog(incoming);
 if(currentRaw===null&&previouslySeenRaw!==null)
   throw Error("The local dive-log profile was removed in another tab. Reload before saving.");
 let current;
 try{
   current=currentRaw===null?newDiveLog():validateDiveLog(JSON.parse(currentRaw));
 }catch{
   throw Error("The existing local dive-log history cannot be read. Saving is blocked.");
 }
 // Immutable record IDs and timestamps preserve independent additions and
 // deletion tombstones, even when an older tab attempts to write later.
 return mergeDiveLogs(current,incoming);
}
