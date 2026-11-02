/** Source-informed but simplified OBJ in GitHub; not the uploaded original 3MF or STEP. */
export const ASV_MODEL={
  id:"asv-tollak",label:"ASV Tollak · forenklet 3D",name:"ASV Tollak · visualisering",
  format:"OBJ",sourcePath:"./examples/models/asv-tollak-visual-preview.obj",
  defaultHydro:false,
  source:{purpose:"Simplified source-informed visual model; not original CAD or hydrostatic mesh",
    notes:"Original Fusion STEP and hull 3MF are not published in the GitHub repository."},
  componentRules:[
    {match:"^ASV_Simplified_Outer_And_Inner_Hull$",
      semantic:{role:"hull",subtype:"visual-only",tags:["approximate","not-hydro-valid"]},
      viewerGroup:"Skrog (forenklet)",hydro:false},
    {match:"[Tt]hruster|[Pp]ropulsion",
      semantic:{role:"thruster",tags:["approximate","not-hydro-valid"]},
      viewerGroup:"Propulsjon (forenklet)",hydro:false}
  ],
  analysisCapabilities:{
    model:{enabled:true,status:"forenklet visning",reason:"Same-origin simplified source-informed OBJ, no original CAD."},
    hydro:{enabled:false,status:"originalfil mangler",
      reason:"OBJ was sketched for visual display and is not a closed, validated source hull. For exploratory GM/GZ/SAC with assumptions open the separate ASV hydro report; for the actual 3MF use local import."},
    structure:{enabled:false,status:"ikke validert"},
    resistance:{enabled:false,status:"ikke validert"},
    propulsion:{enabled:false,status:"kun visning"}
  },
  hydro:{enabled:false,reason:"Simplified OBJ cannot support physical hydrostatic analysis.",
    note:"Preliminary separately calculated PETG assumptions and GZ/SAC plots: examples/engineering/asv-hydro.html"}
};
