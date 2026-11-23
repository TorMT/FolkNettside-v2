# DPV Rev A1 – budsjett maks 3 000 kr

*23.11.2026 · Erstatter kostnadsdelen i Rev A0 ([[DPV-konsept-lavkost]]). Sikkerhetskravene fra A0 gjelder uendret.*

**Kort sagt:** Med 3 000 kr kan vi få fart i tek-klassen (~1,1–1,5 m/s), men ikke brenntid i tek-klassen. Batteriet er den største kostnaden, så rammen holder bare hvis vi **låner/gjenbruker batterier** og **får verksted, materialer og 3D-print gratis fra NTNU**.

Valutakurs antatt ~11 NOK/USD og ~11,7 NOK/EUR. Import fra utlandet får +25 % mva (VOEC) + frakt. Alle priser må sjekkes før bestilling.

---

## 1. Hva som endres fra A0

| Delsystem | Rev A0 | **Rev A1 (3 000 kr)** | Konsekvens |
|---|---|---|---|
| Batteri | Egen 10S4P/5P, 648–810 Wh | **Lånte 18 V-verktøybatterier (5S)**, f.eks. 2 × 5 Ah ≈ 180 Wh, brukt **én om gangen** med omkobler. Alternativ: egen 6S2P (~210 Wh) | Kortere brenntid, men to pakker gir redundans gratis (BlackTip/Bonex-prinsippet) |
| Spenning | 36 V | **18–22 V** | Lar oss bruke billige båt-ESC-er for 2–6S |
| ESC | VESC | **Vannkjølt båt-ESC 120 A, 2–6S** | Har lavspenningsvern, temperaturvern og vern mot tap av gasspådrag (verifisert i datablad for Turnigy Marine 120A og Hobbywing Seaking) |
| Gass/dødmann | VESC-logikk | **ESP32 (samme familie som dykkecomputeren)** leser hall/reed → PWM til ESC. Mister ESC-en signal, stopper den | Billig, og gir et naturlig grensesnitt mot dykkecomputeren |
| Motor | 63xx | **Flipsky 6354/6374 (140 KV)**, brukt våt | 6374: maks 85 A, maks 8 Nm. Moment nok til en middels stor propell direkte |
| Skrog | PVC Ø160 SDR17 | **PVC Ø110** (rest/billig) + endelokk av POM-rest fra NTNU-verkstedet | Billigere, mindre ballast. Knekking må regnes på nytt med faktisk SDR |
| Propell/dyse | Egen | Egen, **3D-printet** (gratis på skolen), Ø0,15–0,20 m | Litt lavere η enn Ø0,25–0,30 |
| Trykkavlastning | Kjøpt ventil | **Hjemmelaget fjærbelastet O-ring-plugg** | Åpningstrykket må testes og dokumenteres |
| Vakuumtest | Sjekkventil | **Bilventil (Schrader) i endelokket** + lånt vakuumpumpe | Nesten gratis, og en stor sikkerhetsgevinst |

---

## 2. Budsjett

| Post | Estimat [kr] | Kilde / status |
|---|---|---|
| Motor Flipsky 6354/6374 140 KV | 1 000–1 500 | USD 77–113 (Flipsky) + mva + frakt |
| Båt-ESC 120 A, 2–6S, vannkjølt | 550–1 200 | Turnigy USD 48 (utsolgt), Seaking €85 |
| Batteri: **lånte 18 V-pakker** | 0 | Må avtales. Alternativ: 12 × 21700 (~720–1 000 kr) + 6S BMS (~100–200 kr, **antatt**) |
| ESP32-kort, hall/reed, magnet | 100–200 | **Antatt** (kanskje fra dykkecomputer-lageret) |
| Sikring (bilsikring 40 A + holder), kabel, XT60/XT90 | 100–200 | **Antatt** |
| Batterisko for 18 V-pakker (2 stk) | 100–250 | **Antatt** |
| PVC-rør Ø110 + O-ringer | 150–400 | **Antatt** |
| Schrader-ventil, fjær, NTC, fuktsensor | 50–150 | **Antatt** |
| POM-emner, aluminium, 3D-print | 0 | NTNU-verksted (må avklares) |
| **Sum** | **≈ 2 050–3 900** | Holder bare med lånt batteri og billigste motor/ESC |

**Spare videre:** spør instituttet, linjeforeningen eller bedrifter om sponsing av motor/ESC. Et brukt, dødt Sea-Doo-/Yamaha-scooter kan gi gratis propell, dyse og skrog (et vanlig DIY-triks på ScubaBoard).

---

## 2b. Alternativ Rev A1b – egenbygd 6S-pakke

**Krav:** maks 6S, fordi båt-ESC-en tåler 2–6S. 6S Li-ion er 21,6 V nominelt og 25,2 V fulladet.

**Cellevalg** – strømmen per celle ved 500 W og nominell spenning:

$$
I_\text{celle} = \frac{P_\text{el}}{U_\text{nom}\, n_p} = \frac{500}{21{,}6\cdot n_p}
$$

| Pakke | Celler | Energi | $I_\text{celle}$ @ 500 W | Kontinuerlig grense (datablad) | OK? |
|---|---|---|---|---|---|
| 6S2P Samsung 50E | 12 | $6\cdot2\cdot4{,}9\cdot3{,}6 = 212$ Wh | 11,6 A | 9,8 A | ❌ Ikke ved 500 W (OK opp til ~420 W) |
| 6S3P Samsung 50E | 18 | 318 Wh | 7,7 A | 9,8 A | ✅ |
| 6S2P Molicel P45B | 12 | 194 Wh | 11,6 A | 45 A | ✅ Stor margin |

Ved lav spenning (3,0 V/celle → 18 V) går strømmen opp ~20 %. 50E i 6S2P må derfor strømbegrenses til ~350 W.

**Plass i røret:** 12 celler stående parallelt med røraksen får plass i en sirkel med radius $\approx 4{,}03\,r$ (kjent sirkelpakking for 12 sirkler). Med $r = 10{,}75$ mm blir diameteren $\approx 87$ mm → **én blokk Ø87 × 71 mm** passer i Ø110-røret (innvendig Ø ~95–100 mm, avhenger av SDR). 6S3P (18 celler) legges i to lag.

**Kostnad for pakken:**

| Post | Estimat [kr] | Status |
|---|---|---|
| 12–18 celler | 600–1 800 (50–100 kr/stk inkl. frakt og mva) | Cellepriser verifisert (USD ~6–9, €3,45 hos NKON); **frakt av litiumceller til Norge må sjekkes** (farlig gods kan bli dyrt/begrenset) |
| 6S BMS 30–40 A, med balansering og temperaturvern | 100–250 | **Antatt** |
| Nikkelstrimmel, celleholdere, fiskepapir, kapton, krympeplast | 100–200 | **Antatt** |
| Punktsveiser | 0 (lånes) / 300–600 (billig sett) | **Antatt** – ikke lodd direkte på celler (varmeskade) |
| Lader 6S (CC/CV 25,2 V eller balanselader) | 0 (lånes) / 250–1 000 | **Antatt** – verktøybatterier har lader inkludert, DIY har ikke |
| **Sum batteri** | **≈ 800–3 850** | Låner vi sveiser og lader: ~800–2 250 |

**Hele DPV-en med A1b**, billigste variant: Flipsky 5065 (USD 56,80) eller sponset 6374, Turnigy-ESC, 6S2P, lånt sveiser og lader → **≈ 2 700–3 300 kr**. Det er på grensen, og 3 000 kr holder bare med lånt verktøy.

**Fordeler mot verktøybatterier:** kjente celler med datablad, egen BMS med temperatur- og cellespenningsovervåking (prosjektkrav), en form som passer røret, og mer energi per kr i 3P.

**Ekstra sikkerhetskrav for egenbygd pakke:**
- Kun nye, like celler fra samme batch, matchet på spenning (±0,02 V) før sveising
- Hovedsikring på pakkens + rett ved cellene, isolasjon mellom alle seriekoblinger
- Lading **utenfor huset**, i metallboks/LiPo-pose, aldri uten tilsyn
- Pakketest før montering: kapasitet, balansering, temperatur ved 400–500 W
- Avklar NTNU-labens HMS-regler for bygging av litiumpakker

## 3. Hva ytelsen blir (overslag)

Forutsetninger som i A0: $C_D A = 0{,}15\text{–}0{,}25$ m², $\eta_\text{tot} = 0{,}34\text{–}0{,}49$.

**Toppfart med strømgrense på 500 W elektrisk** (verktøypakker tåler typisk ~20–25 A – **må verifiseres for den konkrete pakken**):

$$
P_\text{nyttig} = \eta_\text{tot} P_\text{el} = 170\text{–}245\ \text{W}, \qquad
v = \left(\frac{2P_\text{nyttig}}{\rho\, C_D A}\right)^{1/3}
$$

- Pessimistisk: $v = \left(\dfrac{2\cdot 170}{1025\cdot 0{,}25}\right)^{1/3} = 1{,}33^{1/3} \approx 1{,}10$ m/s
- Optimistisk: $v = \left(\dfrac{2\cdot 245}{1025\cdot 0{,}15}\right)^{1/3} = 3{,}19^{1/3} \approx 1{,}47$ m/s

→ **1,1–1,5 m/s** = samme fartsklasse som tek-DPV-er (BlackTip 64 m/min ≈ 1,07 m/s kontinuerlig).

**Brenntid**, 2 × 90 Wh, 85 % brukbart = 153 Wh:
- Cruise (65–160 W): **57–140 min**
- Full fart (500 W): **~18 min**

**Moment på motoren**, direkte drevet propell. Ved $P_\text{aksel} \approx 450$ W og $n \approx 2\,000$ rpm:

$$
Q = \frac{P}{\omega} = \frac{450}{2\pi\cdot 2000/60} \approx 2{,}1\ \text{Nm} < 8\ \text{Nm (6374 maks)}
$$

→ Vi har god margin. Propellstigning og -diameter tilpasses KV og spenning (neste beregning).

---

## 4. Ekstra risikoer som følger av sparevalgene (flagget)

| Risiko | Tiltak |
|---|---|
| Verktøybatteriets egen BMS kan ha begrenset beskyttelse eller kommunikasjon inne i pakken (**verifiseres** for merket) | ESC-ens lavspenningsvern settes konservativt; sikring rett ved batteriskoen; NTC på pakken via ESP32 |
| To pakker i parallell kan gi ukontrollert utjevningsstrøm | **Én pakke om gangen** via omkobler – aldri parallell uten ideell diode |
| Hjemmelaget trykkavlastning | Test åpningstrykket på benk (mål: åpner ved 0,5–1 bar indre overtrykk), dokumenter |
| 3D-printet propell kan brekke eller deformeres | Benktest med strøm og skyvekraft; inspiser etter hver økt; dyse som vern |
| Hobbymotor korroderer i saltvann | Epoksy på viklingene, belagte magneter, keramiske lagre, skylling i ferskvann; inspeksjon hver 5. økt i starten |
| PVC Ø110 med ukjent SDR | Regn knekkingen på nytt, og trykktest til 6 bar uansett |

---

## 5. Hva gjenstår / må testes før neste steg

**Beslutninger:**
- [ ] Har noen i gruppa (eller familie) 18 V-verktøybatterier vi kan låne? Hvilket merke? → avgjør batterisko og spenning
- [ ] Avklare NTNU-verksted, materialer og 3D-print gratis
- [ ] Akseptere ~1–2 t cruise / ~18 min full fart for A1?

**Beregninger:** knekking for Ø110 med faktisk SDR, propelldimensjonering ($K_T$/$K_Q$) mot 6374 140 KV ved 18–22 V, oppdrift/trim i Fusion.

**Tester i rekkefølge:**
1. Benktest av batteripakken: maks kontinuerlig strøm og temperatur ved 500 W
2. Motor + propell i tank: skyvekraft, strøm, moment, temperatur
3. ESP32 → ESC: verifiser at motoren stopper når magneten fjernes og ved signalbrudd
4. Trykkavlastningsplugg: åpningstrykk
5. Trykktest av tomt hus til 6 bar + vakuumtest-prosedyre
6. Oppdrift/trim i basseng, så flooding-scenario
7. Mål $C_D A$ med lastcelle i tow-cord
8. Først da: test med dykker i kontrollert grunt vann
