# Munin – godkjent STEP → lett GLB for mobil

**Status 2026-10-25:** Ekte STEP konvertert lokalt med eksisterende OCP-skript. Godkjent visningskandidat ligger i `assets/models/munin-mobile-preview.glb` med hash/metadata. CAD-knappen laster filen først ved klikk. Nettleserakse er eksplisitt Z-up; alle 130 deler beholdes separat. CI/mobilresultater registreres i ACTIVE_WORK_HANDOFF.

Valgt toleranse: 15 mm, 184 958 trekanter, 4 580 856 bytes. Forsøk med 1 og 5 mm overskred grensen på 250 000 trekanter og ble forkastet. Mål kontrollert mot originaltegning ark 2: 1024,16 × 885,97 × 806,51 mm. Bredde i toppvisning er 886,07 mm; avviket på 0,10 mm er under tesselleringsnøyaktigheten. Silhuett, to skrog, ramme, sensorutstyr og thrusterplassering visuelt sammenlignet med ark 1. Farger er illustrative og navn generiske; ingen påstand om originale materialer eller sertifiserte beregninger.

Skjermbilder fra Chrome CI lagres som `munin-mobile-review`. Fysiske iOS/Android-enheter er ikke testet. Original STEP/PDF er ikke kopiert til repoet.

Filer fra den eksisterende offentlige Munin-katalogen på NTNU:
- `https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER.step`
- `https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER.f3z`
- PDF-tegning samme sted. V2 bruker disse som originalreferanser.

Brukeren har gitt tillatelse til å gjenbruke **akkurat Munin-modellen** for CAD-eksemplet. Dette gjelder **ikke** andre NTNU-kurs, modeller, beskyttede ressurser eller hele V1.

## Fremgangsmåte uten å modifisere NTNU

**Valg A (GitHub):** Åpne GitHub Actions → *Munin mobile GLB candidate (manual)* → **Run workflow** med deflection 60 mm. Jobben laster kun den kjente, offentlige STEP-adressen, kjører den lokalt i en isolert runner med OpenCascade og laster opp `munin-mobile-glb-review` med GLB + metadatarapport. Runner-originalen lagres aldri i repo/artifact. Artifact slettes etter 7 dager. Dette er **ingen automatisk produksjonspublisering**.

**Valg B (lokal maskin):** Last ned STEP fra NTNU og kjør:

```bash
python -m pip install cadquery-ocp==7.9.3.1.1 trimesh==4.11.1 numpy==2.3.5
python scripts/convert_munin_step.py /path/to/NJ26_MUN_HULL_ASM_MASTER.step \
  --output ./candidate/munin-mobile-preview.glb --deflection-mm 60 --max-glb-mb 15
python -m unittest discover -s tests -p test_munin_converter.py -v
```

Hvis GLB blir for stor eller geometrien for kompleks, øk `--deflection-mm` (for eksempel 100). Ikke fjern grenser for størrelse/antall trekanter bare for å få en grønn bygging.

## Kvalitetsport før publisering i V2

1. Undersøk GLB med en tredjepartsviser og V2 CAD Workbench på PC og mobil, helst ekte iOS + Android.
2. Sammenlign silhuett, katamaranskrog, thrustere, propulsorplassering og tilknyttede komponenter mot original STEP/Fusion-tegning. Delene heter foreløpig **Munin-component-N**; STEP-treets originale semantiske komponentnavn er **ikke** bevart, og fargene er illustrative.
3. Kontroller lengde/bredde/høyde i **meter** mot `.meta.json` og originaltegningen; sentrering av GLB er en visningsendring, ikke endring av original CAD.
4. Kontroller hentet STEP og generert GLB ved SHA-256 i metadatarapporten. Ingen privat modell, annen studentfil eller innloggingsdata skal pakkes med.
5. Kun dersom modellen er korrekt, tilstrekkelig liten og godkjent, legg GLB i V2 som *én* separat binær asset og koble til en tydelig, **lazily loaded** «Vis Munin i 3D»-knapp. Originalene forblir på NTNU.
6. Hvis validering feiler: **behold** eksisterende F3Z/STEP/PDF-lenker og lokal import. Ikke generer en falsk/syntetisk Munin som erstatning.

Koden `scripts/convert_munin_step.py` bruker OCCT tessellering til en ekte mesh, men **ikke** eksakt B-rep i nettleser. Dette er bare visuell forhåndsvisning, ikke volum-/styrkesertifisering. Det er bevisst ingen automatisk modellkonvertering via en hemmelig Autodesk-token.

## Delgrupper og kildegrunnlag

`src/engineering/munin-parts.js` knytter 130 GLB-noder til STEP-assembly-navn.
XCAF (`STEPCAFControl_Reader`, navnemodus) ble brukt for å lese 130 solids med
fulle assembly-stier og sammensatte plasseringer. Globale BRep-bokser ble
matchet én-til-én mot de 130 GLB-komponentenes bokser, etter tilbakeføring av
sentreringen og meter→mm. Maksimal boksforskjell var 3,219 mm (15 mm tessellering).
Kildesti og avvik er beholdt per del for sporbarhet; delnavn innen samme assembly
har et nøytralt løpenummer fordi navn på hver enkelt solid ikke er tilgjengelig.

Grupper: Skrog (2 mesh-deler), Struktur, Thrustere (56 mesh-deler fordelt på
CW/CCW-assemblyene), Elektrisk/batteriboks og Sensorer (OS1, GoPro, ZED2i, GPS).
**56 mesh-deler betyr ikke 56 thrustere:** tegningens stykklist viser fire T200,
to CW og to CCW. Fester ligger under Struktur, ikke som thrustere.
Ingen effekt, skyvekraft, propellakse, strømningsretning eller materialtetthet
er gjettet. Disse må angis fra spesifikasjon/montering før fysisk analyse.
