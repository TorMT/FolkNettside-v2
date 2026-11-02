# Preliminary roll-period estimate from actual Hydro loading

FolkNet V2 Engineering → Hydro now offers an **optional** baseline hull radius of gyration about longitudinal X, `kₓ` (metres). Leaving it blank performs no period calculation. There is no automatic guess from mesh dimensions, plastic infill or waterplane geometry.

When entered, the Hydro panel uses:
- the hull's explicit baseline mass/CG, or (without applied loads) the reference-draft displaced mass as a *declared mass assumption*;
- the existing point/area mass editor and its combined CG;
- the **loaded** transverse GM at the **re-solved displacement** after applying loads (or reference GM for the unloaded case);
- the parallel-axis theorem for point masses, and the exact transverse width²/12 term for rectangular uniform area masses.

```text
Ixx,total = m_hull * [k_hull² + (y_hull - y_G)² + (z_hull - z_G)²]
          + Σ m_point * [(y - y_G)² + (z - z_G)²]
          + Σ m_area * [(y - y_G)² + (z - z_G)² + (y1 - y0)²/12]

k_eff² = Ixx,total / m_total
T_roll = 2π * sqrt(Ixx,total / (m_total * g * GM_T))     (GM_T > 0)
```

Masses may be tonnes, because the mass unit cancels in the period quotient. X coordinate affects LCG/trim but not inertia about the longitudinal X roll axis. Negative point masses explicitly remove assumed inertia and can cause a rejected result if mass bookkeeping is physically inconsistent.

**Interpretation:** This is an **undamped dry rigid-body linear small-angle estimate**, not a predicted measured roll period. It excludes fluid added roll inertia, roll damping, large-angle GZ, free-surface/sloshing and other dynamic effects. Hydrostatic mesh validation establishes geometry preflight, not a certified vessel model. If GM_T ≤ 0, there is no real stable small-angle natural roll period. Loaded results are blocked while loaded draft/GM is unsolved.

`tests/hydro-roll-period.test.mjs` covers baseline, moved mass, area-inertia spread, negative GM, rejected invalid entries and removal.
