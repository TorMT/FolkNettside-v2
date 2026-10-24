# Real Munin conversion — 2026-10-24

Ran existing main `scripts/convert_munin_step.py` on the explicitly authorized Munin STEP with `--deflection-mm 60`, default 250,000 triangle and 15 MB limits. Process completed with exit 0.

- Source: 39,308,913 bytes.
- Source SHA-256: `93fd88d40842c2be0753bc426edb256f00490e75837203c83fa6b7e9121e70b2`.
- GLB: 3,130,088 bytes; 116,481 triangles; 130 components.
- Preview SHA-256: `98b2a648553b2688074530489c06bc52b6ce3832e49635a3cc4ef1e44fc9994c`.
- Computed XYZ extents in metres: 1.0241642892360687 × 0.8859673738479614 × 0.8065124005079269.

These dimensions are converter output, NOT verified physical vessel dimensions. Compare with original drawing/Fusion before accepting scale. At 60 mm the tolerance is large relative to these extents; inspect curved surfaces and propulsors and evaluate a finer tessellation before mobile publication.

Candidate exists only in local scratch `munin-work/candidate/`. No binary committed, viewer integration, mobile acceptance, merge or deployment performed. Reproduce using docs/MUNIN_MOBILE_PREVIEW.md. Next: validate scale and visual geometry, then test 320/390/768 viewport and record independent acceptance. Conversion alone does not complete B09.
