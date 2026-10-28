import {handlePublicCodeRequest} from "./core.js";

// Public GET for four reviewed, unauthenticated course assets. Platform JWT
// verification is off so browser preflights work. The strict path allowlist,
// fixed NTNU host, no-cookie fetch, origin gate and size cap apply to each GET.
Deno.serve((request:Request)=>handlePublicCodeRequest(request));
