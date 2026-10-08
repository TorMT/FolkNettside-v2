# Future Gunnerus engineering demo

Gunnerus is planned as the final public example vessel for the Engineering landing/workspace once the v2 system is mature.

The sourced engineering baseline now lives in `data/engineering/gunnerus-sources.json`. Current principal dimensions follow NTNUs 2023 specification after the 2019 prolongation (Loa 36.25 m); older pre-prolongation 31.25 m data must not silently override the current vessel geometry.

## Goal

Use one sourced vessel model through the complete engineering workflow:

1. Model / assembly tree
2. Hydrostatics
3. Resistance
4. Propulsion
5. Future structure/FEM and CFD demonstrations where the source geometry is suitable

The example is especially useful because the vessel configuration can demonstrate multiple propulsion components, including two azimuth units and a tunnel thruster, rather than the current one-thruster fixture.

## Source requirements

The public demo must not claim to represent Gunnerus until the model and principal data are backed by documented sources.

The final model metadata should include at minimum:

- vessel name
- source URL/document/reference
- source organisation/author where applicable
- source revision/date
- geometry provenance
- unit system
- any transformations or simplifications performed
- which values are measured/sourced versus assumed
- licensing/permission information for geometry, imagery and data

## Analysis provenance

Results should distinguish:

- **Sourced vessel data**
- **Derived values calculated by v2**
- **Assumptions / simplified fixture values**

If a subsystem uses a simplified value for demonstration (for example thrust or propeller diameter), it must be labeled as an assumption rather than silently presented as Gunnerus data.

## Component model target

The semantic assembly should support at least:

```
Gunnerus
├ Hull
├ Azimuth PS
├ Azimuth SB
├ Tunnel Thruster
├ Superstructure
└ Other sourced components
```

Each propulsion component should retain a stable component ID and its own transform, axis and propulsion metadata.

Known sourced propulsion baseline:
- two 500 kW stern azimuth units;
- one 200 kW Brunvoll bow tunnel thruster;
- Kongsberg identifies Gunnerus as the first rim-drive azimuth installation in 2015;
- the 2025 NTNU service procurement identifies the two installed azimuth units as RDAZ1900.

Exact thruster positions/transforms, loading-condition CG and displacement remain intentionally unset until sourced geometry/drawings or measured data provide them. They must not be inferred from a sketch solely to make the demo run.

The existing generic `assembly-demo.3mf` remains the regression fixture until the sourced Gunnerus model is ready.


## Hull validation gate (before enabling hydro)

The pinned GLB is a **visualisation model**, not an approved hydrostatic input. Do not mark `part00` as hydro-enabled merely because it renders or a mesh library reports a nonzero volume.

A candidate hydro hull must pass **all** checks below, with evidence linked in the model's source/provenance metadata:

1. **Source and scope:** Record the hull geometry's original file, author/permission, source revision, vessel configuration (including the 2019 lengthening), and which appendages or deck structures have been intentionally excluded.
2. **Coordinates and units:** Confirm the import scale in metres, the mapping from source axes to engineering x/y/z axes, vertical datum/baseline, bow/stern direction, and sign convention for draft. Compare the geometric length, beam and depth against sourced principal dimensions; do not rescale silently to force a match.
3. **Surface isolation:** Extract only the *external underwater hull envelope*. Remove internal surfaces, duplicate/coincident faces, superstructure and decorative visual meshes. A combined hull-and-structure node such as `part00` is not by itself acceptable.
4. **Topology:** Verify a closed, orientable, two-manifold triangular boundary, with zero boundary edges, zero non-manifold edges, no self-intersections and no degenerate/zero-area triangles. Check consistently outward-facing normals and positive oriented enclosed volume.
5. **Hydro sanity:** At multiple declared drafts, verify finite positive immersed volume, physically sensible monotonic displacement, centroids within the hull bounds, positive waterplane area, and agreement of numerically integrated displacement with an independently checked reference or appropriately stated tolerance. Record the density used.
6. **Stability/loading:** For GM, GZ or equilibrium claims, use a separately sourced (or clearly labelled illustrative) loading condition with displacement, KG, LCG and TCG. Keep unsourced operational values unset rather than presenting fixture assumptions as actual Gunnerus data.
7. **Regression and review:** Add a small deterministic test case with geometry revision, transforms, expected hydro outputs, tolerance and failure cases. Obtain explicit review of the evidence before changing `analysisCapabilities.hydro.enabled`, `hydro.enabled` or any component-level `hydro` flag.

**Current decision:** Gunnerus hydro remains disabled. Work on extracting or obtaining a suitable external hull independently of the working visualisation model. Do not replace the existing proven hydro fixtures while collecting this evidence.

### Validation record template

| Field | Evidence / value |
|---|---|
| Hull source, revision, license | Pending |
| 2019 vessel geometry configuration verified | Pending |
| Source-to-engineering axis transform and unit scale | Pending |
| External hull extraction method and exclusions | Pending |
| Boundary / non-manifold / self-intersection checks | Pending |
| Normals, oriented volume, bounds | Pending |
| Draft-volume-waterplane reference comparisons | Pending |
| Loading condition and CG provenance (stability only) | Pending |
| Regression fixture, tolerance and reviewer | Pending |

