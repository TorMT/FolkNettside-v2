"""Exercise fixture: hydrostatic displacement."""
L=10.0
B=3.0
T=1.2
rho=1025.0

volume=L*B*T
displacement=rho*volume
print(f"Volume: {volume:.1f} m^3")
print(f"Displacement: {displacement/1000:.2f} t")
