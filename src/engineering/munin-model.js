import {MUNIN_PARTS} from "./munin-parts.js?v=6ec3e4445933c12c117ae3d707ac899695076c42";

const hydroReason="Exploratory hydrostatics on two repaired, closed hull meshes. The 15 mm preview is approximate; vessel loading and stability are not certified.";

/** Shared engineering selector entry; reuses the approved CAD preview bytes. */
export const MUNIN_MODEL={
  id:"munin",label:"Munin · Njord",name:"Munin · Njord",
  format:"GLB",sourcePath:"./assets/models/munin-mobile-preview.glb",
  coordinateSystem:"z-up",partMetadata:MUNIN_PARTS,defaultHydro:false,
  source:{purpose:"Source-derived visual assembly; repaired closed hull meshes; exploratory hydrostatics"},
  componentRules:MUNIN_PARTS.map(part=>({
    match:`^${part.node}$`,semantic:part.semantic,viewerGroup:part.viewerGroup,
    hydro:part.semantic.role==="hull"
  })),
  analysisCapabilities:{
    model:{enabled:true,status:"sourced",reason:"Approved Munin STEP-derived preview with 130 source-grouped components."},
    hydro:{enabled:true,status:"exploratory · geometry checked",reason:hydroReason},
    structure:{enabled:false,status:"visual only",reason:"No structural idealisation or material properties configured."},
    resistance:{enabled:false,status:"not configured",reason:"Requires validated wetted surfaces and a declared resistance method."},
    propulsion:{enabled:false,status:"identity only",reason:"T200 components are grouped; thrust maps and local thrust axes are not configured."}
  },
  // These are preview-coordinate waterline limits, not a vessel draft datum.
  hydro:{enabled:true,reason:hydroReason,
    note:"Approximate 15 mm tessellation. Waterline and all CG coordinates use the centered GLB frame (hull bottom Z = −0.4032562 m), not a keel datum. Enter actual mass and CG for stability. Only the two hulls contribute to buoyancy.",density:1025,defaultDraft:-.22,minDraft:-.404,maxDraft:-.027}
};
