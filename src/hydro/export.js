function finite(value,digits=8){
  const number=Number(value);
  return Number.isFinite(number)?Number(number.toFixed(digits)):"";
}

export function hydrostaticRowsCSV(rows=[]){
  const header=["draft_m","displacement_t","waterplane_area_m2","lcb_m","tcb_m","kb_m","lcf_m","tcf_m","tpc_t_per_cm","ixx_m4","iyy_m4","ixy_m4","principal_i_major_m4","principal_i_minor_m4","principal_axis_deg","principal_bm_major_m","principal_bm_minor_m","bm_transverse_m","bm_longitudinal_m","km_transverse_m","km_longitudinal_m","gm_transverse_m","gm_longitudinal_m"];
  const body=(rows||[]).map(row=>[
    row.draft,row.displacementTonnes,row.waterplaneArea,row.lcb,row.tcb,row.kb,row.lcf,row.tcf,row.tonnesPerCm,
    row.ixx,row.iyy,row.ixy,row.principalMomentMajor,row.principalMomentMinor,row.principalAxisDeg,row.principalBmMajor,row.principalBmMinor,
    row.bmTransverse,row.bmLongitudinal,row.kmTransverse,row.kmLongitudinal,row.gmTransverse,row.gmLongitudinal
  ].map(value=>finite(value)).join(","));
  return [header.join(","),...body].join("\n")+"\n";
}

export function gzCurveCSV(curve=[]){
  const header=["heel_deg","draft_m","gz_m","righting_moment_Nm","displacement_mass_kg"];
  const body=(curve||[]).map(row=>[
    row.heelDeg,row.waterline,row.gz,row.rightingMoment,row.displacementMass
  ].map(value=>finite(value)).join(","));
  return [header.join(","),...body].join("\n")+"\n";
}

export function downloadTextFile(text,filename,type="text/csv"){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
