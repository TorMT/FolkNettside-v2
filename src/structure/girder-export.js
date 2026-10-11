/**
 * Numeric, locale-independent CSV for independent verification of global
 * beam results. X stations are element-side samples (duplicates on purpose):
 * they preserve shear jumps and concentrated bending-couple jumps.
 *
 * SI units in every header, no locale-specific decimal commas.
 */
const fmt=value=>{
  if(typeof value!=="number"||!Number.isFinite(value))
    throw Error("Structural CSV cannot export non-finite results");
  return Number(value.toPrecision(13)).toString();
};
const table=(head,rows)=>[head.join(","),...rows.map(row=>row.map(fmt).join(","))].join("\n")+"\n";
export function girderResponseCSV(girder){
  if(!Array.isArray(girder?.field)||!girder.field.length)
    throw Error("Calculate a structural beam response before export");
  return table(["x_m","deflection_m","shear_N","bending_moment_Nm",
    "longitudinal_extreme_fibre_stress_Pa"],girder.field.map(p=>[
    p.x,p.deflectionM,p.shearN,p.momentNm,p.stressPa
  ]));
}
export function girderLoadsCSV(girder){
  if(!Array.isArray(girder?.lineLoads)||!girder.lineLoads.length)
    throw Error("Calculate structural line loading before export");
  return table(["x_from_m","x_to_m","gravity_N_per_m","buoyancy_N_per_m",
    "net_vertical_load_N_per_m"],girder.lineLoads.map(l=>[
    l.from,l.to,l.gravityQ,l.buoyancyQ,l.qy
  ]));
}
export function girderReactionsCSV(girder){
  if(!girder?.equilibriumAudit?.passed||!Array.isArray(girder.reactions))
    throw Error("Validated beam reaction audit required for export");
  return table(["x_m","vertical_support_reaction_N"],
    girder.reactions.map(r=>[r.x,r.verticalN]));
}
