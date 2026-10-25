import {getFolkAccessToken,getFolkAccountSnapshot,validateFolkAuthConfig}
  from "./folkside-auth.js?v=89a7630076656c764fe964fbb16ec5499057a23c";

/**
 * Check a Supabase-authenticated account against our deployed folk-core
 * function. Never confuse a working Supabase Auth token with a Google token.
 * The response must identify EXACTLY the signed-in Supabase user.
 */
export async function probeFolkCoreBackend({
  configLoader=async()=>fetch("./data/folkside-auth.json",{cache:"no-store"}).then(r=>{
    if(!r.ok)throw Error("FolkNet configuration unavailable");
    return r.json();
  }),
  tokenProvider=getFolkAccessToken,
  snapshotProvider=getFolkAccountSnapshot,
  fetchImpl=fetch,signal
}={}){
 const config=validateFolkAuthConfig(await configLoader());
 if(!config)throw Error("Invalid private cloud configuration");
 const token=await tokenProvider();
 if(typeof token!=="string"||!token)throw Error("Sign in before checking the private backend");
 const expected=snapshotProvider().user?.id;
 if(!expected)throw Error("No verified FolkNet account identity");
 const response=await fetchImpl(config.url+"/functions/v1/folk-core/session",{
   method:"GET",
   cache:"no-store",
   mode:"cors",
   headers:{apikey:config.publishableKey,Authorization:"Bearer "+token,
     Accept:"application/json"},
   signal
 });
 if(response.status===401||response.status===403)
   throw Error("FolkNet backend rejected this session. Sign in again.");
 if(!response.ok)throw Error("FolkNet backend unavailable (HTTP "+response.status+").");
 const data=await response.json();
 if(data?.connected!==true||data.userId!==expected||
   data.storageBucket!=="folk-private")
   throw Error("FolkNet backend identity or private storage verification failed");
 return {ok:true,userId:expected,privateBucketConfigured:true,
   autodeskConnected:data.autodeskConnected===true};
}
