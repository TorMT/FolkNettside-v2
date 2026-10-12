# V1 → V2: dokumentert funksjonsparitet og åpne gap

**Status:** 2026-10-10. Dette er et arbeidsregister, **ikke en godkjenning av produksjonsmigrering**. Basert på de to GitHub-repoenes `main`-trær, V2-testene og de eksisterende migreringsmatrisene. En tilgjengelig kildekodefil eller bestått isolert test beviser ikke at live NTNU-funksjonalitet, brukerdata og API-er er likeverdige.

**Avgjørende funn:** `TorMT/FolkNettside` har ingen `semestre/`-mappe i GitHub-treet som ble undersøkt. V1 beskriver kursfiler på NTNU webedit/folk; dette produksjonsområdet er ikke omfattet av repository-inventaret. V2 har per nå `data/content-manifest.json` med **ett syntetisk/eksempelbasert kurs: semester 5 / TMR4182**. Ingen kursmigrering kan erklæres komplett før en faktisk, godkjent webedit-backup foreligger og er sammenlignet.

**Ny offentlig V1-verifikasjon:** `https://tormt.folk.ntnu.no/includes/navbar.html` oppgir **24 kurslenker** fordelt på semester 1–5; den offentlige `/semestre/index.json` viser også enkelte mapper med navneledd `(beskyttet)`. Et NAVBAR-mappenavn er ikke nødvendigvis en faktisk NTNU-emnekode. Se [detaljert V1-kursinventar](PUBLIC_V1_COURSE_INVENTORY_2026-10-10.md) og [mapping-forslag](../data/migration-course-map.example.json). Ikke overfør slike beskyttede ressurser til offentlige V2.


**NTNU-hosting avklart på dokumentasjonsnivå:** Folk-sidene kjører Apache med `.htaccess` og offisielt dokumentert NTNU LDAP/htpasswd-katalogbeskyttelse. En separat, ikke-publisert kandidatbygging kan nå opprettes med `scripts/build_ntnu_staging.py`. **Dette beviser ikke at PHP-moduler, miljøvariabler, disk­kvote, RAPT/APS, autentisering i praksis eller full dataflyt virker.** Se [NTNU hosting-planen](NTNU_FOLK_HOSTING.md). Opprinnelige V1-filer og V1-URL-er forblir urørt.

## Betydning av kolonnene

- **Dekning:** `CI-dekning` = implementasjon med automatiserte tester, men fortsatt krav om sammenligning med live V1; `delvis` = et kjent funksjonelt gap; `ikke bevist` = ikke nok evidens; `ekstern` = separat tjeneste/lenke beholdes; `mangler data` = live kilde ikke tilgjengelig.
- **Produksjonsport:** Må lukkes og dokumenteres **før** V1 tas ned/omdirigeres.
- Alle funksjoner som ikke er dokumentert som fullt erstattet, skal ha fungerende V1-lenke eller godkjent ekstern erstatning inntil cutover.

| Nr. | Funksjon/kilde i V1 | V2 / kilde | Dekning | Gjenstående produksjonsport |
|---:|---|---|---|---|
| 01 | NTNUs `semestre/<semester>/<kurs>/filer` og indekser | `site-content/semesters` + `data/content-manifest.json` | **mangler data** | Ta komplett produksjonsbackup, fil-/størrelses-/hashinventar, verifiser alle fag og alle offentlige ressurser, nested struktur |
| 02 | `SiteUpdater3.py` (recursive `index.json`, valg av velkomstbilde, quiz-bilder) | `scripts/update_site.py` (manifest, målrettede oppdateringer, dry-run) | delvis | Kartlegg forskjeller, verifiser målrettet oppdatering av faktisk kursmateriale, behold bruker- og bilde­metadata |
| 03 | `navbarupdater.py`, HTML-maler, sidebars, globalt søk | V2 shell, semesterkort, course navigation, search | CI-dekning | Side-for-side navigasjons- og lenkeaudit på ekte semesterkatalog |
| 04 | Studiequiz, navigasjon, forsøk, `Quiz/leaderboard.php` | Quiz/kapitteløvinger og lokal progresjon | delvis | Verifiser bildebaner, quizinnhold, persistens og eventuell **serverbasert leaderboard** |
| 05 | `Forelesning.txt`/`Forelesning.json`, videolister, tema-/AI-beriking | Video-/YouTube-viewere og lokal videoprogresjon | delvis | Kontroller formattering, undertekst/metadata, `video_topic_enricher.py`, YouTube API og alle gamle lenker |
| 06 | PDF, tekst, kode, LaTeX, HTML, CSV, notebook | ViewerShell-formatadaptere | CI-dekning | Ekte, store og skadede kildefiler, mobil, print/download, låst/innfelt viewer |
| 07 | Word, Excel, PowerPoint (Office) | V2 OOXML-adaptere | CI-dekning | Sammenlign faktisk formatering/ark/formler/kompleksitet; gamle binære Office-formater separat |
| 08 | STL/3MF/modeller/hydro | ModelScene/CAD/Hydro | CI-dekning | Verifiser ekte geometri, koordinatsystem, flater, mesh, enheter og SpaceMouse fysisk |
| 09 | Fusion-/F3D-/F3Z-/APS-visere, native konvertering | V2 F3Z-inspeksjon + lokale Fusion-script ZIP-installer, STEP/IGES WASM, Fusion API-masse/treghet fra eksportert bundle | delvis | Verifiser script i faktisk Fusion og import av ekte sammenstilling; native F3D-konvertering og valgfri APS Hub er fortsatt separate og ikke konfigurert |
| 10 | KISSsoft | V2 ringgir/pinjong, Z012RS, planet, helix | CI-dekning/prototype | Test med egne originalfiler, kontaktgeometri og relevante girvarianter; beregnet styrke fra KISSsoft må ikke erstattes av 3D-skissen |
| 11 | CoolProp og fluid calculator | V2 WASM + Engineering Tools | CI-dekning | Ekte kursoppgaver og flyttall/referanseverdier mot V1; UI mobil |
| 12 | ChemDraw, krystall, periodisk tabell | V2 Chemicals/Tools | CI-dekning | Ekte arbeidsflyter, lagring/eksport, klipp/lim og mobil sammenligning |
| 13 | `Tools/theme-creator.html`, `Tools/image-to-theme.html` | Settings / Theme Studio | CI-dekning | Migrer eventuelle brukerspesifikke lagrede tema uten å endre V1 |
| 14 | `Tools/stlview1.html` og `includes/three/*` | V2 model inspector/CAD, alignment, måling og clipping | CI-dekning | Sammenlign alle legacy knapper med egne modeller; spesialfunksjoner må dokumenteres |
| 15 | Brewing, RAPT, hydrometre, oppskrifter, historiske logger | Native Brewing + enkelte legacy JS-moduler | **delvis** | PHP API-backend, autorisasjon, datamigrering, live hydrometre og konfliktkontroll |
| 16 | Google Drive-synk, innlogging | Felles Google-session og `drive.file` | delvis | Public OAuth-klient-ID, origins, refresh, signed-in/signed-out, to kontoer/to enheter |
| 17 | MedisinTimer (separat datakilde) | V2 native timer, lokalhistorikk/kryptert Drive | delvis | AES-GCM-Drive og offline-kryptert eksport er implementert; test ekte konto, samtidige oppdateringer, lokal databeskyttelse og gamle skjermer/varsler |
| 18 | Dykkerkart/dykkelogg | V2 dykkerkart + ny personlig logg | delvis | Lokal, kryptert konto-Drive-synk og eksport er implementert; eldre loggimport og ekte konto-/Drive-verifisering gjenstår |
| 19 | LAOS og AndreKokSider | Native LAOS + lenkekatalog | CI-dekning | Drift av eksterne lenker, arkivkildefiler og fremtidige oppdateringer |
| 20 | LeseRavnen | Ekstern GitHub Pages-lenke | ekstern | Sikre at eksisterende demo og datainnsamling forblir uendret |
| 21 | Prosjektportefølje/CV/LinkedIn | V2 dynamisk CV og profil | CI-dekning | Manuell korrektur, faktasjekk, lenker, SEO og låst Engineering Portfolio-URL |
| 22 | Google Analytics/Looker Studio | Samme GA4 ID, V2 private reporting | delvis | GA4 Realtime, fagdimensjon, samtykke/personvern, ingen offentlig Looker-embed |
| 23 | `includes/aps/api/*`, `includes/brewing/api/*`, `includes/rapt/api/*` | Uavklart backend eller serviceadapter | **ikke migrert som backend** | Velg serverplattform, secrets store, service health checks, autentisering |
| 24 | V1 PHP leaderboard | Ingen bevist tilsvarende serverlagring | ikke bevist | Sammenlign brukstilfeller, implementer/avtal serveralternativ |
| 25 | V1 eksport-/webedit-deploy | V2 GitHub Pages preview | **ikke produksjonsflyttet** | Ta backup av live webedit, eksakt pathsjekk, cutover/redirects/rollback |
| 26 | V1 GitHub-historikk | V2 egen repo-historikk | to forskjellige kilder | Arkiver V1 som full Git mirror/bundle, aldri rewrite eller slett |
| 27 | V1 offentlige/private kursfiler og leserettigheter | V2 GitHub Pages public-by-default | **kritisk gap** | Klassifiser offentlig vs beskyttet. Private filer aldri i public build, også ved utilgjengelige lenker |
| 28 | Lokal lagring av kurs-/video-/quizprogresjon | V2 egne klientlagre | delvis | Eksport/oversettelse av eksisterende data; unngå stille tap |
| 29 | APS/OpenRouter, server API-tokens og integrasjoner | V2 statisk klient + manglende backend | **kritisk gap** | Secret manager, least privilege, CORS, miljøer og live funksjonell verifikasjon |
| 30 | Bølgeteori/3D-fartøyrespons | V2 visualisering og kompleks 6-DOF RAO-import | V2 utvidet | Import er ikke RAO-solver; krever eksternt beregnede data og verifiserte referansesystem |

## Foreløpig konklusjon

**Ikke full funksjonsparitet.** Minst kursmigreringen, PHP/RAPT/Brewing, Autodesk native F3D, OAuth livekontoer, visse video-/studieautomatiseringer, leaderboard og private data må utredes eller ferdigstilles. Gamle statiske ressursvisere og flere Engineering Tools har solide automatiserte tester, men trenger side-ved-side med faktiske V1-filer.

**Enheten som må godkjennes er et brukertilfelle, ikke bare en menyknapp.** For hvert punkt: kilde-URL og skjermbilde, inputfiler, forventet resultat, datalagring, feilsituasjoner, mobil/desktop, konto/offline, personvern, testlenke og godkjenner. Marker `PASS`, `FAIL`, `WAIVED` (eksplisitt samtykke) eller `UNKNOWN`. `UNKNOWN` er blokkering, ikke godkjent.

Den maskinlesbare, read-only sammenligningen ligger i [`scripts/audit_migration_readiness.py`](../scripts/audit_migration_readiness.py). Den kan ikke erstatte manuell verifikasjon av tjenester og innhold. Komplett trinn-for-trinn-plan finnes i [`PRODUCTION_MIGRATION_PLAYBOOK.md`](PRODUCTION_MIGRATION_PLAYBOOK.md).
