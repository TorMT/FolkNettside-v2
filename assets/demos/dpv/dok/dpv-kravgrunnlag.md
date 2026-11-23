# DPV – standarder, krav og typiske designkarakteristikker

*Forstudie for prosjektet UnderWaterScooter DPV · 23.11.2026*

> Merk: Tall og påstander fra produsenter, manualer og fagartikler (kildeliste nederst). Punkter merket **(egen vurdering)** eller **(fra generell kunnskap – verifiser)** er ikke hentet fra kildene i dette søket.

---

## 1. Standarder og regelverk

### Hovedfunn: det finnes ingen egen harmonisert EN/ISO-standard for DPV-er
Søket fant standarder for regulatorer (EN 250), BCD (EN 1809), drakter (EN 14225), dybdemålere (EN 13319) og opplæring (ISO 24801-serien), men **ingen produktstandard for selve DPV-en**. Produsentene CE-merker derfor mot generelle direktiver.

**Eksempel – SEACRAFT (Future/Ghost):** samsvarserklæringen viser til
- Maskindirektivet 2006/42/EC
- EMC-direktivet 2014/30/EU
- RoHS 2011/65/EU

– og nevner ingen spesifikke EN/ISO/IEC-standarder.

### Relevant regelverk for et eget design
| Område | Regelverk / standard | Kommentar |
|---|---|---|
| Maskinsikkerhet | MD 2006/42/EC → **Maskinforordningen (EU) 2023/1230** fra 20.01.2027 *(fra generell kunnskap – verifiser)* | Risikovurdering, nødstopp, beskyttelse mot roterende deler (propell) |
| EMC | 2014/30/EU | Motorkontroller (ESC) er en typisk støykilde |
| Stoffer | RoHS 2011/65/EU, REACH | |
| Lader | Lavspenningsdirektivet 2014/35/EU *(generell kunnskap)* | Kjøp CE-merket lader i stedet for å lage egen |
| Trådløst (BLE-app, o.l.) | RED 2014/53/EU *(generell kunnskap)* | Kun hvis radio er med |
| Batteri | UN 38.3 (transport), IEC 62133-2 (celler/pakker), EU-batteriforordningen 2023/1542 *(generell kunnskap – verifiser)* | UN 38.3 er avgjørende hvis DPV-en skal fly |
| Dybde-/tidsvisning | EN 13319 (dybdemålere) | Bare relevant hvis DPV-en viser dybde som instrument |
| Fritidsbåtdirektivet 2013/53/EU | Gjelder fritidsbåter og **vannscootere (overflate-PWC)** – ikke undervanns-DPV | Ikke aktuelt, men ofte forvekslet |

### Opplærings-/brukerstandarder som gir designkrav
GUE DPV1-standarden krever at DPV-en har **en tauline bak med boltesnapp** som klippes i D-ringen på skrittstroppen, og **en line foran for slep**. Den krever også øvelser i å slepe en dykker med død DPV og håndtere en **runaway-DPV**. → Designet må ha festepunkter for tow-cord og leash, og tåle slep.

---

## 2. Grunnkrav (funksjonelle)

1. **Nøytral oppdrift og trim ved arbeidsdybde.** En DPV med positiv eller negativ oppdrift kan være farlig når dykkeren må klippe den på BCD-en. Skilles dykkeren fra en DPV kan han havne svært over- eller underbalansert og få ukontrollerte dybdeendringer.
   - SEACRAFT leverer forhåndsbalansert for ferskvann + trimvekter på 65 g og 200 g for andre vanntyper.
   - **Designkrav (egen vurdering):** justerbar ballast ±~0,5 kg, og et skrog som ikke komprimeres merkbart med dybden (ellers endres oppdriften).
2. **Dybderating** med margin (se tabell i kap. 4). Dybderating sier noe om robusthet, men lagre og pakninger er det som faktisk bestemmer pålitelighet.
3. **Skyvekraft og fart** tilpasset bruken.
4. **Brenntid / rekkevidde.** Brenntid × fart = rekkevidde – dette er de to primære ytelsesmålene.
5. **Flere hastigheter / trinnløs regulering** – sparer batteri og øker nytten.
6. **Tow-cord-bruk:** en tow-cord tar all skyvekraft og avlaster armene. Feil linjeføring betyr at armene drar kroppen og gir rask utmattelse.
7. **Driftstemperatur:** f.eks. SUEX VR-T EVO: −5 til +35 °C i vann.

---

## 3. Sikkerhetsfunksjoner (de vanligste)

| Funksjon | Hvorfor | Eksempel |
|---|---|---|
| **Trigger-lås / hovedbryter** | Utilsiktet start – ofte er det tow-cord-linen som hekter seg i triggeren | Dive-X trigger-lås; P1 med nylonskrue |
| **Runaway-håndtering** | Feil kan gi en DPV som ikke stopper | Manualer har egne «DPV won't stop»-prosedyrer |
| **Nødbryter / bypass** | Bytte batteri eller omgå elektronikken under vann | Bonex: 2 uavhengige batteripakker + nødbryter; SubGravity: emergency bypass + auto prop stop |
| **Automatisk propellstopp ved blokkering** | Line, tang, hår osv. i propellen | Bonex «protective propeller cut-off»; SubGravity kan resettes etter at fremmedlegemet er fjernet |
| **Propellvern / stator** | Hindrer at fingre kommer i propellen. Noen tek-modeller har åpent design for lavere drag | SEACRAFT: «post-swirl»-stator som vern |
| **Propell som kan fjernes under vann** | Gjør det mulig å løse innfiltring | SEACRAFT, SUEX «prop lock» |
| **Kontaktfrie brytere (magnet/reed)** | Ingen gjennomføringer i skroget | SEACRAFT; Blue Robotics DIY: reed-bryter med magnet i håndleddssnor = dødmannsbryter |
| **BMS / PCM** | Kortslutning, overlast, overlading, dyputlading | SEACRAFT |
| **Temperaturovervåking** | Overoppheting av motor/elektronikk | Bonex «temperature control» |
| **Dybde-/stigningsalarm** | Hindre rask oppstigning | Sublue Vapor: alarm ved 18 m/min nedstigning og 9 m/min oppstigning |
| **Dobbel akselpakning** | Ytre pakning svikter → indre pakning hindrer lekkasje | SUEX |
| **Batteri frakoblet ved transport/lagring** | Hindrer start og hydrogenoppbygging (bly) | Sea-Doo |

**Kjente feilmoduser:** innfiltring i propellen (koraller, fiskeline), mekanisk skade på trigger, elektronikk som overopphetes eller oversvømmes. Et koralltre kan for eksempel kile seg fast i gapet mellom propell og skrog.

**Hydrogen:** Gass fra batteriet eller fra elektrolyse av sjøvann som lekker inn kan antennes av gnister, for eksempel fra børstene i en børstemotor. → Bruk børsteløs motor, Li-ion i stedet for bly, og registrer fukt i batterirommet.

---

## 4. Typiske designkarakteristikker

### Arkitektur
- **Torpedo-/dråpeform med propell bak og håndtak** er den vanligste utformingen. Dykkeren holder inne en trigger og styrer med kroppsstillingen.
- Alternativer: **pumpejet** (Sublue Vapor), **doble thrustere** (Yamaha Seawing, Sublue Navbow), og **slepe-DPV vs. sittende**.
- Tek-modeller: modulære eller med **to batteripakker** for redundans (Bonex). Vanlige DPV-er har én motor og ett batterirom, så én feil gjør dem ubrukelige.

### Skrog og tetning
- Materialer: aluminium (SEACRAFT), karbon (Bonex skrog og dyse, Sublue Navbow), teknopolymer/polykarbonat (SUEX VR-T).
- O-ringer: SEACRAFT bruker NBR 70 ShA og bytter dem **hver 12. måned**.
- **Akselgjennomføring – tre løsninger:**
  1. **Våt motor uten akselpakning** – SEACRAFT kjører motoren helt neddykket.
  2. **Magnetkobling** – ingen lekkasjebane, mindre friksjon enn pakkboks. Radiell (konsentrisk) magnetkobling unngår aksialkraften som et aksialt oppsett gir.
  3. **Mekanisk akselpakning** – tåler lite trykkforskjell og slites. Keramiske tetninger tåler typisk 5–15 bar avhengig av leverandør. Dobbel pakning er vanlig (SUEX).
- **Utvendig lading** (forseglet skrog) reduserer hvor ofte skroget åpnes – mindre risiko for O-ring-feil.

### Drivlinje og elektrisk
- **Børsteløs motor**, Li-ion (eller LiMn), BMS.
- Systemspenninger: 25,2 V (SUEX XJ), 26–37,8 V (SEACRAFT), 29,6 V (Sublue Vapor Pro), 36 V (SUEX XK). Fritids-DPV-er bruker gjerne 14,8–22 V.
- Hastighetsregulering med én hånd, trinnløs (Bonex, Genesis) eller i trinn (SEACRAFT har 9 gir).

### Vedlikehold og levetid (SEACRAFT som referanse)
- Rengjøring/inspeksjon hver 20.–40. dykk eller hver 1.–3. måned, årlig service.
- DPV-en: 10 års levetid. Batteri: maks 300 fulle ladesykluser. Trykklager: ~120 timer på full effekt.

### Typiske spesifikasjoner per klasse

| Klasse | Eksempler | Dybde | Skyvekraft | Toppfart | Brenntid | Batteri | Vekt |
|---|---|---|---|---|---|---|---|
| **Fritid / snorkling** | Yamaha Seawing II, JetPod Pro, Sublue Navbow/WhiteShark | 30–40 m | 80–250 N (Seawing 12 kgf, Navbow 31 lbf ≈ 138 N, Vapor Pro 249 N) | 1,5–3,3 m/s | 30–65 min per batteri | ~150–385 Wh (JetPod 148 Wh, Vapor Pro 385 Wh) | 3,5–8 kg |
| **Rekreasjonsdykk** | Yamaha RDS300, SUEX VR-T, TUSA SAV-7 | 30–100 m | ~200 N (VR-T) | ~1,1 m/s (VR-T 65 m/min) | 90–120 min | – | 8–20 kg |
| **Teknisk / grotte** | SUEX XJ/XK, SEACRAFT Future/Ghost, Bonex, SubGravity | 100–300 m | 270–375 N | 1,2–1,7 m/s (70–100 m/min) | 100–260 min full fart; 300–700 min cruise | 750–2000 Wh | 20–25 kg |

Teknisk detalj, SUEX XJ: 330 N, 90 m/min, 100 min på full trigger / 310 min på 45 m/min, 940 Wh. SUEX XK: 375 N, 100 m/min, 110 min / 360 min, 1340 Wh @ 36 V. Bonex Discovery: Ø 218/300 mm × 670 mm, 25 kg, 270 N, 70 m/min, 260/600 min.

---

## 5. Dimensjonering – overslag fra produsentdata (egen vurdering)

**Elektrisk effekt** utledet fra batteri / brenntid:

$$
P_\text{el} = \frac{E_\text{batt}}{t}
$$

- SUEX XJ, full fart: $P = \dfrac{940\ \text{Wh}}{100/60\ \text{h}} = 564\ \text{W}$
- SUEX XJ, cruise (45 m/min = 0,75 m/s): $P = \dfrac{940}{310/60} = 182\ \text{W}$
- SUEX XK, full fart: $P = \dfrac{1340}{110/60} = 731\ \text{W}$

**Energiforbruk per distanse** (SUEX XJ): $940/14\ \text{km} \approx 67\ \text{Wh/km}$ på cruise, $940/9 \approx 104\ \text{Wh/km}$ på full fart.

**Motstandsmodell for dykker + DPV:**

$$
F_D = \tfrac12 \rho\, C_D A\, v^2
$$

Med statisk skyvekraft som øvre grense ($T_0 = 330\ \text{N}$, $v = 1{,}5\ \text{m/s}$, $\rho = 1025\ \text{kg/m}^3$):

$$
C_D A \le \frac{2T_0}{\rho v^2} = \frac{2\cdot 330}{1025\cdot 2{,}25} \approx 0{,}29\ \text{m}^2
$$

Skyvekraften synker med fremdriftstallet, så reell $C_D A$ for en dykker i tek-utstyr ligger trolig lavere (~0,15–0,25 m²). **Bør måles** (slepeforsøk eller lastcelle på tow-cord).

**Systemvirkningsgrad** (overslag) ved cruise: $\eta = \dfrac{F_D v}{P_\text{el}}$. Med $C_D A = 0{,}2\ \text{m}^2$ og $v = 0{,}75\ \text{m/s}$: $F_D = \tfrac12\cdot 1025\cdot 0{,}2\cdot 0{,}5625 \approx 58\ \text{N}$, nyttig effekt $\approx 43\ \text{W}$, altså $\eta \approx 43/182 \approx 0{,}24$. Dette viser at det er mye å hente i propell-/dysedesign og i lavlast-virkningsgraden til motor og ESC – et naturlig fokus for et hydrodynamikk-prosjekt.

---

## 6. Konsekvenser for vårt prosjekt (egen vurdering)

**Må-krav (forslag):**
- Nøytral oppdrift/trim ±50 g, justerbar ballast
- Dybderating ≥ 40 m (fritid) eller ≥ 100 m (tek), trykktest til 1,5 × rating
- Dødmannstrigger + trigger-lås + hovedbryter (helst magnetisk/kontaktfri)
- Propellvern/stator og automatisk stopp ved blokkering (strømsensing i ESC)
- BMS med beskyttelse mot over-/underspenning, overstrøm og temperatur
- Festepunkter for tow-cord (bak) og slepeline (foran)
- Lekkasjedeteksjon i batterirommet

**Bør-krav:**
- Trinnløs eller mange hastighetstrinn, ett-hånds betjening
- Utvendig lading / forseglet skrog
- Redundans (to batteripakker) hvis tek-klasse
- Ascent-rate-alarm (kan kobles til [[dive-computer]]-prosjektet)

**Neste steg:**
1. Velg klasse (fritid 40 m vs. tek 100+ m) – dette styrer skrog, tetning og batteri
2. Sett måltall: fart, brenntid → batteristørrelse (Wh) fra kap. 5
3. Velg akselløsning: våt motor vs. magnetkobling vs. dobbel pakning
4. Propell + dyse/stator: design og CFD/slepetank
5. Risikovurdering etter maskinforordningen (FMEA)

---

## Kilder
- SEACRAFT Original Scooter User Manual (2024): support.seacraft.eu
- DAN Alert Diver: «Redefining Performance»; Alert Diver EU: «DPVs – tools, toys, troubles»
- GUE DPV1 Standards v9.1
- SUEX produktdata (XJ/XK Goldfinder, VR-T EVO)
- Bonex Discovery / Discovery RS-datablader
- Dive Xtras BlackTip / CudaX-manualer
- Scuba Diving Magazine: DPV-guider
- Blue Robotics: DIY T500 DPV
- UBC Aquanauts: Thruster Development (magnetkobling)
- ScubaBoard: DPV models and specs; DIY DPV-tråder
- Sublue, Yamaha Seascooters produktdata
- Patenter: US Aquascooter (hydrogen), US 9643704 (DPV-kobling)
