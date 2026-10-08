# Hydro waterplane contours and flooded openings

## Numerical defect addressed

The earlier Hydro waterplane integration stitched triangle/plane segments into polygon loops, then **summed the absolute area and inertia of every loop**. For a watertight hull with a full-depth opening (moonpool, flooded well), the *inner* waterline contour is a negative contribution. Treating it as a positive area overestimates waterplane area, TPC and BM/KM/GM; the geometric volume integration can still appear plausible, masking the defect.

## Current method

- Compute the intersection segments between selected hull triangles and each requested horizontal waterplane.
- Build a quantised planar edge graph (1e-7 m default) and **require closed degree-two loops**. Duplicate segments, open endpoints and branched junctions cause an explicit analysis error rather than a misleading number.
- Reject crossing or self-crossing contour segments before classifying loops. The conservative comparison budget also rejects geometrically complex unresolved cases.
- Determine even-odd nesting depth per loop; outer contours and enclosed islands contribute positively, while flooded inner holes contribute negatively.
- Integrate net area, LCF centroid and moments `Ixx`, `Iyy`, `Ixy` with translated local coordinates to avoid loss of precision for remote/large CAD coordinate origins.
- Propagate outer/hole counts through multi-component Hydro results. This improves waterplane properties used downstream by the draft solver and stability calculations without making any particular vessel "approved".

## Independent analytic checks

- Simple rectangle and two separate islands.
- Outer rectangle 10 m × 6 m with a through-well 2 m × 2 m: `A=56 m²`, `Ixx=178.6666667 m⁴`, `Iyy=498.6666667 m⁴`, symmetric centroid at (0,0).
- Fully triangulated, watertight 10 × 6 × 2 m shell with the central well: at `z=1 m`, `V=56 m³` and `KB=0.5 m`.
- Nested island in a flooded hole, mixed contour windings, open chains, duplicate segments, crossing loops, bow-tie loops and coordinate offsets of 1e6 m.
- An actual Hydro Web Worker browser smoke repeats the ring hull numerical checks.

## Remaining qualifications

- Local imported shell separation and watertight topology checks are not a proof that the underlying vessel's wetted hull is correct. Global triangle self-intersection screening remains a separate geometry verification milestone.
- This method handles a waterline cross section formed by **nonintersecting simple closed contours**; tangential/coplanar waterline cuts can be geometrically ambiguous. In those cases prefer a small perturbation of the draft or remesh, and keep a fail-closed error rather than inventing waterplane moments.
- Closely spaced contours below tolerance and very complex intersection patterns can be rejected conservatively. This is safer than silently double-counting.
- A true moonpool through the shell differs from a capped tank or enclosed cavity: only surfaces genuinely open to the sea should be treated as flooded; the source geometry and loading state still require engineering review.
- Gunnerus remains capability-gated; this fix does not validate its real-vessel geometry.

See [HYDRO_COMPLETION.md](HYDRO_COMPLETION.md) and [GENERIC_HYDRO_IMPORT.md](GENERIC_HYDRO_IMPORT.md).
