# DPV Rev A2 – første design: 3D-print, butikkdeler, nøytral oppdrift

*23.11.2026 · Bygger på Rev A1b ([[DPV-RevA1-budsjett]]): 6S2P Molicel P45B, båt-ESC 2–6S, Flipsky 6374 våt, ESP32 som gass/dødmann. Prototype – ikke sertifisert.*

**Designprinsipp:**
1. **Trykkbarrieren består bare av kjøpte eller maskinerte deler** (PVC-trykkrør, limt PVC-endekappe og en POM-plugg).
2. **Alt som er 3D-printet er vått** og utenfor trykkbarrieren: nese, håndtak, motorfeste, dyse/stator, propell og indre slede.
3. **Røret kappes til slutt**, etter at alle delene er veid. Rørlengden er «oppdriftsknappen».

---

## 0. Kritiske punkter i A2 (flagget først)

| # | Risiko | Designsvar |
|---|---|---|
| K1 | **Feil rør kjøpes.** Et grått avløpsrør 110×3,2 ser likt ut som et trykkrør | Knekketrykket for 110×3,2 er bare **1,4–1,7 bar ≈ 14–17 m** (kap. 2). **Bare PN16-trykkrør** (110×6,6 eller 110×8,2). Merk røret |
| K2 | **Luft fanget i printede deler** komprimeres med dybden → DPV-en blir tyngre jo dypere den går | Våte deler printes **100 % solid** eller med **åpne dreneringshull** inn i infill (kap. 4) |
| K3 | **Vannvandring langs kabelkordeller** gjennom gjennomføringen | Fasene føres gjennom **massive A4-bolter** i POM-pluggen, ikke som kabel (kap. 3.4) |
| K4 | Termisk løp / overtrykk i huset | BMS + hovedsikring rett ved cellene + NTC; **fjærbelastet avlastningsventil** i pluggen; pluggen holdes med 3 radielle skruer |
| K5 | Runaway | Hall-sensor bak rørveggen + magnet i trigger og håndleddssnor; ESP32 stopper PWM; ESC-en stopper ved signalbrudd |
| K6 | Feil trim → ukontrollert stigning/synking | Bly i avtakbare segmenter i nesa, kalibreres i basseng. Li-ion endrer ikke masse → trimmen er lik ved fullt og tomt batteri |

---

## 1. Oppbygging

Koordinat $x$ langs DPV-en, **positiv bakover fra nesetuppen** ($x = 0$).

```
 x=0      0,08                        0,08+Lp          +0,15
  |--nese--|======= PVC 110×6,6 trykkrør =======|--plugg--|motor+dyse+propell|
   PETG     frontkappe   batteri   slede    ESC/ESP32  POM     PETG-dyse Ø~0,20
   bly-     (limt)       6S2P      PETG              A4-gjennomf.  stator=vern
   lommer                                                     
            håndtak + trigger (PETG) klemt med 2 rustfrie slangeklemmer
```

| Del | Type | Materiale | Kilde |
|---|---|---|---|
| Trykkrør 110×6,6 PN16 (alt. 110×8,2) | Kjøpt | PVC-U | VVS-grossist (Ahlsell, Brødrene Dahl o.l.) – sjekk om de selger til privat |
| Endekappe 110 for liming + PVC-lim | Kjøpt | PVC-U | Samme |
| Bakplugg med 2 radielle O-ringer | Maskinert | POM | NTNU-verksted (restmateriale) |
| O-ringer NBR70 | Kjøpt | NBR | Ahlsell (enkeltstørrelser) / Biltema-sortiment – **dimensjon fra Parker-tabell** |
| Silikonfett | Kjøpt | – | Biltema/Clas Ohlson (antatt) |
| 3 × A4 M6 bolt + mutter + O-ring (fasegjennomføring) | Kjøpt | A4 | Biltema/Clas Ohlson (antatt) |
| 3 × A4 M5 skrue (pluggholder) | Kjøpt | A4 | Samme |
| Schrader-ventil (vakuumtest) | Kjøpt | – | Sykkelbutikk/Biltema (tubeless-ventil, antatt) |
| Rustfrie slangeklemmer Ø100–120 (2 stk) | Kjøpt | A4/A2 | Biltema (antatt) |
| Blylodd 25–50 g | Kjøpt | Bly | Fiskebutikk (antatt) |
| Neodymmagneter, hall-sensor | Kjøpt | – | Clas Ohlson / Kjell / Elfa (antatt) |
| Nese, håndtak, trigger, slede, motorfeste, dyse+stator, propell | **3D-print** | PETG | NTNU |

---

## 2. Trykkhus

**Trykk:** $p = \rho g h = 1025\cdot 9{,}81\cdot 40 = 4{,}02$ bar (overtrykk). Test: 6,0 bar.

**Knekking** (lang sylinder, konservativt):

$$
p_{cr} = \frac{2E}{1-\nu^2}\left(\frac{t}{D}\right)^{3}, \quad E = 2{,}5\text{–}3{,}0\ \text{GPa},\ \nu \approx 0{,}38\ \text{(antatt)}
$$

| Rør | $t/D$ | $p_{cr}$ | SF ved 4 bar |
|---|---|---|---|
| Avløp 110×3,2 (trykkløs) | 0,029 | 1,4–1,7 bar | **0,36–0,43 ❌** |
| **PN16 110×6,6** (ID 96,8) | 0,060 | 12,6–15,1 bar | **3,2–3,8 ✅** |
| PN16 110×8,2 | 0,075 | 24–29 bar | 6,1–7,3 ✅ (tyngre, mer ballast) |

Rørdata: 110×6,6 PN16 (DIN 8063, ID 96,8 mm) og 110×8,2 PN16 (SS 1776) er verifisert i leverandørkataloger. E-modul og flytegrense er materialverdier for PVC-U fra Röchling-datablad (2 500–3 000 MPa, 45–56 MPa). Rørprodusentens egne verdier må hentes.

**Flyt:** $\sigma_\theta = \dfrac{pD}{2t} = \dfrac{0{,}6\cdot 110}{2\cdot 6{,}6} = 5{,}0$ MPa ≪ 45 MPa ✅

**Volumendring ved 40 m** (påvirker oppdriften): $\varepsilon_\theta = \dfrac{pD}{2tE} \approx 1{,}1\text{–}1{,}3\cdot10^{-3}$ → $\Delta V \approx 2\varepsilon_\theta V \approx 11\text{–}13$ mL ved $V = 5$ L. **Neglisjerbart** (≈ 12 g).

### 2.1 Bakplugg (POM)
- Radiell **dobbel O-ring** mot rørets innervegg (ID 96,8). Sporet dimensjoneres etter **Parker O-Ring Handbook, tabell for statiske radiale tetninger**. Tverrsnitt 3,53 mm foreslås (**ikke verifisert – må hentes fra tabellen**, inkludert sporbredde, glanddybde og klaring)
- Rørets innervegg ved tetningssonen pusses (Ra-krav fra Parker-tabellen) og kontrolleres for riper
- **Holdes på plass med 3 radielle A4 M5-skruer** gjennom røret, utenfor O-ringsonen. Dette hindrer at pluggen blåses ut ved indre overtrykk
- I pluggen: 3 fasegjennomføringer, Schrader-ventil, avlastningsventil
- Platebelastning ved test: $F = p\,\tfrac{\pi}{4}D_i^2 = 0{,}6\cdot\tfrac{\pi}{4}\cdot 96{,}8^2 \approx 4{,}4$ kN → plugg-/platetykkelse dimensjoneres i neste revisjon (POM-datablad)

### 2.2 Frontkappe
Standard limt PVC-endekappe for trykkrør → ingen tetning å vedlikeholde i front. All tilgang skjer bakfra.

---

## 3. Elektrisk og gjennomføringer

### 3.1 Batteri 6S2P P45B
- 12 celler × 68 g (datablad) = 0,82 kg, blokk Ø87 × 71 mm, **plassert lengst fram** (trimmer mot nesetungt)
- BMS med cellespenning og NTC, hovedsikring på pakkens pluss

### 3.2 ESC og ESP32
- ESC (Turnigy Marine 120A, 155 g) monteres på en aluminiumsplate presset mot pluggen, slik at varmen ledes ut til vannet. Vannkjølingskanalen brukes ikke (lukket hus) → **temperaturen må logges i benktesten**
- ESP32 leser hall-sensoren og batterispenningen, og sender PWM til ESC-en

### 3.3 Trigger og dødmannsbryter – ingen gjennomføring
Hall-sensoren sitter på innsiden av rørveggen (6,6 mm PVC). Magneten sitter i den printede triggeren og i håndleddssnoren. Rekkevidden for magnet + avstand må testes (**antatt** ~10–15 mm).

### 3.4 Fasegjennomføring
**Kabel gjennom epoksy er dårlig**, fordi vann vandrer langs kordellene. Løsningen er heller:

- 3 × **A4 M6-bolt** gjennom pluggen, med O-ring under hodet og mutter + kabelsko på innsiden
- Motorens fasekabler kobles med kabelsko på utsiden, og koblingen støpes inn i epoksy/krympeplast mot korrosjon
- Motstand per bolt (rustfritt, $\rho_\text{el} \approx 7\cdot10^{-7}\ \Omega\text{m}$ antatt, 40 mm, M6 → $A \approx 2{,}0\cdot10^{-5}$ m²):

$$
R = \frac{\rho_\text{el} L}{A} \approx \frac{7\cdot10^{-7}\cdot 0{,}04}{2{,}0\cdot10^{-5}} = 1{,}4\ \text{m}\Omega \;\Rightarrow\; P = I^2 R = 25^2\cdot 0{,}0014 \approx 0{,}9\ \text{W}
$$

  OK ved 25 A fasestrøm.

---

## 4. 3D-print-regler

| Regel | Begrunnelse |
|---|---|
| **PETG** som standard (ASA for UV-utsatte deler). Ikke PLA | PETG har tetthet 1,27 g/cm³ og lavt vannopptak (0,13 %/24 h, Prusament) |
| **Ingen printet del i trykkbarrieren** i A2 | Lagdelte printede deler kan ha 16–19 % porøsitet (målt på printet PETG) → lekkasjebaner |
| **Våte deler: 100 % infill, eller åpen infill med dreneringshull** | Innestengt luft gir en oppdrift som endres med dybden (se under) |
| Maks delstørrelse < printerens byggevolum (antatt 220 × 220 mm) | Dyse-OD ≤ ~210 mm → propell Ø ≤ ~0,18 m |
| Dysa printes stående (ringer, ingen support). Propellen printes med navet vertikalt, eller med delte blader | Styrke langs lagene i hovedlastretningen |
| Ingen messing-innsatser i saltvann. Bruk **innfelte A4-mutre** | Galvanisk korrosjon (antatt) |
| Passninger: 0,2–0,3 mm klaring | Typisk FDM-toleranse (antatt) – testprint først |

**Hvorfor innestengt luft er farlig** (Boyles lov): $V_2 = V_1\,\dfrac{p_1}{p_2}$. Ved 40 m er $p_2 = 1 + 4{,}0 = 5{,}0$ bar absolutt, så $V_2 = V_1/5$. Har de printede delene 0,3–0,6 L innestengt luft, mister DPV-en $0{,}8\cdot(0{,}3\text{–}0{,}6) \approx$ **0,24–0,48 kg oppdrift** ned til 40 m. Det er like mye som hele trimmarginen vår.

---

## 5. Nøytral oppdrift og trim

**Betingelser:**

$$
\text{Oppdrift: } \rho_\text{vann}\sum V_i = \sum m_i, \qquad
\text{Trim: } x_G = \frac{\sum m_i x_i}{\sum m_i} = x_B = \frac{\sum V_i x_i}{\sum V_i}
$$

$V_i$ er fortrengt volum: for trykkhuset dets **ytre** volum ($\tfrac{\pi}{4}D_o^2 = 9{,}50$ L/m), for våte deler deres materialvolum. Komponenter inni huset gir masse, men ikke volum.

**Massebudsjett** (intervall; verifiserte verdier i fet):

| Del | Masse [kg] | Fortrengt [L] | $x$ [m] |
|---|---|---|---|
| Nesekjegle PETG | 0,08–0,14 | $m/1{,}27$ | 0,045 |
| Frontkappe PVC | 0,20–0,35 | $m/1{,}40$ | 0,09 |
| Rør 110×6,6 | **2,92–3,11 kg/m** × $L_p$ | 9,50 L/m × $L_p$ | midt |
| Bakplugg POM | 0,28–0,45 | (inne i $L_p$) | bak |
| Batteri + BMS + holdere | **0,82** + 0,08–0,18 | – | fram |
| ESC + ESP32 + kabler | **0,155** + 0,15–0,25 | – | bak |
| Indre slede PETG | 0,08–0,15 | – | midt |
| Motor Flipsky 6374 | **0,86** | 0,10–0,16 | bak + 0,05 |
| Motorfeste + dyse + stator | 0,25–0,40 | $m/1{,}27$ | bak + 0,06 |
| Propell | 0,03–0,06 | $m/1{,}2$ | bak + 0,07 |
| Håndtak/trigger | 0,15–0,25 | $m/1{,}27$ | 0,23 |
| Rustfrie klemmer/bolter | 0,08–0,15 | $m/7{,}9$ | midt |

**Resultat** (beregnet for «lett» og «tung» ende av intervallene):

| Tilfelle | Uten bly: netto ved $L_p = 0{,}40$ m | $x_G - x_B$ | **Nøytral + vannrett: $L_p$** | **Bly i nese** |
|---|---|---|---|---|
| Lett, sjøvann | +0,65 kg | +33 mm | **0,39 m** | **0,65 kg** |
| Lett, ferskvann | +0,52 kg | +33 mm | 0,41 m | 0,65 kg |
| Tung, sjøvann | −0,89 kg | +33 mm | **0,63 m** | **0,74 kg** |
| Tung, ferskvann | −1,00 kg | +33 mm | 0,66 m | 0,73 kg |

**Tolkning:**
- $x_G - x_B > 0$ betyr at tyngdepunktet ligger **bak** oppdriftssenteret → DPV-en vil heve nesa. Motoren bak er hovedårsaken
- Det trengs ~0,65–0,75 kg bly i nesa uansett. Dette er stabilt på tvers av usikkerheten
- **Rørlengden spenner fra 0,39 til 0,66 m** pga. usikre masser → kjøp ≥ 0,8 m rør, vei alle deler, og **kapp til slutt**
- **Sjø vs. fersk:** $\Delta m = (\rho_s - \rho_f)V \approx 25\cdot 0{,}005 \approx 0{,}12$ kg → ett avtakbart bly-segment på ~125 g fjernes i ferskvann
- **Fullt vs. tomt batteri:** Li-ion endrer ikke masse → ingen endring i oppdrift eller trim
- **Rullstabilitet:** batteriet legges lavt på sleden slik at $z_G$ havner under $z_B$ → selvrettende. Verifiseres i basseng

**Mål for designet:** +0,1 til +0,3 kg positiv i sjøvann **før** siste bly-segment, slik at vi alltid kan trimme ved å *legge til* vekt.

Beregningen ligger som et skript i prosjektmappen (kalk `buoy.py`). Det kjøres på nytt med veide masser.

---

## 6. Hva gjenstår / må testes før neste steg

**Beregninger / datablad (neste revisjon, A3):**
- [ ] O-ringspor for pluggen fra Parker-tabellen (tverrsnitt, glanddybde, sporbredde, klaring, overflatekrav)
- [ ] Pluggtykkelse mot 4,4 kN (POM-datablad: E, flytegrense, kryp)
- [ ] Propell + dyse: $K_T$/$K_Q$ eller aktuatorskive mot 6374 ved 21,6 V, med Ø ≤ 0,18 m
- [ ] Rørprodusentens E-modul og SDR – bekreft knekking
- [ ] Fusion-modell med reelle volumer → oppdatert $x_G$, $x_B$, $z_G$, $z_B$

**Tester i rekkefølge:**
1. Vei alle kjøpte og printede deler → oppdater masseskjemaet
2. Testprint av nese og dyse: passform, og sjekk at infill flømmes (senk delen i vann, vei før og etter)
3. Hall-sensor gjennom 6,6 mm PVC: rekkevidde, og at motoren stopper når magneten fjernes
4. Gjennomføringer: trykktest pluggen alene til 6 bar
5. Trykktest av komplett tomt hus til 6 bar (≥ 30 min), og vakuumtest-prosedyre via Schrader
6. ESC-temperatur i lukket hus ved 400–500 W (benk, i vannkar)
7. Kapp røret → trim i basseng (fersk) → regn om til sjø
8. Først da: test med dykker i kontrollert grunt vann

---

## Kilder
- PVC-U trykkrør 110×6,6 PN16: Kramp (DIN 8063/ISO 727); 110×8,2 PN16: Ahlsell SE (SS 1776); avløpsrør 110×3,2: Ahlsell SE
- PVC-U materialdata: Röchling Trovidur-datablader
- PETG: Prusament TDS (tetthet 1,27, vannopptak); porøsitet i printet PETG: Polymers 11 (2019) 1220
- Molicel P45B: NKON (68 g); Flipsky 6374: 0,86 kg; Turnigy Marine 120A: 155 g
- Parker O-Ring Handbook (O-ringspor – må hentes)
