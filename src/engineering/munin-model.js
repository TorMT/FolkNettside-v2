import {MUNIN_PARTS} from "./munin-parts.js";

const hydroReason="Munin is available for visual inspection. Each of the two source hull meshes contains a degenerate triangle and currently fails geometry preflight. Hydrostatic calculations remain disabled until the external hull surfaces are repaired and independently checked.";

/** Shared engineering selector entry; reuses the approved CAD preview bytes. */
export const MUNIN_MODEL={
  id:"munin",label:"Munin · Njord",name:"Munin · Njord",
  format:"GLB",sourcePath:"./assets/models/munin-mobile-preview.glb",
  coordinateSystem:"z-up",partMetadata:MUNIN_PARTS,defaultHydro:false,
  source:{purpose:"Source-derived visual assembly; hydro surface validation pending"},
  componentRules:MUNIN_PARTS.map(part=>({
    match:`^${part.node}$`,semantic:part.semantic,viewerGroup:part.viewerGroup,
    hydro:part.semantic.role==="hull"
  })),
  analysisCapabilities:{
    model:{enabled:true,status:"sourced",reason:"Approved Munin STEP-derived preview with 130 source-grouped components."},
    hydro:{enabled:false,status:"awaiting hull validation",reason:hydroReason,
      requirements:["Repair and validate both external hull meshes", "Confirm vessel baseline and loading condition", "Supply KG/LCG/TCG before stability calculations"]},
    structure:{enabled:false,status:"visual only",reason:"No structural idealisation or material properties configured."},
    resistance:{enabled:false,status:"not configured",reason:"Requires validated wetted surfaces and a declared resistance method."},
    propulsion:{enabled:false,status:"identity only",reason:"T200 components are grouped; thrust maps and local thrust axes are not configured."}
  },
  // These are preview-coordinate waterline limits, not a vessel draft datum.
  hydro:{enabled:false,reason:hydroReason,density:1025,defaultDraft:-.22,minDraft:-.4032562,maxDraft:-.0272562}
};
