# Produksjonsmigrering V1 → V2 – komplett og reverserbar prosedyre

**Status:** Planlagt sluttfase, **ikke autorisasjon til å migrere**. Sist gjennomgått 10.10.2026.
**Eier:** FolkNettside.
**Prinsipp:** Ingen sletting, overskriving eller omdirigering av fungerende V1 før faktisk funksjonsparitet og dataparitet er godkjent. Den eksisterende NTNU-nettsiden og Engineering Portfolio som brukes i søknader må bevares; tidligere avtalt overgangsport er tidligst 01.01.2027 og forutsetter separat, eksplisitt godkjenning.

Dette er arbeidsinstruksen for når V2 består samtlige porter. Ikke gjennomfør produksjonsdelen automatisk fordi CI er grønn. Dokumenter **hvilken versjon, kilde, test, person og dato** som begrunner hver godkjenning.

## 0. Kontroller forutsetninger – STOP hvis ett punkt feiler

- [ ] Gjeldende V1-kilde og publisert NTNU webedit/folk-rot er kjent og lesbar, inkludert kurs, skjulte mapper, PHP-endepunkter og originale `index.json`.
- [ ] Full kilde- og funksjonsinventarliste er oppdatert i [gap-registeret](PRODUCTION_PARITY_GAP_REGISTER.md) – både brukerflater, serverfunksjoner og eksisterende data.
- [ ] Kartleggingen av privat/offentlig/rettighetsbeskyttet materiale er signert. «Kan åpnes fra V1» betyr **ikke** automatisk «kan republiseres offentlig på GitHub».
- [ ] Alle eksterne tjenester (Google, APS, Brewing, RAPT, eventuelle AI-providere) er konfigurert i **staging** og verifisert i ekte innlogget nettleser.
- [ ] V2 har en staging-URL som ikke overtar gammel URL, DNS eller redirects.
- [ ] V1 Git-historikk og komplett NTNU webedit-produksjonsområde kan gjenopprettes fra **minst to uavhengige** sikkerhetskopier, hvor minst én er offline/kryptert.
- [ ] Eier har gjennomgått 110 %-kriteriene i trinn 7, inklusive mobil, feilmoduser, data og rollback.
- [ ] Gjeldende produksjons- og porteføljeadresse er skrevet ned og bevart.

## 1. Frys kilder og ta første komplette backup – før filflytting

### 1.1 Backup av Git-repositoriene med historikk

På en lokal PC (Windows PowerShell, Git installert), velg en **ikke-offentlig backupmappe**, f.eks. en kryptert ekstern disk. Disse kommandoene skal ikke kjøres inne i GitHub Pages-publiseringsmappen:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = "D:\FolkNettside-Backups\$stamp"
New-Item -ItemType Directory -Force $backup | Out-Null

git clone --mirror https://github.com/TorMT/FolkNettside.git "$backup\FolkNettside-v1.git"
git -C "$backup\FolkNettside-v1.git" bundle create "$backup\FolkNettside-v1-all.bundle" --all
git clone --mirror https://github.com/TorMT/FolkNettside-v2.git "$backup\FolkNettside-v2.git"
git -C "$backup\FolkNettside-v2.git" bundle create "$backup\FolkNettside-v2-all.bundle" --all

git -C "$backup\FolkNettside-v1.git" fsck --full
git -C "$backup\FolkNettside-v2.git" fsck --full
Get-FileHash "$backup\FolkNettside-v1-all.bundle" -Algorithm SHA256
Get-FileHash "$backup\FolkNettside-v2-all.bundle" -Algorithm SHA256
```

Opprett også en **immutabel Git tag** i eksisterende V1 hvis du har eksplisitt godkjent dette; ellers bruk mirror/bundle uten å mutere originalen. Noter den eksakte commit-SHA fra hver `main` og lagre backupens hashes i en separat, privat migreringsjournal. En Git-klone inkluderer ikke nødvendigvis Git LFS-filer, løse webedit-filer, serverdata, hemmeligheter eller kjørende API-er: disse må håndteres separat.

### 1.2 Backup av hele NTNU produksjonsområdet

**Kritisk:** Repoet `TorMT/FolkNettside` inneholder ikke `semestre/` i det observerte Git-treet. Nettverkets **faktiske publiserte katalog** må derfor backupes i tillegg. Koble til NTNUs webedit-share via offisiell veiledning og **verifiser den eksakte mappen** som inneholder `index.html`, `semestre/`, `includes/`, `Tools/` og `diverse/`. Ikke anta at roten heter `public_html`, og ikke kopier brukerens hele hjemmekatalog til en offentlig plass.

Når du har montert og verifisert kildekatalogen på f.eks. `W:\<verifisert-nettsiderot>`, kopier **kun fra original → kryptert backup**:

```powershell
$source = "W:\<VERIFISERT-V1-NETTSIDEROT>"
$dest = "$backup\ntnu-webedit-v1"
Test-Path "$source\index.html"
Test-Path "$source\semestre"
robocopy "$source" "$dest" /E /COPY:DAT /DCOPY:DAT /R:2 /W:3 /XJ /LOG:"$backup\webedit-copy.log"
$copyCode = $LASTEXITCODE
if ($copyCode -ge 8) { throw "NTNU backup feilet: robocopy exit $copyCode" }
```

Bruk **ikke** `/MIR`, `/PURGE` eller andre synkroniseringsflagg som sletter filer. `/E` bevarer alle undermapper, også tomme mapper. Backupen kan inneholde medisinsk informasjon, legitimasjonstokens og private skolefiler: **krypter backupdisken**, begrens tilgangen og ikke push backupen til GitHub.

### 1.3 Inventar, integritet og gjenopprettingstest

- Lag en liste over alle filer, relative stier, byte-størrelser og SHA-256 for V1 produksjonskopien. Ved svært store filer må beregningen kjøres som en separat offlinejobb, ikke i SiteUpdater.
- Sammenlign antall filer, totalstørrelse, de viktigste original-PDF-ene og flere tilfeldige SHA-256-digester mellom live kilde og backup.
- Ta egen sikret eksport av eventuell database/API-historikk (quiz leaderboard, hydrometre, Brewing oppskrifter/logg, eldre data). Ikke stol på at filer i Git er fullstendige.
- Test faktisk gjenoppretting av minst én fil, en hel kursmappe og en Git-ref fra bundle/mirror i en **ny midlertidig mappe**.
- Lag et «før»-skjermbilde av forsiden, navbar, hvert fag og viktige verktøy, både mobil og desktop.
- Lagre backup-versjon, hashes, godkjent kildekatalog, tidspunkt og ansvarlig i **privat** journal.

**Ingen V2-kopi eller deploy før den fullstendige backupen er verifisert.**

## 2. Klassifiser filer – ikke kopier direkte til offentlig V2

Arbeid på en **separat lokal staging-kopi av backupen**. Merk hver fil/mappetre med én av følgende klassifiseringer:

| Klasse | Eksempler | Mål |
|---|---|---|
| OFFENTLIG-GODKJENT | Eget, delbart notat, PDF, egen kode, bilder du har rett til å publisere | V2 `site-content/` |
| EKSTERN-LENKE | Canvas/kildeverktøy, forelesningsvideo/YouTube som ikke skal speiles | `course.json` med HTTPS-lenke og provider |
| KONTO-BESKYTTET | Private skolefiler, lisensmateriale som krever innlogging, private studentressurser | Autentisert server/backendlager, **aldri** GitHub Pages |
| PERSONLIG/SENSITIVT | MedisinTimer, dykkerlogg med private notater, API-data/brukertokens | Kryptert eller pålitelig private kontolager, **aldri** public build |
| HEMMELIGHET | API secret, `.env`, refresh token, privat nøkkel, OAuth-client-secret, Google service-account JSON | Dedikert secret manager (ikke i HTML, JavaScript, GitHub Pages eller kursfiler) |
| SYSTEM/GENERERT | `__pycache__`, `.bak`, IDE-filer, caches, gamle duplikate byggeoutput | Behold i backup; migrer ikke med mindre beviselig nødvendig |

V1 kan ha eldre passordbeskyttede sider og PHP-endepunkter; slike data må forbli privat lagret. «Ikke linket» er ikke tilgangskontroll på statisk GitHub Pages. Kjør tilgjengelig sekret-/innholdskontroll, og gjør **manuell** filinnholdsklassifisering før publisering.

## 3. Organiser den V2-godkjente offentlige kurskopien

Anbefalt fysisk struktur under V2-repoet:

```text
FolkNettside-v2/
  site-content/
    semesters/
      1/
        TMA4100/
          course.json
          Forelesninger/
          Ovinger/
          Kok/
          Modeller/
          Eksamen/
      5/
        TMR4182/
          course.json
          Forelesninger/
          Ovinger/
          Kok/
            Underkatalog/
          Modeller/
      6/
        TMR4XXX/
          course.json
  data/
    content-manifest.json
  scripts/
    update_site.py
```

Dette er en **forslått** organisering, ikke en ordre om å omdøpe alle gamle filer. Behold opprinnelige filnavn/relative baner der det er viktig for interne lenker, videoer eller formler. Semester og fagkode må verifiseres mot V1, ikke gjettes ut fra navn. Bruk helst den faktiske, eksisterende studieplanen for periodisering og kategorisering.

Kildekartleggingen har allerede funnet [24 offentlige V1-faglenker](PUBLIC_V1_COURSE_INVENTORY_2026-10-10.md). De originale mappene har navn som `marin-intro`, `Fluid` og `Marin-Dynamikk`, ikke nødvendigvis en offisiell fagkode. Start med `data/migration-course-map.example.json`: fyll ut `v2CourseCode` og sett `reviewed: true` kun etter at hver kode og semester er kontrollert mot V1. Lag eventuelt en egen gjennomgått `data/migration-course-map.json` (uten private data), og kjør inventarskriptet med `--mapping`. `needs-mapping` er en stopper, ikke et tomt fag som kan hoppes over.

En minimal `course.json` i hvert offentlig fag kan være:

```json
{
  "code": "TMR4182",
  "title": "Verifisert fagtittel fra originalside",
  "description": "Kort offentlig beskrivelse",
  "tags": ["Marin teknikk"],
  "sectionOrder": ["Forelesninger", "Ovinger", "Kok", "Modeller", "Eksamen"],
  "externalResources": [
    {
      "provider": "youtube",
      "section": "Forelesninger",
      "label": "Offentlig forelesning",
      "url": "https://www.youtube.com/watch?v=EXAMPLE",
      "kind": "YOUTUBE"
    }
  ]
}
```

Dette er **eksempelverdier**; ikke publiser `EXAMPLE`-lenken som ekte undervisningsinnhold. Bruk redigerte, verifiserte URL-er. Dersom den gamle siden bruker `Filer og ressurser`, `filer`, `Forelesning.json`, `index.json` eller quiz-bilder, bevar funksjonelle relasjoner gjennom en eksplisitt mappingliste. Oppgi `source`, gammel sti, ny sti, ressurs-type, public/private og SHA-256.

### Import én semester-/kursenhet om gangen

Fra roten av V2:

```bash
python scripts/update_site.py --source site-content/semesters --dry-run --semester 5 --course TMR4182
python scripts/update_site.py --source site-content/semesters --semester 5 --course TMR4182
python scripts/validate_content.py
python scripts/audit_public_assets.py
```

Gjenta for hvert fag i backupens verifiserte liste, og vis at `resources[]` peker på eksisterende filer. Slå opp i `scripts/update_site.py` for nøyaktige parametre; **ikke** bruk SiteUpdater3.py direkte i V2, da den gamle oppdatereren bygger en annen indeksstruktur.

**Viktig build-felle:** Den nåværende `.github/workflows/pages.yml` kjører `python scripts/update_site.py` **uten `--source`**, som bruker `examples/semesters` som standard. Før vi endrer `data/content-manifest.json` til ekte kursmateriale må workflow og lokal standardkilde endres, testes og låses til `site-content/semesters`. Ellers kan publisering erstatte faktisk kursmanifest med eksempelkurset. Dette er en produksjonsblokkerer inntil løst.

## 4. Read-only paritetsrapport fra ekte sikkerhetskopi

Med en lokal backup og side-ved-side V2-klone:

```bash
python scripts/audit_migration_readiness.py --legacy-repo ../FolkNettside --legacy-site /path/to/ntnu-webedit-v1 --v2-root . --mapping data/migration-course-map.json --out migration-audit.json
```

For Windows PowerShell kan du bruke fullstendige, siterte Windows-stier:

```powershell
python scripts/audit_migration_readiness.py --legacy-repo "D:\Repos\FolkNettside" --legacy-site "$backup\ntnu-webedit-v1" --v2-root "." --out "$backup\migration-audit.json"
```

Skriptet sammenligner per kurs med filnavn og byte-størrelse, ignorerer beskyttede filer og **fører opp alle manglende offentlige filer**, men kopierer eller sletter ingenting. Det kan ikke bevise likt byteinnhold eller applikasjonsparitet; suppler med SHA-256 mot kopier du har lov til å publisere. En manglende kildekatalog gir **STOP**, ikke «tom katalog = godkjent».

Fortsett å oppdatere [gap-registeret](PRODUCTION_PARITY_GAP_REGISTER.md). Ikke merk et fag `PASS` bare fordi alle filene finnes: åpne videoer, modeller, bilder, quiz og Office-dokumenter gjennom V2-viewerne.

## 5. Portering og verifikasjon av tjenester, secrets og brukertilstand

Sjekk [`INTEGRATION_CONFIGURATION_REGISTER.md`](INTEGRATION_CONFIGURATION_REGISTER.md) rad for rad. **Ingen private nøkler skal kopieres fra V1-repoet inn i V2.** Bakenden og sikkerhetskopiene holdes private, klienten får bare offentlige ID-er og kortlivede autoriserte tokens.

- Google Analytics: offentlig måle-ID fra gammel side; se trafikk per `course_code` og `course_semester`, og skill V2 med `site_version=v2`. Kontrollér mottak i GA4 Realtime og egendefinerte dimensjoner.
- Google Identity Services: offentlig OAuth **client ID** for V2 preview/produksjons-origin; konfigurer eksakte authorized JavaScript origins. Ingen client secret i GitHub Pages.
- Drive sync: lagre og les med `drive.file` per konto, test 2 kontoer/2 enheter og konflikter. Helseopplysninger krever særlig vurdering/evt. klientkryptering før produksjon.
- Autodesk APS/Fusion: server-side `APS_CLIENT_SECRET` og token-endepunkt; test lese-/konverteringsrettigheter, rate limits, CORS og tilgang til originale filer.
- Brewing/RAPT: V1 PHP API-er kan **ikke** kjøre i statisk GitHub Pages. Sett opp autentisert HTTPS-backend eller godkjent erstatning, migrer historisk data med egen backup og kontinuitet.
- Quiz leaderboard: test opprettelse, lagring og visning i serverlaget – ikke erstatt globalt leaderboard med lokal browserhistorikk uten eksplisitt godkjenning.
- Åpne AI/OpenRouter, planlagte filberikere og lokale scripts: kjør kun betrodde administrative backends/offline jobber, ikke med API-nøkkel i nettleser.

For hver integrasjon registreres `status` = `UNCONFIGURED`, `STAGING_VERIFIED`, `PRODUCTION_VERIFIED` eller `NOT_APPLICABLE_APPROVED`. **En test som bare ser at konfigurasjonsnøkkelen finnes, er ikke en bestått live end-to-end-test.**

## 6. 1:1 funksjonstesting – minst like godt som V1

Bruk `docs/PRODUCTION_PARITY_GAP_REGISTER.md`, `docs/TOOL_PARITY.md`, `docs/VIEWER_MIGRATION_MATRIX.md` og `docs/MIGRATION_MATRIX.md` som startpunkt, men behold **én tydelig godkjenningsrad per faktisk funksjon**:

```text
ID | V1 URL/funksjon | Kilde-/versjons-SHA | V2 URL/funksjon |
V1 forventet input/output | V2 resultat/avvik | Desktop | Mobil |
Konto/privat/offline | Test/CI/eksempeldata | Status | Godkjent av/dato
```

Test minst: alle semester-/faglenker, globalt søk, breadcrumb, ressursmapper, Office/PDF/TEX/notebook/video, quiz, resume, Karakterweb, SiteUpdater, CAD/Fusion/SpaceMouse, KISSsoft med egne filer, Hydro/Structure/CoolProp, Brewing, MedisinTimer, dykking, LAOS/AndreKok, CV, tema/innstillinger, login/logout, analytics per fag, nettleserhistorikk, mobil, skjermleser/tastatur, dårlig nett, timeout, ugyldige filer og feilretting.

**110 %-kriterium:** Hvert V1-kritiske bruksområde skal ha like mange eller flere fungerende funksjoner i V2, uten datatap, sikkerhetsregresjon, dårligere brukbarhet eller ødelagte lenker. Nye Engineering-funksjoner kompenserer **ikke** for manglende quiz/backend eller skoleinnhold.

## 7. Teknisk release gate og staging

1. Frys feature-branch og dokumenter SHA.
2. Kjør `npm test`, `python scripts/validate_content.py`,
   `python scripts/audit_public_assets.py`,
   `python scripts/update_site.py --source site-content/semesters --check`, alle aktuelle Python-unittester og nettleser-/WASM- og hydrokontroller.
3. Kjør den read-only NTNU/V2-filsammenligningen og kontroller at **alle offentlige kildefiler er dekket og SHA-256 verifisert**. Uavklarte filnavn, duplikat eller lisensrettigheter er STOP.
4. Verifiser backend, Google-innlogging, API-secrets og konto-/brukerisolasjon **med egne, autoriserte testkontoer**.
5. Test faktiske originale ZIP/STEP/F3D/KISSsoft/Office-filer og utvalgte store kursvideoer.
6. Publiser først **staging**. Sjekk hard refresh, cache av CSS/JS/WASM, localhost kontra GitHub Pages, CORS, CSP, nettleserhistorikk og 404.
7. Kjør side-by-side mot V1, og marker alle rader `PASS` eller **bevisst signert** `WAIVED`. Alle `UNKNOWN` og `FAIL` er STOP.
8. Logg komplett V1-backup-lokasjon, V2 staged commit, deployment-ID og reverseringsprosedyre.
9. Be om **egen go/no-go-godkjenning fra eier**, med eksplisitt produksjonsdato og vedlikeholdsvindu.

## 8. Kontrollert cutover – først etter GO

- Foretrekk en ny katalog/staging-lenke og en atomisk bytteoperasjon fremfor å overskrive produksjonen mens den er i bruk. På NTNU kan faktisk deploy-metode avvike; verifiser lokal publiseringsprosess før bruk.
- Hold gammel produksjonskopi **lesbar, intakt og isolert** under et datert arkiv som **ikke** blir utilsiktet offentlig tilgjengelig.
- Deploy bare offentlig-godkjent V2-build til riktig mål. **Ikke** kopier `secrets/`, `.env*`, private kurs, logger eller hele Git working tree til folk/Pages.
- Bytt lenker/redirects **ett kontrollert steg om gangen**, og mål at de gamle kurs-URL-ene fortsatt fungerer eller har dokumentert redirect. Behold originale filnavn eller en mappet redirect, særlig for delte studentlenker.
- Sjekk forsiden, minimum ett fag i hvert semester, minst én fil av hvert format, CV/Engineering Portfolio, Google login, mobile, Browser console, API-er og kurs-Analytics.
- Overvåk feil/404/5xx og eksterne tjenester i det avtalte observasjonsvinduet. Ikke fjern eldre kode/data i denne perioden.

## 9. Rollback – klar før produksjonsbyttet

Definer på forhånd konkrete kommandoer for akkurat NTNUs publiseringsmål og autentisering, **men ikke kjør eller test dem mot live data uten godkjenning**:

1. STOPP nye publiseringer og backendskrivinger.
2. Sett tilbake den tidligere, verifiserte **publiserte V1-kopien** fra backup/snapshot til samme mål – uten å overskrive de private backend-dataene som har endret seg etter cutover.
3. Gjenopprett original URL-routing/redirects/lenker og cache.
4. Restore server-state fra egen databasebackup bare dersom det er trygt å unngå tap av nye data; dokumenter konfliktene.
5. Test alle kritiske V1-funksjoner og eksterne søknadslenker, og registrer faktisk rollback-resultat.
6. Behold feilende V2-build for analyse; **ikke** fortsett automatisk forsøksmigrering i produksjon.

## 10. Etter overgang

- Arkiver V1 Git mirror, full produksjonskopi og siste V1-sidekart i minst den perioden eier bestemmer.
- Oppretthold GitHub som den autoriserte kilden for **ny kode og offentlig innhold**; unngå toveis synk med NTNU som skaper konflikter.
- Bruk V2s Content Manifest/SiteUpdater ved fremtidig semesterimport, og samme kvalitetsporter.
- Kontroller GA4 `course_code` for å prioritere fag som brukes mest, uten individuelle student-/filnavn.
- Etter dokumentert stabil drift: gjennomgå gamle duplikater og planlegg separat, godkjent opprydding. Ikke slett backups som en del av cutover.

**Oppsummering:** Per 10.10.2026 mangler dokumentert fullstendig V1 webedit-kursbackup og faktisk end-to-end API-paritet. Dette dokumentet skal derfor brukes til trygg forberedelse, ikke som argument for å endre originalen nå.
