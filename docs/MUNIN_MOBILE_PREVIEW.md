# Munin – godkjent STEP → lett GLB for mobil

**Status:** Reproduserbar konverteringskandidat implementert. **Ekte Munin-GLB er ikke generert eller publisert før en vellykket workflow-kjøring og manuell inspeksjon.**

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
