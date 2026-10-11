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

/** Audit the actually assigned per-element stiffness and baseline mass law. */
export function girderSectionsCSV(girder){
  if(!girder?.frame?.elements?.length||!girder?.baselineAudit?.stations?.length)
    throw Error("Calculate a structural section and mass profile before export");
  const elements=girder.frame.elements,nodes=girder.frame.nodes,
    stations=girder.baselineAudit.stations;
  return table(["x_from_m","x_to_m","young_modulus_Pa",
    "section_inertia_m4","bending_rigidity_N_m2","baseline_mass_t_per_m"],
    elements.map((e,i)=>{
      const left=nodes[i].x,right=nodes[i+1].x,mid=(left+right)/2;
      const mass=stations.find(s=>mid>=s.x0&&mid<=s.x1);
      if(!mass)throw Error("Structural mass profile does not cover exported beam element");
      return [left,right,e.E,e.I,e.E*e.I,mass.tonnesPerM];
    }));
}
