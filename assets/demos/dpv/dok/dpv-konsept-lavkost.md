# DPV Rev A0 – lavkost-konsept med tek-ytelse, 40 m

*23.11.2026 · Status: konsept, ikke verifisert · Bygger på [[DPV-kravgrunnlag]]*

**Tolkning av målet:** tek-klasse ytelse (fart, brenntid, robusthet), men dimensjonert for **40 m maks dybde**. Kostnaden skal være så lav som mulig. Det at vi ikke trenger 100–300 m som de kommersielle tek-modellene, er den største enkeltbesparelsen.

> ⚠️ **Prototype – ikke sertifisert.** Ingen test med dykker før (1) huset er trykktestet til ≥ 1,5 × 40 m (≥ 6 bar), (2) dødmannsbryteren er verifisert og (3) propellen er beskyttet.

---

## 0. Kritiske risikoer (flagget først)

| Risiko | Konsekvens | Tiltak i Rev A0 |
|---|---|---|
| **Termisk løp i Li-ion i tett hus** | Brann, trykkoppbygging, skroget kan sprenges | BMS med cellespenning + temperatur; hovedsikring; **trykkavlastningsventil** (åpner utover); NTC på pakke og ESC; ladning kun med huset åpent eller via godkjent lader med BMS-kommunikasjon |
| **Lekkasje / flooding** | Kortslutning, H₂ fra elektrolyse, DPV-en synker | Våt motor → **ingen akselpakning**; dobbel O-ring på endelokk; **vakuumtest før hvert dykk**; fuktsensor i batterirommet; sikring nær cellene |
| **Runaway (motoren stopper ikke)** | Ukontrollert oppstigning/nedstigning | Magnetisk dødmannsbryter + hovedbryter; ESC-ens timeout på manglende signal; trigger-lås; strømgrense |
| **Kollaps av skroget (knekking)** | Flooding, oppdriftstap | Dimensjonert mot knekking med SF ≥ 3, trykktest til 6 bar |
| **Tap av fremdrift langt fra inngang** | Dykker må svømme / slepes | Brenntidsreserve (⅓-regel), to separate batteripakker (B-krav), festepunkt for slep |
| **Ukontrollert oppstigning pga. oppdrift** | Skyter mot overflaten | Nøytral til litt negativ ved flooding; masse endres **ikke** med ladetilstand (Li-ion) → trim lik ved fullt og tomt batteri |

---

## 1. Hva andre har gjort – og hva vi kan lære

| Løsning | Pris | Hva som er smart | Svakhet / vår mulighet |
|---|---|---|---|
| **Dive Xtras BlackTip** | ~USD 1 799 + batterier | **PVC-skrog**. **Verktøybatterier (DeWalt DCB 18/20 V)**: billig, byttbare, under 100 Wh per pakke (ok på fly). 100 m rating | Boost bare **7 min**. Brukerne klager på at **trimmen ikke blir flat**. Ett batterisystem, lite redundans |
| **Dive Xtras Piranha** | ~USD 4 995 | Modulære, nøytrale batterimoduler. Brenntiden skaleres med antall moduler | Dyr |
| **Blue Robotics DIY T500** | ~USD 2 700 (≈ 2 500 er BR-deler) | Åpen design, **flooded thrustere**, magnetisk reed-dødmannsbryter med håndleddssnor, 1,5 m/s | 2 × T500 til ~790 USD stk. dominerer kostnaden. **Ikke propellvern**, ingen integrert oppdrift, kort brenntid (20–80 min, 4S 18 Ah) |
| **SUEX / SEACRAFT / Bonex** | USD 5 000–12 000 | Våt motor uten akselpakning (SEACRAFT), stator som propellvern, høy virkningsgrad, 100–300 m | Dimensjonert for dybder vi ikke trenger |
| **eFoil-miljøet (FOIL.zone)** | Motorer USD 60–80 | Billige **outrunnere (63xx) brukt våte**, 21700-pakker, VESC-baserte ESC-er | Korrosjon i saltvann: lagre og magneter må beskyttes |
| **Gamle DIY-DPV-er (ScubaBoard)** | Lav | PVC-rør + trollingmotor + magnetbryter | Bly-syre, børstemotor, dårlige akselpakninger |

**Hvor vi kan bli bedre:**
1. **Virkningsgrad** (vårt fagfelt): stor, saktegående propell + dyse/stator. Kommersielle DPV-er ser ut til å ligge på η_tot ≈ 0,2–0,3 på cruise (overslag i kravgrunnlaget).
2. **Trim fra start:** beregn tyngdepunkt og oppdriftssenter (CG/CB) i Fusion før bygging – BlackTips svake punkt.
3. **Lav kostnad uten å kjøpe thruster:** eget våt-motor-aggregat i stedet for T500.
4. **Vakuumtest før dykk** som standard (BlackTip selger en vakuum-bulkhead for ~USD 500 – vi kan gjøre det med en sjekkventil og håndpumpe).
5. **Integrasjon med dykkecomputeren:** batteristatus og ascent-alarm.

---

## 2. Konseptvalg Rev A0

| Delsystem | Valg | Begrunnelse | Alternativ |
|---|---|---|---|
| Skrog | **PVC-U trykkrør, Ø160 mm** (SDR verifiseres; Ø125/Ø110 vurderes i A1, se 3.6) med maskinerte POM-endelokk | Billig, korroderer ikke, tåler 40 m med god margin (kap. 3) | Al 6082-T6-rør (dyrere, tynnere vegg, må anodiseres) |
| Motor | **Våt (flooded) outrunner**, 63xx-klasse, lav KV | Ingen akselpakning = ingen lekkasjebane gjennom skroget | Tørr motor + magnetkobling |
| Lagre | Keramiske eller vannsmurte polymerlagre | Vanlige stållagre korroderer først | – |
| Korrosjonsvern motor | Vikling støpt i epoksy / konformt belegg, magneter belagt, skylling i ferskvann | Kjent metode fra ROV- og eFoil-miljøet | – |
| Propell + dyse | Egendesignet (3D-print → CNC/støpt), dyse med stator som vern | Gir vern og virkningsgrad i ett | Kjøpt propell |
| ESC | VESC-basert (strømgrense, temperatur, timeout, logging) | Programmerbare sikkerhetsfunksjoner | Hobby-ESC (dårligere kontroll) |
| Batteri | **10S, Li-ion 21700**, to pakker (A-krav: én; B-krav: to separate) | Billigst per Wh, egen BMS, rett form for røret | Verktøybatterier (BlackTip-modellen) |
| Bryter | Hall/reed + magnet i trigger, i tillegg hovedbryter og håndleddssnor | Ingen gjennomføring | – |
| Lading | Endelokket åpnes i A0 | Billigst. Utvendig lading vurderes i Rev B | Våtkontakt |

---

## 3. Beregninger

### 3.1 Trykk ved 40 m

$$
p = \rho g h = 1025 \cdot 9{,}81 \cdot 40 \approx 4{,}02\cdot10^{5}\ \text{Pa} = 4{,}0\ \text{bar (overtrykk)}
$$

Trykktest: $1{,}5 \times 4{,}0 = 6{,}0$ bar.

### 3.2 Knekking av PVC-røret (styrende)

Lang tynnvegget sylinder under ytre trykk (konservativt, ser bort fra avstivningen fra endelokkene):

$$
p_{cr} = \frac{2E}{1-\nu^2}\left(\frac{t}{D}\right)^{3}
$$

**Antatt:** $E_\text{PVC} = 2{,}5\text{–}3{,}5$ GPa og $\nu \approx 0{,}38$ (verifiseres mot rørprodusentens datablad). Krav: $p_{cr} \ge 3 \cdot 4{,}0 = 12$ bar = 1,2 MPa (SF 3 for imperfeksjoner og kryp).

Løst for nødvendig $t/D$ med det laveste $E$:

$$
\left(\frac{t}{D}\right)^{3} = \frac{p_{cr}(1-\nu^2)}{2E} = \frac{1{,}2\cdot10^{6}\cdot 0{,}856}{2\cdot 2{,}5\cdot10^{9}} = 2{,}05\cdot10^{-4}
\;\Rightarrow\; \frac{t}{D} \ge 0{,}059
$$

For $D = 160$ mm: $t \ge 9{,}4$ mm, altså **SDR ≤ 17**. Med $E = 3{,}5$ GPa blir kravet $t/D \ge 0{,}053$ ($t \ge 8{,}4$ mm).

**Flytekontroll** (ringspenning ved testtrykk, $t = 9{,}5$ mm):

$$
\sigma_\theta = \frac{pD}{2t} = \frac{0{,}6\cdot 160}{2\cdot 9{,}5} \approx 5{,}1\ \text{MPa} \ll \sigma_y \approx 45\text{–}55\ \text{MPa (antatt)}
$$

→ Knekking styrer, ikke flyt. Endelokkene (POM, plate under trykk) dimensjoneres separat.

### 3.3 Motstand og kraftbehov

$$
F_D = \tfrac12 \rho\, C_D A\, v^2, \qquad C_D A = 0{,}15\text{–}0{,}25\ \text{m}^2\ \text{(antatt, dykker i tek-utstyr + DPV)}
$$

| Fart | $F_D$ | Nyttig effekt $F_D v$ |
|---|---|---|
| Cruise 0,75 m/s (45 m/min) | 43–72 N | 32–54 W |
| Topp 1,4 m/s (84 m/min) | 151–251 N | 211–351 W |

### 3.4 Propell – aktuatorskive

Ideell virkningsgrad: $\eta_i = \dfrac{2}{1+\sqrt{1+C_T}}$ med $C_T = \dfrac{T}{\tfrac12\rho A V^2}$.

Cruise, $T = 58$ N (midtverdi), $V = 0{,}75$ m/s:

| Propelldiameter | $A$ [m²] | $C_T$ | $\eta_i$ |
|---|---|---|---|
| 0,20 m | 0,0314 | 6,4 | 0,54 |
| 0,25 m | 0,0491 | 4,1 | 0,61 |
| 0,30 m | 0,0707 | 2,8 | 0,68 |

→ **Størst mulig diameter innenfor dysa** er den viktigste hydrodynamiske spaken. Reell propell: $\eta_p \approx (0{,}75\text{–}0{,}85)\,\eta_i$ (antatt).

### 3.5 Virkningsgradskjede og brenntid

$$
\eta_\text{tot} = \eta_\text{ESC}\,\eta_\text{motor}\,\eta_p \approx (0{,}95\text{–}0{,}98)(0{,}80\text{–}0{,}90)(0{,}45\text{–}0{,}55) \approx 0{,}34\text{–}0{,}49
$$

Elektrisk effekt: cruise $P_\text{el} = 32\ldots54/(0{,}34\ldots0{,}49) \approx$ **65–160 W**. Toppfart $\approx$ **430–1 030 W** → motor/ESC må tåle ~1,2 kW kort.

**Batteri 10S4P eller 10S5P, Molicel P45B** (datablad: 3,6 V nominelt, 4 500 mAh, 45 A kontinuerlig, ~70 g):

| Pakke | Celler | Energi | Masse celler | Cellekost |
|---|---|---|---|---|
| 10S4P | 40 | 40 × 16,2 = 648 Wh | 2,8 kg | ~USD 140–400 |
| 10S5P | 50 | 810 Wh | 3,5 kg | ~USD 175–500 |

Strøm per celle på toppfart (10S5P): $I = 1030/36/5 \approx 5{,}7$ A ≪ 45 A → vi kunne valgt en **billigere energicelle** med høyere Wh (verifiseres mot datablad).

Brenntid 10S4P, 85 % brukbar energi (551 Wh):
- Cruise: $551/0{,}16 \approx 3{,}4$ h (konservativt) til $551/0{,}065 \approx 8{,}5$ h
- Full fart: $551/1{,}03 \approx 32$ min til $551/0{,}43 \approx 77$ min

Til sammenligning har BlackTip 7 min boost og SUEX XJ 100 min på full fart. **Usikkerheten i $C_D A$ dominerer** → må måles tidlig.

### 3.6 Oppdrift

$$
V_\text{disp} = \frac{m_\text{tot}}{\rho_\text{sjø}}
$$

Ø160 SDR17-rør (t ≈ 9,4 mm, ρ_PVC ≈ 1 400 kg/m³ antatt):
- Masse per meter: $\pi(0{,}080^2-0{,}0706^2)\cdot 1400 \approx 6{,}2$ kg/m
- Ytre fortrengning per meter: $\pi\cdot 0{,}080^2 \approx 20$ L/m

Et rør på 0,6 m: fortrengning ≈ 12 L + endelokk/dyse ≈ 1,5 L ≈ 13,5 L. Masse ≈ celler 3 + motor 1 + rør 3,7 + lokk/dyse 2 ≈ 9,7 kg → **≈ 3–4 kg positiv** → trenger ballast.

→ **Optimalisering for Rev A1:** Ø125 eller Ø110 (mindre ballast, mindre frontareal, billigere rør) – sjekk at batteriet (10S4P/5P) får plass og regn knekkingen på nytt. CG/CB beregnes i Fusion. Li-ion endrer ikke masse med ladetilstand, så trimmen er lik ved fullt og tomt batteri.

---

## 4. Kostnadsestimat Rev A0 (grovt)

| Post | Estimat | Status |
|---|---|---|
| 40–50 × P45B | USD 140–500 | Pris verifisert (nkon €3,45 – 18650batterystore $6,99) |
| Outrunner 63xx | USD 60–80 | Fra eFoil-konfigurator, ikke datablad |
| VESC-ESC | USD 100–250 | **Antatt** |
| 10S BMS + sikring + kontakter | USD 50–120 | **Antatt** |
| PVC-rør, POM-emner, O-ringer | NOK 1 000–2 500 | **Antatt** |
| Propell/dyse (print + epoksy/CNC) | NOK 500–2 000 | **Antatt** |
| Trykkavlastningsventil, vakuumport, reed/hall | NOK 500–1 500 | **Antatt** |
| **Sum** | **≈ NOK 6 000–12 000** | vs. BlackTip ~USD 1 800 + batt., BR DIY ~USD 2 700, SUEX/SEACRAFT USD 5–12k |

Verktøy, lader og testrigg kommer i tillegg.

---

## 5. Hva gjenstår / må testes før neste steg

**Beslutninger:**
- [ ] Bekreft målene: toppfart, cruisebrenntid og 40 m → fylles inn i prosjektinstruksen
- [ ] A0: ett batteri eller to separate pakker
- [ ] Skal DPV-en snakke med dykkecomputeren (kontakt/firmware)?

**Datablad som må hentes:** PVC-rør (E, SDR, σ_y), konkret motor (KV, Kt, maks strøm, mål), VESC-modell, BMS, trykkavlastningsventil, O-ringspor (Parker ORDH).

**Tester i rekkefølge:**
1. Mål $C_D A$: slep en dykker med lastcelle i tow-cord ved 2–3 farter
2. Benktest av våt motor + propell i tank: statisk skyvekraft, strøm, temperatur, saltvannseksponering over tid
3. Trykktest av tomt hus til 6 bar (vanntank/trykkammer), sjekk deformasjon
4. Vakuumtest-prosedyre + verifisering av fuktsensor
5. BMS-, sikrings- og termisk test av batteripakken i huset (utenfor vann først)
6. Verifisering av dødmannsbryter og ESC-timeout
7. Oppdrift/trim i basseng, deretter flooding-scenario
8. Først da: test med dykker i kontrollert grunt vann

---

## Kilder
- Dive Xtras BlackTip/Piranha: dive-xtras.com, backscatter.com, ScubaBoard-tråd «New DPV – Dive Xtras», missionscuba.com-test
- Blue Robotics: «Introducing the DIY T500 DPV»; T500-datablad (16,1 kgf @ 24 V, 300 m)
- Molicel P45B: nkon.nl, 18650batterystore.com, Molicel-datablad
- Korrosjon i våte motorer: Blue Robotics-forum, homebuiltrovs.com, FOIL.zone
- eFoil-komponentpriser: pacificmeister.github.io (DIY eFoil-konfigurator)
- ScubaBoard: DIY DPV-tråder (PVC-skrog, magnetbrytere)
