# B13 — CoolProp physical-reference comparison (2026-10-25)

## Purpose and provenance

The B13 calculation tool is validated against **independent published engineering data**, not merely CoolProp self-consistency. The new source is the International Association for the Properties of Water and Steam (IAPWS), *Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam*, R7-97(2012), specifically its **computer-program verification Tables 5, 15 and 35**.

- Official release landing page: https://iapws.org/technical-guidance/release/IF97-Rev
- Official numerical release PDF: https://iapws.org/technical-guidance/release/IF97-Rev.download
- Machine-readable selected references: `tests/fixtures/coolprop-iapws-if97-reference.mjs` (SI unit normalization and explicit per-property tolerance)
- Runner: `node scripts/verify_coolprop_reference.mjs`, used in both `pr-checks.yml` and `pages.yml`.
- Unit tests: `tests/coolprop-iapws-matrix.test.mjs`.

**Important distinction:** CoolProp's HEOS implementation of ordinary water is based on the scientific IAPWS-95 formulation. IAPWS-IF97 is a *different, approximate industrial* formulation. They are supposed to agree within engineering tolerances, not match the last digit. Do not present the cross-check as official certification or as an independent verification of the Ammonia/Air textbook tables.

## Cross-check matrix

| Independent IAPWS table | States checked in native CoolProp WASM | Properties compared against published values | V2 worksheet route |
| --- | --- | --- | --- |
| IF97 Table 5, Region 1 (compressed water) | 300 K / 3 MPa; 300 K / 80 MPa; 500 K / 3 MPa | v, h, u, s, cp, speed of sound | Water A-5, entries (°C,bar) |
| IF97 Table 15, Region 2 (steam) | 300 K / 0.0035 MPa; 700 K / 0.0035 MPa; 700 K / 30 MPa | v, h, u, s, sound (cp at 700 K / 0.0035 MPa only) | Water A-4, entries (°C,bar) |
| IF97 Table 35, saturation-pressure equation | 300 K; 500 K; 600 K | P_sat(T) and A-2's generated saturation pressure | Water A-2 |
| Existing teaching A-22 | Air 300 / 400 / 1000 / 1200 K at 1 bar | Independent-entered table h/u/s checkpoints and inverse P-h | Air A-22 |
| Existing teaching Ammonia A-13–A-15 | Four pressure/temperature and saturation checkpoint states | H/U/S offsets from separately entered course reference numbers | Ammonia A-13, A-14, A-15 |

**Independent source values** were transcribed only from the release's numeric verification tables, which are distinct from the bundled CoolProp binary. Region 1/2 comparison allows ≤1.5–5% relative (property-specific), with modest absolute floors for small magnitudes; saturation pressure is checked within 1%. Actual discrepancies are printed by CI. These are **regression detection bounds** (e.g., pressure unit confusion, wrong phase), not validation of scientific uncertainty.

The table UI comparison also checks that entries and outputs use the right dimensions: pressure **bar** in the default worksheet, water enthalpy/internal energy **kJ/kg**, entropy **kJ/(kg·K)** and specific volume **m³/kg**. Table A-22 uniquely takes Kelvin values as published; do not convert those values from °C.

## Further teaching checks (model-internal identities)

Unlike the IAPWS fixtures, these are *not independent external numerical references*:

- For water at 1, 5 and 10 bar with vapor quality `x = 0.35`, test the saturated-mixture identities `h = h_f + x(h_g-h_f)`, and the corresponding `u`, `s`, `v`, plus `h = u + pv`.
- Check near-constant specific enthalpy for P-h throttling inversions in water, ammonia and R134a.
- Retain separate real-WASM tests for unit conversion, Air A-22 and Ammonia reference calibration, supported table presets, saturation curves and the phase diagrams.

## Current limits and next acceptance gate

This is a **broad automated reference check**, not exhaustive side-by-side validation of NTNU's actual textbook, prior V1 interface, user-specific course exercises, all mixtures or very-near-critical behavior. Native tables for Water/R134a remain on the CoolProp basis when no independently documented textbook H/U/S zero shift exists. Do not silently label them calibrated A-tables.

To finish full textbook/legacy parity, the owner must provide *approved*, independently sourced thermodynamics task/reference sheets and manually inspect representative V1/V2 output side by side. This check does **not** require uploading or publishing private NTNU files; only vetted scalar checkpoints should be committed.
