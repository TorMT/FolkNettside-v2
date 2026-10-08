# Hydro numerical qualification – reference tests and residuals

This phase adds numerical self-checks to the general STL/3MF Hydro calculation pipeline. It is not ship stability certification or an independent assessment of the source vessel.

## Displacement versus waterline: V(T)

For a watertight, correctly oriented outer displacement hull in the world-Z engineering frame, displaced volume V should be nondecreasing with draft T. Where the waterplane section varies smoothly:

```
dV/dT = A_wp(T)
```

`src/hydro/numerical-audit.js` checks numerical monotonicity, finite values and sampled finite differences against the mean waterplane area of adjacent hydrostatic-curve points.

The finite-difference comparison is approximate on coarse intervals and near chines, changing curvature or discontinuous derivatives; such departures are flagged **review**, not silently treated as proof of a bad vessel. Decreasing displacement beyond a mixed absolute/relative tolerance is **fail**.

Results, pass/review/fail classifications, interval diagnostics and maximum relative derivative deviation are included in the Engineering Hydro UI and engineering report. The check does not by itself lift the independent hull provenance/capability gates.

## Draft inverse solver

The draft solver still uses bracketed bisection with a guarded Newton step based on waterplane area. It now:
- requires finite, ordered bracket endpoints, a positive finite **volume** tolerance (m³), and an integer iteration limit;
- detects a decreasing endpoint volume bracket;
- returns `converged:true` and `volumeResidual` only after its calculated volume is within the specified **volume residual**, not merely because the draft interval narrowed;
- throws a structured `HYDRO_DRAFT_NOT_CONVERGED` error if the iteration budget is exhausted, rather than presenting a plausible but unverified draft.

This applies equally to the Hydro Worker and main-thread fallback because both use the same solver. Hydro reports record the residual when a target displacement is supplied.

## Analytical reference geometries

Rectangular box, length L, breadth B, draft T:

```
V = L B T
A_wp = L B
Ixx = L B³ / 12
Iyy = B L³ / 12
KB = T/2
BMt = Ixx / V
GMt = KB + BMt - KG
```

Sloped wedge with constant breadth B, length L and deck height linearly rising from H0 to H1:

```
if 0 < T <= H0: V = B L T, A_wp = B L
if H0 < T < H1:
    V = B L [ T - (T-H0)²/(2(H1-H0)) ]
    A_wp = B L [ 1 - (T-H0)/(H1-H0) ]
```

The test suite compares Hydro results to these **independently evaluated formulas** at several waterlines, including an exact wedge chine waterline.

When a defined upright KG and matching displacement are available, the UI also checks a positive small-angle sample from the GZ curve against `GMt = KB + Ixx/V - KG`. It does **not** extrapolate an initial GM from angles greater than 5° or compare a constant-volume GZ curve against a different upright displacement. Nonzero TCG also disables this comparison to avoid presenting a misleading upright cross-check. This is a consistency check, not a formal stability criterion.

## Scope still incomplete

- Geometry/provenance validation, baseline datum, vessel loading conditions, free-surface effect, downflooding and regulatory righting-arm criteria.
- Full precision/reference comparisons on independent real-vessel hydrostatic data and a verified Gunnerus external hull.
- Large-mesh performance and cancellation/stale Worker request behavior.
- If a source mesh intersects the waterline at an exact vertex or horizontal edge, Hydro uses a half-open submerged-edge convention to prevent duplicate contour edges. Complex tangential/coplanar intersections may still be rejected conservatively for review.

See [HYDRO_COMPLETION.md](HYDRO_COMPLETION.md) and [HYDRO_WATERPLANE_CONTOURS.md](HYDRO_WATERPLANE_CONTOURS.md).
