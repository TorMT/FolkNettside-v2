/**
 * Independent published IAPWS-IF97 computer-program verification values.
 *
 * Source: IAPWS R7-97(2012), https://iapws.org/technical-guidance/release/IF97-Rev
 * Original release tables 5 (PDF p. 9), 15 (PDF p. 17), 35 (PDF p. 34).
 * Only selected numerical values are transcribed. Units converted to SI.
 *
 * Important: CoolProp HEOS uses IAPWS-95 for water, NOT the IF97 equation
 * implemented to generate these reference values. Tolerances deliberately
 * allow moderate EOS differences; do not present this as machine-precision
 * reproduction of IF97 or official NIST property-table certification.
 */
export const IAPWS_IF97_INDEPENDENT_CASES=[
  // IF97 Table 5: compressed/subcooled water; v m3/kg, h/u J/kg,
  // s/Cp J/(kg K), w m/s.
  {id:"R1-300K-3MPa",table:5,phase:"compressed-liquid",T:300,P:3e6,
    expected:{v:0.00100215168,H:115331.273,U:112324.818,
      S:392.294792,Cp:4173.01218,speed_sound:1507.73921}},
  {id:"R1-300K-80MPa",table:5,phase:"compressed-liquid",T:300,P:80e6,
    expected:{v:0.000971180894,H:184142.828,U:106448.356,
      S:368.563852,Cp:4010.08987,speed_sound:1634.69054}},
  {id:"R1-500K-3MPa",table:5,phase:"compressed-liquid",T:500,P:3e6,
    expected:{v:0.00120241800,H:975542.239,U:971934.985,
      S:2580.41912,Cp:4655.80682,speed_sound:1240.71337}},

  // IF97 Table 15: vapor states. The 30 MPa / 700 K case is near
  // the region-2/3 boundary, so heat capacity is deliberately excluded.
  {id:"R2-300K-3500Pa",table:15,phase:"vapor",T:300,P:3500,
    expected:{v:39.4913866,H:2549911.45,U:2411691.60,
      S:8522.38967,speed_sound:427.920172}},
  {id:"R2-700K-3500Pa",table:15,phase:"vapor",T:700,P:3500,
    expected:{v:92.3015898,H:3335683.75,U:3012628.19,
      S:10174.9996,Cp:2081.41274,speed_sound:644.289068}},
  {id:"R2-700K-30MPa",table:15,phase:"high-pressure-vapor",T:700,P:30e6,
    expected:{v:0.00542946619,H:2631494.74,U:2468610.76,
      S:5175.40298,speed_sound:480.386523}}
];

export const IAPWS_IF97_SATURATION_CASES=[
  {id:"R4-300K",table:35,T:300,expectedP:3536.58941},
  {id:"R4-500K",table:35,T:500,expectedP:2638897.76},
  {id:"R4-600K",table:35,T:600,expectedP:12344314.6}
];

// Comparison limits allow distinct industrial IF97 vs scientific IAPWS-95
// equations but still reject 1000x unit failures or wrong-phase output.
export const IAPWS_IF97_LIMITS={
  relative:{v:0.02,H:0.015,U:0.02,S:0.02,Cp:0.05,speed_sound:0.025},
  absolute:{v:0.000001,H:500,U:500,S:5,Cp:20,speed_sound:10},
  saturationRelative:0.01
};
