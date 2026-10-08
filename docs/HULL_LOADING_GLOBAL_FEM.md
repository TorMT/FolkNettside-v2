# Hull loading and global girder FEM – engineering scope

**This workflow is a preliminary engineering teaching/design tool, not a certified
vessel stability calculation or full 3D shell/solid FEM.** It reuses a checked
model's real-world geometry to choose the longitudinal extent and to display
an approximate global bending stress field, but does not infer structural
material properties or plate thickness from the STL skin.

## Hydro mass model

Enter actual hull mass (tonnes) and hull CG (LCG, TCG, KG in world metres).
Point mass rows contain `mass(t), x, y, z`. A uniform deck mass patch contains
`mass density (t/m²), x0, x1, y0, y1, z`. Positive point mass is additional
weight; negative represents removal. The patch's exact integrated mass is

```
A = (x1-x0)(y1-y0)
m_patch = rho_area A
r_patch = ((x0+x1)/2, (y0+y1)/2, z)
m_total = m_hull + sum(m_point) + sum(m_patch)
CG_total = [m_hull CG_hull + Σ(m_i r_i)] / m_total
```

The Hydro solver uses `V_target = m_total * 1000 / rho_water` and computes
the draft where displacement equals the mass. Transverse and longitudinal
metacentric heights are recalculated at that loaded draft from actual
waterplane second moments: `GM_T=KB+Ixx/V-KG_total`,
`GM_L=KB+Iyy/V-KG_total`. If the CG is off-centre, heel and trim
equilibrium must be solved separately. GM based only on an upright state is
not an equilibrium/large-angle stability assessment.

If hull mass is left blank, the reference-draft displacement may still be used
as a **declared baseline** for legacy point-mass calculations; that reference
mass is not a measurement of the actual hull's steel weight. Actual hull mass
must be entered for meaningful separate hull/deck accounting.

## Global structural beam model

Under Engineering → Structure, a separate **global girder** mode derives the
X extent from the imported ModelDocument, and requires user confirmation
that world X is longitudinal. User supplies Young's modulus E (GPa),
vertical-plane second moment I (m⁴), fibre distance c and reference
neutral-axis elevation zNA; the STL/3MF mesh does not determine these
structural properties. It reuses hull mass, point and area loads.

```
w_hull = -(m_hull * 1000 * g)/(xMax-xMin) [N/m]
w_patch(x) = -rho_area * widthY * 1000 * g [N/m]
P_i = -m_i * 1000 * g [N]
E I * v''''(x) = w(x) with simply supported ends
sigma_x(x,z) = M(x) * (z-zNA)/I
```

The solver assembles Euler–Bernoulli frame elements with analytically
integrated constant distributed-load vectors. It adds nodes at every point
weight and patch boundary, so concentrated load shear jumps and patch load
changes occur at exact positions. It extracts nodal reactions and beam
displacements, stress and bending/shear fields. Equilibrium is checked through
`ΣR_y + ΣF_y = 0`. The figure displays signed extreme-fibre beam stress and
deformation; the 3D view maps the signed **global beam stress** onto the
imported surface's real-world positions (x,z) using diverging blue/cyan/
neutral/orange/red colors. It is **not** a finite-element plate stress,
von Mises field, buckling check, or 3D displacement solution.

**The simply-supported two-end support condition models a laboratory beam,
not a free-floating ship.** For a floating hull, buoyancy must be applied as
the actual longitudinal hydrostatic pressure distribution, with self-
equilibrating gravity and buoyancy including trim, and without artificial
pinned/roller supports. That physics is not yet implemented. The diagram
must not be used to claim real-ship hull-girder stresses, damage margins,
panel stress, scantling adequacy or certification.

## Independent regression benchmarks

The continuous tests cover two different watertight box geometries
(10×4×3 and 12×6×4 m) with mass and area loads, independent analytical
rectangular-waterplane formulas for GM in both axes, and inverse draft.

For a pinned/roller 10 m reference beam with constant `E=210 GPa`,
`I=0.08 m⁴` and total UDL `q`:
```
R_left = R_right = q L/2
|M_max| = q L²/8
|v_max| = 5 q L⁴/(384 E I)
|sigma_max| = |M_max| c/I
```
For a central point load `P`, the incremental contributions are
`ΔM_max=P L/4` and `Δv_max=P L³/(48 E I)`.
Patch-boundary and point-node position logic are checked, with invalid data
rejected. The browser test mounts a real Three.js model, projects
the signed contour on its mesh vertices, checks the color scale and reset,
and verifies the stress/deflection diagrams render.

## Future work for actual shell/solid FEM

An actual vessel stress solver needs triangulated or quadrilateral **shell
elements**, thickness and material per plate, stiffeners and beams,
connectivity, suitable pressure/weight distributions, load cases, boundary
conditions, mesh-quality checks, stress recovery at integration points,
convergence and reference verification. This is a separate major development
stage and cannot be inferred reliably from an unstructured exterior STL
alone. The current module does not claim that this exists.
