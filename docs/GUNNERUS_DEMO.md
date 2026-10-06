# Future Gunnerus engineering demo

Gunnerus is planned as the final public example vessel for the Engineering landing/workspace once the v2 system is mature.

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

The existing generic `assembly-demo.3mf` remains the regression fixture until the sourced Gunnerus model is ready.
