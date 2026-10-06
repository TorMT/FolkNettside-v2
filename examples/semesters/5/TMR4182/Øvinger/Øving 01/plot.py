"""Exercise fixture: waterplane inertia plot data."""
import math

L=10.0
for B in (2.0,2.5,3.0,3.5):
    i_transverse=L*B**3/12
    print(B, i_transverse)
