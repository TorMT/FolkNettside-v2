const DEFAULT_SESSION={
  state:"guest",
  authenticated:false,
  provider:null,
  user:null
};

let session={...DEFAULT_SESSION};
const listeners=new Set();

function emit(){
  const snapshot=getSession();
  for(const listener of listeners)listener(snapshot);
  if(typeof window!=="undefined"){
    window.dispatchEvent(new CustomEvent("folk:session",{detail:snapshot}));
  }
}

export function getSession(){
  return {...session,user:session.user?{...session.user}:null};
}

export function setSession(next={}){
  session={
    ...DEFAULT_SESSION,
    ...next,
    authenticated:Boolean(next.authenticated),
    user:next.user?{...next.user}:null
  };
  emit();
  return getSession();
}

export function clearSession(){
  session={...DEFAULT_SESSION};
  emit();
}

export function subscribeSession(listener){
  if(typeof listener!=="function")return ()=>{};
  listeners.add(listener);
  return ()=>listeners.delete(listener);
}

export function accessState(policy="public",current=getSession()){
  if(policy==="public")return {allowed:true,label:"Public",reason:"No account required"};
  if(policy==="optional")return {
    allowed:true,
    label:current.authenticated?"Account connected":"Local / optional account",
    reason:current.authenticated?"Connected session available":"Works locally; account sync can be added centrally"
  };
  if(policy==="account-required"){
    return current.authenticated
      ?{allowed:true,label:"Signed in",reason:"Authenticated session available"}
      :{allowed:false,label:"Sign in required",reason:"This module requires the central FolkNettside account session"};
  }
  return {allowed:false,label:"Access policy error",reason:`Unknown access policy: ${policy}`};
}
