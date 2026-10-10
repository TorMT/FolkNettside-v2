# API-er, integrasjoner, konfigurasjon og hemmeligheter – migreringsregister

Dette dokumentet er en **operativ sjekkliste**, ikke et sted å lagre nøkler. Gjelder FolkNettside V2 på GitHub Pages og den eventuelle fremtidige NTNU-produksjonssiden.

**Grunnregel:** Et GitHub Pages-nettsted er offentlig JavaScript/HTML/CSS. **Alle strenger som skrives inn i en klientfil eller genereres inn i static build er offentlige**, også om repoet er privat. GitHub Actions secrets som injiseres i statisk publisert JS er derfor ikke hemmelige. Bruk en egen HTTPS-backend med secret manager for alle privilegerte operasjoner. Maskerte logger, minst mulig scopetilgang og rotasjon er nødvendige.

| Tjeneste | Klient / hvor i V2 | Offentlig verdi som kan ligge i statisk byggeoutput | Privat hemmelighet – aldri publiser | Status/godkjenning |
|---|---|---|---|---|
| **Google Analytics 4** | `index.html`, `src/platform/analytics.js` | **G-BJ41MZJP0L** – allerede konfigurert i V1 og V2 | Eventuelle Analytics Admin/API-tilgangstokens, service-konto for rapportering | Frontend/CI kontrollert; bekreft **GA4 Realtime** separat |
| **Google Identity Services** | `src/platform/google-session.js`, `data/google-auth.json` (offentlig konfig; ikke token) | Nettleser-OAuth **client ID**, eksakt origin, `drive.file` scope | OAuth **client secret**, refresh tokens, tjenestekonto | Trenger autoriserte origin og produksjonstest |
| **Google Drive** | Native Brewing/MedisinTimer og planlagt Dive Log | Ingen private verdier i manifest/URL | Drive-brukertoken, OAuth-legitimasjon, privat helse-/konto­data | 2 kontoer × 2 enheter + konflikttest; sensitive lagre krever ekstra tiltak |
| **Autodesk APS** | Fusion/CAD-visere, planlagt konverteringsadapter | Offentlig prosjekt-ID kun hvis godkjent å vise | `APS_CLIENT_SECRET`, backend access/refresh token, hemmelige callback-states | Native F3D-konvertering ikke klar uten autorisert backend |
| **Brewing** | `src/diverse/brewing-page.js`, `src/diverse/brewing/legacy/` | Offentlig endepunkt-URL for godkjent lesetilgang, aldri tilgangstoken i GET-param | Brewfather/RAPT/API-nøkler, brukertokens, server-DB, privat oppskrifts-/loggdata | PHP/RAPT-backend/innhold og ekte API-svar må migreres/testes |
| **RAPT/hydrometer** | V1 `includes/rapt/api/`, V2 Brewing adapter | Godkjent public endpoint (hvis dokumentert) | RAPT nøkkel, refresh token, privat hydrometermetadata | Endepunktets autentisering, datakvalitet og rate-limits åpne |
| **Quiz leaderboard** | V1 `Quiz/leaderboard.php`, V2 quizmodul | Offentlig scoreboard bare etter godkjenning | DB-tilgang, anti-spam/admin-tokens, privat forsøksdata | Backend-paritet må utredes og testes |
| **OpenRouter/AI metadata** | V1 `scripts/video_topic_enricher.py`, fremtidig admin-jobb | Modellnavn/metadata kun hvis lisensiert | `OPENROUTER_API_KEY` og andre AI-tjenestetokens | Server/privat arbeidsstasjon med kvoter, ingen frontend-secret |
| **GitHub Actions/Pages** | `.github/workflows/` | GitHub Pages URL, workflow-ID, kildekode | `GH_TOKEN`/PAT, deploynøkler, private secret environments | Secrets per miljø, beskyttede deploymiljøer; aldri logg verdiene |
| **NTNU webedit/folk** | Fremtidig cutover | Offentlig URL og tillatt filinnhold | NTNU brukernavn/passord, SMB sesjonsbilletter, private backupkopier | Sikker lokal deploy, test og rollback kreves |
| **MedisinTimer** | V2 `src/diverse/medisin-*` | Generisk offentlig programkode | Persondata, medisinhistorikk, private JSON-data, refresh tokens | Personvern, lagringsisolasjon, eventuell E2E-kryptering og sletting krever kontroll |

## Klientkonfigurasjon – offentlige identifikatorer

1. **Analytics:** `G-BJ41MZJP0L` er offentlig GA4-måle-ID. Ingen Admin-credential på siden. V1 og V2 samler i samme GA4-property, men V2 rapporterer `site_version=v2` og course code fra et **godkjent, offentlig kursmanifest**.
2. **Google OAuth:** registrer autorisert origin `https://tormt.github.io` for test, og produksjonsorigin separat når bestemt. Google kan kreve eget tillatt redirect-URI avhengig av OAuth-flow. Bruk vanlig Google Identity Services token flow for nettleser. Nettleser-`clientId` er offentlig; `clientSecret` er privat. Den gjeldende V2-sessionkoden forventer `window.__FOLK_GOOGLE_AUTH_CONFIG__` eller et lokalt offentlig `data/google-auth.json`; fyll **bare** den godkjente browser client ID og scopes. Kjør `signed-out`, `signin`, token refresh, Drive-access, signout og to-konto-isolasjon på live preview.
3. **API-backend:** definer HTTPS-origin og nødvendige REST-kontrakter på **serveren**, ikke inne i kodefiler under `assets/` eller `src/`. CORS må begrenses til kjente origins. Alle skrivende kall krever autorisasjon, inputvalidering, logging uten hemmeligheter og skadebegrensning.
4. **Autodesk:** bruk autorisert `data:read`-scope der det er tilstrekkelig; native geometry-oversettelse/derivatives krever riktig prosjekt-/tilgangsmodell. Dokumenter eier og kostnadsgrenser for konvertering.
5. **Eventuelle AI-API-er:** kjør som offline/admin pipeline. En server som bare videresender et åpent API-nøkkel-kall uten autentisering er **ikke** et trygt alternativ.

## Hvor skal secrets legges?

| Miljø | Tillatt plassering |
|---|---|
| Lokal utvikling | `.env.local` eller lokal OS credential store **utenfor Git**, med `.gitignore` og eierbegrenset tilgang |
| Server-side preview | Serverplattformens encrypted environment secret store (per preview/prod miljø) |
| GitHub Actions som kaller server | GitHub Actions Secrets/Environments, aldri i byggartefakter, `printenv` eller debug |
| Klientfil i GitHub Pages | **Ingen** private secrets; bare validerte public config-ID-er |
| Backup av original NTNU-produksjon | Kryptert ekstern disk, ikke delte Cloud/GitHub-kursfiler |

**Ikke kopier nøkler ukritisk fra V1.** Finn først ut om de fortsatt er gyldige, hvilke scopes de har og hvilken konto de tilhører. Rotér og utsted per miljø ved behov. Hvis en privat verdi ved uhell ligger i Git-historikken, anta kompromittering, **rotér verdien** og gjennomfør separat hendelseshåndtering; det er ikke tilstrekkelig å slette den fra siste commit.

## Egen releasecheck per integrasjon

- [ ] Eier, system, lovlig datagrunnlag, nettleser-origin og backend-origin dokumentert.
- [ ] Kildeversjon/API-kontrakt og maskering av feil/hemmelige logger testet.
- [ ] **To testkontoer:** bekreft at bruker A aldri kan hente eller påvirke dataene til bruker B.
- [ ] **To enheter:** test samtidig oppdatering, konfliktløsning, eksport/import og sletting.
- [ ] Feilscenario: refresh-token utløpt, 401/403/404/429/500, offline, nettverkstap og kansellering.
- [ ] Secret oppbevares i riktig miljø; rotering tilbakekaller gamle verdier uten å miste data.
- [ ] Det finnes dokumentert kostnad/rate-limit og overvåking.
- [ ] Sletting/rollback av deploy etterlater ikke uønsket offentlig fil eller aktiv tilgang.

## Analytics per fag – rapportoppsett

V2 sender et manuelt `page_view`-event med **`course_code`** og **`course_semester`** når brukeren besøker en kursoversikt eller filvisning, men **kun** dersom semester+fagkode finnes i det offentlige `data/content-manifest.json` som V2 faktisk har lastet. Filnavn, ressursnummer, visningsinnhold, søkeord og individuelle studentopplysninger sendes ikke. `site_version=v2` og `site_area=courses` skiller trafikken fra V1.

For å se fagbruk i Analytics:

1. Logg inn som eier på <https://analytics.google.com/analytics/web/> i samme GA4-property som V1.
2. Gå til **Admin → Custom definitions → Create custom dimension** og opprett event-scoped dimensions for parameterne `course_code`, `course_semester` og `site_version` (eventuelt `site_area`).
3. Besøk et **offentlig** testfag i V2 med godkjent analytics-måling og bekreft at eventene vises i **Realtime** / **DebugView**. Rapporter kan ta tid å oppdatere.
4. Åpne **Explore → Free form**. Filtrer `site_version = v2` og `event_name = page_view`. Sett **Rows = course_code**, gjerne `course_semester` som sekundær dimensjon, og **Values = Event count** / **Views**. Se hvilke fag som får mest bruk.
5. Ikke publiser denne rapporten som offentlig Looker-iframe; tilgang gis bare gjennom GA4/eierkonto eller eksplisitt autorisert privat dashboard.
6. Ikke tolk få besøk som et pedagogisk kvalitetsmål alene. Sammenlign trends med ressursantall, semesterperiode og anonym, frivillig tilbakemelding.

**Begrensninger:** Preload av Google Tag før samtykke gjør en tredjepartsforespørsel og kan ha personvernim­plikasjoner; måling skjer etter nåværende V2-samtykke. Eier må gjennomgå lovlig behandlingsgrunnlag og faktisk nettverkstrafikk i sin jurisdiksjon. Live GA4-mottak og custom dimensions må bekreftes via kontoen; CI bekrefter bare implementasjonen.

### Google OAuth frontend-isolasjon (2026-10-10)

V2 leser nå kun `window.__FOLK_GOOGLE_AUTH_CONFIG__` eller V2s egne
`data/google-auth.json` (begge kun med en **offentlig browser client ID**).
Den henter ikke konfigurasjon fra V1 `/includes/brewing/api/storage.php`
selv om staging kjøres på `folk.ntnu.no`. Tillatte Google OAuth scopes er
begrenset til `openid email profile drive.file`. Utlogging under en pågående
innloggingsforespørsel avbryter den, slik at et sent svar ikke kan logge inn
brukeren etterpå. Produksjonsgodkjenning krever fortsatt reell test med to
Google-kontoer og to enheter.
