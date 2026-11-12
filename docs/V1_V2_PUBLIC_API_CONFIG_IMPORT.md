# V1 → V2: API-nøkler og offentlig Google-konfigurasjon

**Kilde:** `https://tormt.folk.ntnu.no/` (fryst V1). **Mål:** `TorMT/FolkNettside-v2`.
V1-produksjon, NTNU-filene og Engineering Portfolio skal ikke endres.

## Hva kan faktisk gjenbrukes?

| V1-plassering | Navn | Sikker flyt mot V2 |
| --- | --- | --- |
| `includes/brewing/api/storage.php` (GET) | `googleDriveAuth.clientId` | **Offentlig browser client ID** kan leses, valideres og legges i V2 `data/google-auth.json` |
| `course-template.html`/GA4 | GA4 measurement ID | Er allerede brukt av V2; dette er en offentlig ID, ikke API-secret |
| Serverens `secrets/brewing-apis.local.json` eller miljøvariabler | `BREWFATHER_API_KEY`, `BREWFATHER_USER_ID`, `CATALOG_BEER_API_KEY` | **Server → server** etter autentisering, aldri i HTML/JS, importskript eller Github Pages |
| Serverens `secrets/rapt.local.json` eller miljøvariabler | `RAPT_USERNAME`, `RAPT_API_SECRET` | Kun autentisert serveradapter med hastighetsbegrensning og minste privilegium |
| Serverens `secrets/aps.local.json` eller miljøvariabler | `APS_CLIENT_ID`, `APS_CLIENT_SECRET` | APS klienthemmelighet i backend; V2 Hub bruker i tillegg egen 3-legged OAuth/brukersamtykke |
| Lokal `.env.local` / OS credential store | `OPENROUTER_API_KEY` | Lokale/admin-jobber eller autorisert backend, aldri Pages-klient |
| `KASSALAPP_API_KEY` dersom konfigurert på NTNU-serveren | Kassalapp-nøkkel | V2 `server/matpris.php` leser fra servermiljøet, ikke fra V1-nettsidens offentlige HTML |

**At V1 kan bruke en nøkkel, betyr ikke at dens verdi finnes i GitHub eller kan leses over nettet.** Servergenererte tokens, API-tilganger og rå konfigurasjonsfiler er ikke offentlige data. Ikke prøv å hente `/secrets/`-filer med HTTP. Er de HTTP-tilgjengelige må tilgangen stenges og nøklene roteres.

## Engangsimport av offentlig Google browser ID

V1s `storage.php` publiserer en eksplisitt offentlig `googleDriveAuth`-seksjon. Bare `clientId` kopieres. Skriptet avviser omdirigering, ugyldig ID, ikke-JSON, oversize-svar og feil vert/sti. Importen er **aldri automatisk ved besøk på V2**.

Kjør fra en lokal V2-checkout:

```bash
python3 scripts/import_legacy_public_google_config.py
python3 scripts/import_legacy_public_google_config.py --write
python3 -m unittest discover -s tests -p 'test_legacy_public_google_import.py' -v
```

Første kjøring er read-only. `--write` oppretter **kun hvis filen mangler**
`data/google-auth.json`, med en offentlig Google browser client ID. Den endrer aldri V1 og erstatter aldri tidligere V2-konfigurasjon. Hvis NTNU returnerer 403/404/HTML, er utilgjengelig fra maskinen din, eller har slått av Google-konfigurasjonen, stopper importen uten å skrive noe.

Deretter må eier bekrefte at Google Cloud OAuth-appen tillater riktig
**Authorized JavaScript origin** for V2 (`https://tormt.github.io` for GitHub Pages, og eventuelt separat NTNU-origin). V2 bruker kun `openid email profile drive.file`. Test faktisk pålogging, utlogging, og to kontoer; konfigurasjonen alene gir ikke Drive-tilgang.

## Andre API-er: neste sikre trinn

1. Få **autorisert server-/webedit-tilgang**, ikke en offentlig nettleser-URL til hemmeligheter. På serveren, kartlegg *bare tilstedeværelse* av nøklene i filene/miljøvariablene oppført ovenfor. Ikke skriv verdiene i logger, PR-er, chat eller terminalutskrifter.
2. Velg V2-backend (for eksempel private Supabase Edge secrets, eller separat beskyttet NTNU PHP-staging). Sett nødvendige hemmeligheter der via tjenestens egen sikrede secret-innstilling. Om mulig, bruk nye nøkkelsett per miljø i stedet for å flytte V1s produksjonsnøkler.
3. Tilknytt kun de V2-endepunktene som har uavhengig autentisering og autorisasjon. Ikke aktiver V1s ubeskyttede GET-ruter direkte mot GitHub Pages. Respekter `data/service-endpoints.json` sine disabled defaults og V2s origin-isolasjon.
4. Test med ekte kontoer, uten å eksponere hemmeligheter: 401/403, rate limits, separat brukertilgang, token refresh og serverrespons. Ikke erklær noen integrasjon operativ før dette er verifisert.

**Verifiseringsstatus 2026-10-26:** Script og isolerte tester er lagt til. Live respons fra `tormt.folk.ntnu.no/includes/brewing/api/storage.php` kunne ikke hentes fra denne økten. Ingen ekte nøkler er hentet eller installert, og ingen produksjonsendring er utført. V1s OAuth-origin og faktiske API-tilganger må fortsatt valideres fra et autorisert miljø.
