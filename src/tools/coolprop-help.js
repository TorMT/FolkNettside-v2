export const COOLPROP_HELP=[
  {
    id:"overview",
    title:"Overview",
    description:"What the CoolProp tool does",
    body:"Single calculates one thermodynamic state. Batch calculates many input rows. Process links state points through constant-property process steps. All data exposes the standard property set. Inputs are converted to SI before PropsSI and PhaseSI calls.",
    extra:"For textbook tasks using bar and °C, select those display units; the engine still receives SI internally."
  },
  {
    id:"diagram",
    title:"Engineering diagrams",
    description:"Saturation dome and auxiliary curves",
    body:"The diagram can show saturated-liquid and saturated-vapour curves, isotherms, isobars, quality lines and calculated state points. Available coordinates are log P-h, linear P-h, T-s and P-v.",
    extra:"Use wheel/trackpad scrolling to zoom, drag to pan, Reset to restore the calculated bounds, and PNG to export the current view."
  },
  {
    id:"phase",
    title:"Phase identification",
    description:"How the thermodynamic state is classified",
    body:"PhaseSI is used to identify two-phase, supercritical, gas/superheated-vapour and liquid/subcooled states. Near saturation, P and T alone can be insufficient to identify quality.",
    extra:"In the two-phase region use quality Q or another independent property such as H, S or D."
  },
  {
    id:"units",
    title:"Units",
    description:"Display units versus CoolProp SI",
    body:"CoolProp PropsSI expects pressure in Pa, temperature in K, H/U in J/kg and S/Cp/Cv in J/(kg·K). The v2 UI converts selected engineering units before and after the engine call.",
    extra:"Changing display units does not change the physical state sent to CoolProp."
  },
  {
    id:"basis",
    title:"Air book basis",
    description:"Textbook-relative H and U",
    body:"CoolProp uses its own absolute reference state. The legacy Book Basis option shifts Air enthalpy and internal energy by constant offsets calibrated at 1000 K and 1 bar to the legacy Table A-22 reference.",
    extra:"Only the absolute H/U level changes; differences ΔH and ΔU remain unchanged."
  },
  {
    id:"errors",
    title:"Common errors",
    description:"Why calculations can return N/A or fail",
    body:"Typical causes are incorrect selected units, states outside the supported fluid region, temperatures below the triple point, unsupported output properties for a state, or an underdetermined P-T point at saturation.",
    extra:"Check units first, then use a physically valid pair of independent properties."
  }
];

export function searchCoolPropHelp(query=""){
  const q=String(query).trim().toLocaleLowerCase();
  if(!q)return [...COOLPROP_HELP];
  return COOLPROP_HELP.filter(topic=>
    [topic.title,topic.description,topic.body,topic.extra]
      .join(" ")
      .toLocaleLowerCase()
      .includes(q)
  );
}
