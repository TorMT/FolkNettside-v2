# FolkNettside V2 — samlet kvalitetkart og utviklingsplan

**Oppdatert:** 2026-10-12. **Beslutning:** utvikle og kvalitetssikre i 1–2 måneder før vi vurderer utrulling. Ingen endring av NTNUs V1, `semestre/`, eksisterende portfolio-URL eller autentisering.

## Slik leses status

- **A — dokumentert solid:** implementert, automatiske numeriske/enhets- og/eller ekte Chrome-tester, tydelig avgrensede forutsetninger. Ikke synonymt med produksjonssertifisert.
- **B — godt på vei:** sentrale funksjoner og tester finnes; mangler omfattende ekte V1-/NTNU-filtester, ytelses-/mobilkontroll eller viktige hjørnetilfeller.
- **C — delvis:** sentrale funksjoner mangler eller er legacy-bro/ekstern avhengighet. Må forbedres før eventuelt V1-bytte.
- **D — blokkert / ikke verifisert:** krever ekte konto, serverkonfigurasjon, maskinvare, lisens eller rettighetsbeslutning. Ikke la mock-tester oppgradere til A.

Evidens: [paritetsregister](PRODUCTION_PARITY_GAP_REGISTER.md), [verktøykontrakt](TOOL_PARITY.md), [viewer-matrise](VIEWER_MIGRATION_MATRIX.md), [Hydro kvalifisering](HYDRO_COMPLETION.md), [backend](FOLKSIDE_BACKEND.md), [NTNU staging](NTNU_CODE_ONLY_DEPLOY.md), PR #63–#70 og GitHub Actions. Der dokumentene er eldre enn implementasjonen, gjelder siste testet kode og denne mer konservative klassifikasjonen.

## 1. Hva vi faktisk har gjennomført og forbedret

| Område | Kvalitet | Verifisert forbedring / grense |
| --- | :---: | --- |
| Designsystem, tema, mobilnavigasjon, Settings | B | Felles shell, Theme Studio, responsiv semester-rad, reelle Chrome-tester; systematisk tilgjengelighet, mobil-drag, kontrast og small-screen-polish gjenstår |
| Kursoversikt S1–S5 | B | Same-origin NTNU-indeksleser + originale filbaner, ingen kopiering til GitHub, sikker filtrering; **ikke prøvd i ekte NTNU V2** |
| Filbrowser, søk, nested stier | B | ViewerShell, kode/Python/Office/PDF, tryggere import og Chrome-regresjon; må testes på hundrevis av ekte filer, store mapper og æøå |
| Quiz fra NTNU | B | Støtte for V1 text/options/answer[] og multiple, bilder og stabilt valgt antall (PR #69). Live NTNU quiz og leaderboard gjenstår |
| Python/Jupyter code viewer | B | Pyodide Worker, syntax/edit/run/reset, notebook/cell, plot/eksport. Automatisk discovery av sibling imports, stdin-dialoger og bred pakkeparitet mangler |
| PDF, CSV, HTML, tekst, video, LaTeX | B | Egne adaptere med funksjonelle browser-smokes; avanserte formater og store ekte filer trenger egen matrise |
| Office (DOCX/XLSX/PPTX) | B | Lokal OOXML-preview, Excel/formeltester; ikke full Microsoft Office-layout, makroer, animasjon eller eldre binære Office-filer |
| STL/3MF/OBJ/GLB/F3Z, modellscene | B | 3D-viewport, grupper, CAD import, alignment, clipping, måling, waterline; store modeller, geometri-validering og realfiler mangler |
| Fusion lokalt uten APS | B | Fusion-skriptinstallasjon, ZIP med STEP + masse/volum/CG/treghet, browser-parser og Pages build. Må kjøres i en **ekte** Fusion-installasjon på sammensatt modell |
| Autodesk Hub (APS) | D | Kryptert server-OAuth ble implementert/deployert, men appnøkler, ekte OAuth-samtykke og refresh-tester ikke konfigurert. Ikke kritisk for lokal CAD |
| KISSsoft Z012/Z014, planetary | B | Omfattende parser/visualisering og representative regresjoner, men ikke sertifisert girgeometri/last- eller styrkeberegner. Krever ekte .Z012RS og KISSsoft-sammenligning |
| Hydrostatikk, GZ og opplasting | B | Numeriske referansemodeller, hard mesh-preflight, worker, SAC, moonpools, flere analytiske tester. Reell skrogkvalifisering, kompleks overlapping og profesjonell kontroll gjenstår |
| FEM/fordelt last, oppdrift | B | Interaktiv 3D FELT og lastfordeling; er ikke automatisk komplett koblet skips- og bølge-FEM uten fysisk referanse; kontroll av ulike lasttilfeller kreves |
| CoolProp | A for kjerne / B for UX | Lokal WASM med ekte numeriske regressjoner, Air/Water/Ammonia-referanser, batch/prosess/diagrammer. UI og andre fluids/referansepunkter trenger videre verifisering |
| Fluidkalkulator, periodesystem, krystaller, ChemDraw | A/B | Dokumentert funksjonsparitet i TOOL_PARITY + enhet/Chrome-tester; kjemiredigering fra tredjepart, UI og import/eksport må kvalitetssikres mot V1 |
| Bølger/RAO | B | Visualisering, GZ/waterline og importert kompleks respons. Ikke bølgediffraksjon/RAO-solver; tydelig merk semantikken |
| Tema-/bildefarger/kontrast | B | Theme Studio med Settings som eier, bilde-ekstraksjon/lagring. Visuell konsistens og kontrast-/tastaturmatrise mangler |
| Diverses: LAOS, AndreKokSider, LeseRavnen | B | Native eller godkjent ekstern lenke. Må sjekke lenkehelse, mobil og data; LeseRavnen holdes separat |
| Dykkerkart og dykkelogg | B/C | Kart, lokale funksjoner og konto-/kryptert Drive-adapter finnes, men geo/verifikasjon og faktisk Drive-synk/to enheter mangler |
| Brygging, RAPT, logg og lager | C | Lokal råvareadministrasjon og legacy innbygging; API, hydrometerhistorikk, sikker serveradgang og end-to-end dataparitet mangler |
| MedisinTimer | B/C | Timer, lokal historikk, AES-256-GCM-kryptert backup og manuell Drive-synk. **Ikke** atombeskyttet konkurrerende writes eller fullfysiske varsler på mobil; sensitiv reell enhetstest kreves |
| FolkNet/Supabase Auth & skyinnstillinger | B/D | Email/PW-klient, RLS, privat bucket, opt-in appearance backup; reell konto/RLS 2 brukere og Google-identitetskobling ikke bevist |
| Google-konto/Drive på tvers av moduler | D | Egne klientlag og hensyn til scopes. Produksjons-OAuth, 2 kontoer × 2 enheter, token-fornyelse og konflikter utestet |
| Portefølje, CV, About, Contact | B | Data-drevet, ekte dykkecomputer-feste, ryddet ut demo. Endelig innholds-/kontaktkorrektur, mobil og LinkedIn-ekstern data mangler |
| GA4 og personvern | B/D | Eksisterende measurement-ID og consent UI; ekte GA4 Realtime, privat dashboard-tilgang og samtykkekontroll må testes |
| SiteUpdater | B | Metadata-only, målrettet semester/kurs, snapshot, sikker restore og tester; oppdatering av **NTNUs eksisterende** `semestre/N/index.json` utenfor repo må eiergodkjennes og prøves |
| Deploy og rollback | A i simulerte tester / D på webedit | Windows one-command, kodepakke, SHA-256 og recovery, testet uten V1-skade; real montert webedit og `v2-staging` er ikke prøvd |
| Sikkerhet | B | Privat backend/RLS, static guard, begrensede protokoller, kryptert private filer, origin pinning. CSP, secret rotasjon, auth isolasjon og avhengighetsrevisjon mangler |

**Viktig:** Ingen rad betyr at hele nettsiden er «perfekt». En A gjelder konkrete målte bruksområder innenfor oppgitte begrensninger. En grønn CI er ikke dokumentasjon av ekte tjenesteintegrasjon.

## Status på faktiske offentlige NTNU-indekser (lest 12.10.2026)

Indeksene `/semestre/{1..5}/index.json` ble lest som **metadata, uten å
hente ned kursfilene**. De angir 24 offentlige fagemner og 478 oppførte
ressurser. Beskyttede kataloger skal utelates fra denne opptellingen.

| Semester | Offentlige fag | Oppførte filer | Filer i dypere mapper | Viktigste filformater |
| --- | ---: | ---: | ---: | --- |
| 1 | 3 | 59 | 0 | 39 IPYNB, 14 PDF |
| 2 | 5 | 49 | 0 | 36 PDF, 8 PY |
| 3 | 6 | 207 | 35 | 134 PDF, 50 PY |
| 4 | 5 | 133 | 32 | 90 PDF, 22 PY |
| 5 | 5 | 30 | 0 | 14 PY, 9 PDF |
| **Sum** | **24** | **478** | **67** | PDF, Python og notebook dominerer |

Tallene er fra offentlige **indeksoppføringer**, ikke fra en HTTP-`HEAD`
eller opplastings-/innholdstest for hver fil. De beviser ikke at alle
lenkene faktisk virker. Et eget `scripts/audit_ntnu_catalog.mjs --live`
kan brukes til å gjenta en metadata-basert, ikke-destruktiv analyse av
støttede viewer-typer (når PR for verktøyet er merget). Ingen private
filbaner skal vises i rapportutskriften.

**Prioritetskonsekvens:** test `.ipynb` intensivt i S1, PY og nested imports
i S3/S4, PDF-zoom og avanserte presentasjoner fra S2–S4 og faktiske
CAD-/KISSsoft-filer separat. Ikke anta at Pages-previewens syntetiske
kurs speiler formatfordelingen.

## 2. Hva som ikke er helt bra ennå

### P0 — funksjonell korrekthet og data (før mer visuelt arbeid)

1. **Ekte NTNU-ressurser.** Katalogen leser indekser, men vi trenger en scriptdrevet *metadata-only* audit av faktiske filnavn, mime/forventet viewer, tilgjengelighet og beskyttede kataloger, inkludert nested stier. Skjermbildet må vise delvis indekstilgang, ikke syntetiske ressurslister.
2. **Quiz og forelesningslister.** Alle faktiske NTNU-varianter må sjekkes: V1 single/multiple, random select, bilder, kapitler, lokale forsøk og video-/visningstilstand. Ingen leaderboard skrives mot V1 uten godkjent backend.
3. **Brygging.** Prognose ved null/stagnert SG i flere døgn må skille **ferdig**, **sannsynlig ferdig**, **stoppet for tidlig** og **utilstrekkelig data**; aldri bare legge `+N døgn` på siste datapunkt. Test stigende, fallende og sensorstøy. RAPT og oppskrifts-API separat.
4. **Private data.** Ekte to-enhets konfliktkontroll og restore for MedisinTimer og dykkelogg før en eventuell automatisk synk. Ikke gjett to brukeres datatilstand.
5. **Backend-autentisering.** Autodesk er valgfri; prioriter kun nettleser-/serverfunksjoner som ikke bryter uten Google/APS. Hold Google Drive og FolkNet ID adskilt inntil eksplisitt link-flow er verifisert.

### P1 — teknisk kvalitet og faglig troverdighet

6. **F3Z / STEP / KISSsoft.** Test et kjent CAD-kildegrunnlag og uavhengige SI-resultater, enhetsskala, tyngdepunkt og produkter av treghet. Vern mot at tessellering presenteres som eksakt B-rep eller at girvisning omtales som ISO 6336-analyse.
7. **Hydro og FEM.** Verifiser med minst to uavhengige skrog og analytisk benchmark; dokumenter open/non-manifold/overlap/målefeil, lastplassering over z og referanseretning.
8. **CoolProp og kjemi.** Matrisetest alle væskevalgene og bokreferanse-tabellene; diagramakser, zoom, labels og mobillayout; forbedre konsistensen mellom tools.
9. **Viewerperformance.** Enkelt drag/drop, fremdrift/kansellering og minnegrenser for 100+ MB, mange nestede mapper, annoterte PDF-er, flerark-regneark, store notatbøker.
10. **UI.** Lik typografi, knapper, feilmeldinger, tomtilstand, navigasjonsstruktur, mobilglidende semester-rad, tema, mørk/lys, kontrast og tastatur.

### P2 — eieravklaring, integrasjoner og polish

11. Kontroller CV/LinkedIn/kontakt, riktige bilder og verifiserte prosjekter.
12. Verifiser Analytics med reelt samtykke og skjerm den private rapporteringen.
13. Kartlegg om Matpris PHP/RAPT/Google kan gjenbruke **trygge, autentiserte, read-only** V1-endepunkter; ikke eksponer eller kopier gamle secrets.
14. Lag brukerrettet help/FAQ, sjekkliste for første besøk og en kort «hva støttes»-beskrivelse på hver kompleks verktøyside.
15. Sørg for gode tomtilstander og eksplisitte fallback-lenker ved manglende backend, ekstern video eller filformat.

## 3. Hva jeg anbefaler å bygge i hvilken rekkefølge

| Bølge | Fokus | Definition of Done | Blokkert på eier |
| --- | --- | --- | --- |
| 1 | Kritiske korrekthetsfeil, NTNU metadata-validering, quiz og gjæringsprognose | Tester mot ekte skjema/filer (uten private data), ingen stille korrupte resultater | Eventuelt eksempel med anonymiserte hydrometerdata |
| 2 | Viewer/filimport + mobil, søk, IA | Testmatrise med tom/ødelagt/stor/nestet fil og Chrome mobil | Ekte problemfiler fra NTNUs skjerm |
| 3 | Engineering: Fusion + KISSsoft + hydro/FEM + CoolProp | Numeriske referanser, UI-test, enhet/proveniens og tydelig unsupported-status | Faktisk Fusion/KISSsoft og uavhengig skrog |
| 4 | Brygging/Drive/MedisinTimer/dykking/Supabase | 2 kontoer × 2 enheter, recovery, konflikt og secret review | Godkjente kontoer og eier-API |
| 5 | Designpolish, universell utforming, innhold og analytics | 360–1440px, tastatur, kontrast, dark/light, WCAG-orientert smoke | Visuell eierkorrektur |
| 6 | Kun hvis klar: kodebasert staging og release | Go/no-go, reell webedit, backup/rollback, end-to-end privat ressursbeskyttelse | Lokal webedit-tilgang og senere eksplisitt produksjonsgodkjenning |

**Ingen tidsfrister blir brukt som begrunnelse for å hoppe over en funksjonstest.** Vi kan jobbe videre på V2 GitHub Pages preview mens NTNU V1 er urørt.

## 4. Hvilke nye ting vi faktisk trenger

**Nødvendig:** et oppdatert, én-kilde-til-sannhet-kvalitetsregister; egne tester på *realistiske* kildeskjema (ikke demo); en felles feil-/statuskontrakt for plugins; robust account-conflict recovery; målbar file-viewer performance; systematisk mobil-/tastatur-QA; testfiler og benchmarkforankrede SI-resultater.

**Ikke nødvendig nå:** kopiere 5 semestre til GitHub, Git LFS, APS-app for lokal Fusion-import, egen ny Supabase-instans, automatisk LinkedIn-skraping, tung mikrotjenestearkitektur eller et tidlig bytte av NTNU-forsiden.

## 5. Arbeidsregler

- Hver forbedring får **ett fil-/modulfokus per commit**, målrettede tester og bred CI før merge.
- Visuelt ferdig, teknisk implementert, integrasjonstestet og publisert er **fire forskjellige tilstander**.
- Ingen user-secrets i repo eller logg. Ingen automatisert skriving til NTNUs V1 eller semesterarkivet.
- Ved lengre arbeid oppdateres dette dokumentet med verifiserbar referanse (testfil, CI, PR, eventuell ekstern aksept) og faktiske åpne feil.
- Testene skal også oppdage når data er **utilstrekkelige**; «ukjent» er bedre enn falsk presisjon.
