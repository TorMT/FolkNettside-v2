import math
rho_sw, rho_fw = 1025.0, 1000.0
Do, Di = 0.110, 0.0968          # PVC-U 110x6.6 PN16 (Kramp DIN 8063)
A_o = math.pi/4*Do**2
A_wall = math.pi/4*(Do**2-Di**2)

# component: name, mass_lo, mass_hi, V_disp_lo [L], V_disp_hi [L], x [m from nose]
# pipe and hull handled separately; x for hull parts given relative
def parts(Lp):
    xs = 0.08            # pipe starts after nose cone (80 mm)
    xe = xs+Lp
    P = [
     # wet / outside parts: displacement = own material volume
     ("Nesekjegle PETG (fritt-flømmende)", 0.08,0.14, 0.08/1.27,0.14/1.27, 0.045),
     ("Frontlokk PVC limt (110 trykk-endekappe)",0.20,0.35, 0.20/1.40,0.35/1.40, xs+0.01),
     ("PVC-rør 110x6.6 (vegg)", A_wall*Lp*1360, A_wall*Lp*1450, 0,0, xs+Lp/2),
     ("Bakplugg POM (lommefrest)", 0.28,0.45, 0,0, xe-0.015),
     ("Batteri 6S2P P45B + BMS/holdere", 0.90,1.00, 0,0, xs+0.07),
     ("ESC + ESP32 + kabler + sikring", 0.30,0.40, 0,0, xe-0.08),
     ("Indre slede PETG", 0.08,0.15, 0,0, xs+Lp/2),
     ("Motor Flipsky 6374 (vaat)", 0.86,0.86, 0.86/8.5,0.86/5.5, xe+0.05),
     ("Motorfeste+dyse+stator PETG", 0.25,0.40, 0.25/1.27,0.40/1.27, xe+0.06),
     ("Propell PETG/nylon", 0.03,0.06, 0.03/1.27,0.06/1.15, xe+0.07),
     ("Haandtak/trigger PETG", 0.15,0.25, 0.15/1.27,0.25/1.27, xs+0.15),
     ("Slangeklemmer/bolter rustfritt", 0.08,0.15, 0.08/7.9,0.15/7.9, xs+Lp/2),
    ]
    return P, xs, xe

def evaluate(Lp, rho, case):
    P, xs, xe = parts(Lp)
    # hull displacement: pipe outer volume over Lp (+ cap/plug material outside already counted in pipe length) 
    Vhull = A_o*Lp
    m=0; V=Vhull; mx=0; Vx=Vhull*(xs+Lp/2)
    for n,ml,mh,vl,vh,x in P:
        mm = ml if case=='lett' else mh
        # heavy case: smaller displacement of wet parts (conservative) -> use matching density bound
        vv = (vh if case=='lett' else vl)/1000 if (vl or vh) else 0
        # for cap: material displaced already inside Lp? cap is outside pipe -> add its volume
        m+=mm; mx+=mm*x; V+=vv; Vx+=vv*x
    net = rho*V - m
    return m, V, net, mx/m, Vx/V

print("Lp[m]  case  rho   m[kg]  V[L]  netto[kg]  xCG  xCB")
for Lp in [0.30,0.35,0.40,0.45,0.50]:
    for case in ['lett','tung']:
        for rho,lab in [(rho_sw,'sjø'),(rho_fw,'fersk')]:
            m,V,net,xg,xb = evaluate(Lp,rho,case)
            print(f"{Lp:.2f} {case:4s} {lab:5s} {m:5.2f} {V*1000:5.2f} {net:+6.2f}  {xg:.3f} {xb:.3f}")
# neutral length
for case in ['lett','tung']:
    for rho,lab in [(rho_sw,'sjø'),(rho_fw,'fersk')]:
        lo,hi=0.1,1.0
        for _ in range(60):
            mid=(lo+hi)/2
            if evaluate(mid,rho,case)[2]>0: hi=mid
            else: lo=mid
        print("Nøytral Lp",case,lab,round(mid,3))
print("pipe kg/m", A_wall*1360, A_wall*1450, "disp L/m", A_o*1000)

print("\n--- Løs for rørlengde Lp og bly i nese (x=0.04 m, rho_bly=11.3) slik at netto=0 og xCG=xCB ---")
def eval_lead(Lp, mlead, rho, case):
    P, xs, xe = parts(Lp)
    V = A_o*Lp; Vx = V*(xs+Lp/2); m=0; mx=0
    for n,ml,mh,vl,vh,x in P:
        mm = ml if case=='lett' else mh
        vv = (vh if case=='lett' else vl)/1000 if (vl or vh) else 0
        m+=mm; mx+=mm*x; V+=vv; Vx+=vv*x
    vl = mlead/11300; m+=mlead; mx+=mlead*0.04; V+=vl; Vx+=vl*0.04
    return rho*V-m, mx/m - Vx/V
import itertools
for case in ['lett','tung']:
  for rho,lab in [(rho_sw,'sjø'),(rho_fw,'fersk')]:
    best=None
    for Lp in [x/1000 for x in range(250,900,2)]:
        for ml in [x/100 for x in range(0,300)]:
            net,dx = eval_lead(Lp,ml,rho,case)
            s=abs(net)+abs(dx)*20
            if best is None or s<best[0]: best=(s,Lp,ml,net,dx)
    print(case,lab,"Lp=%.3f m  bly=%.2f kg  netto=%+.3f  xCG-xCB=%+.4f"%best[1:])
