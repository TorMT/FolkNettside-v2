# GitHub Pages som V2, NTNU som fillager — automatisk indeks

**Status:** Utviklingsfunksjon, 13.10.2026. V1 og NTNUs index.html er uendret.

## Arkitektur

NTNUs offentlige fagemapper har Apache directory listing. I stedet for å
kjøre et script på montert webedit, bruker vi GitHub Actions:

1. Hver time (cron 17 * * * *) leser crawleren bare offentlige
   semesterindekser og kataloglistinger under eksplisitt godkjente fag.
2. Den oppdager nye filnavn i filer/ og quiz/, inkludert nestede mapper,
   uten å laste ned filenes innhold.
3. GitHub Actions lagrer bare URL-referanser i
   data/ntnu-autocatalog.json og lager commit kun hvis noe har endret seg.
4. Workflowen utløser eksplisitt Pages-publisering. Et commit fra
   GITHUB_TOKEN starter ikke en vanlig push-workflow automatisk.
5. GitHub Pages leser den nye katalogen, mens NTNU fortsatt lagrer alt.

Kilder til kontroll: config/ntnu-public-courses.json er en gjennomgått
liste over 24 offentlig deklarerte fag. Hver kjøring kontrollerer på nytt
at fag er markert beskyttet:false. Den følger ingen private mapper,
symbolske lenker eller tredjepartsdomener og nekter å erstatte katalogen
ved utilgjengelige mapper eller uforklarlige større filreduksjoner.

**Ved nye filer i et godkjent offentlig fag:** Bare legg filen i
filer/ eller quiz/. Ingen manuell indeksredigering er nødvendig.
**Ved nytt fag:** Legg det til i den gjennomgåtte tillatelseslisten
etter at fagets publisering er godkjent.

Kjøringen kan startes manuelt fra GitHub Actions →
hourly-ntnu-public-course-index → Run workflow. GitHub Actions cron
er omtrent hver time, ikke garantert på eksakt klokkeslett.

## CORS — kontroll før root-redirect

GitHub Pages på tormt.github.io og NTNU på tormt.folk.ntnu.no er
ulike origins. En crawl fra GitHub Actions beviser at HTML-listingen er
offentlig, men **ikke** at JavaScript på Pages har lov til å hente
Python, notebook, quiz, Office og CAD-filer i nettleseren.

- Direkte lenker og nedlasting virker uten CORS.
- PDF-iframe og nettleserens egen medieavspilling kan fungere uten
  at JS leser filene.
- Interaktive visere som bruker fetch trenger en gyldig
  Access-Control-Allow-Origin-tillatelse på offentlige NTNU-responser.
- Vi må teste CORS i ekte browser og eventuelt sette opp en
  avgrenset Apache .htaccess-regel for offentlige filer på NTNU,
  **uten** Credentials og **aldri** på private fag.
- Hvis CORS ikke tillates, er alternativet V2-app på NTNU (samme
  origin) kombinert med GitHub Actions som indekserer eksternt.

En redirect fra NTNUs index.html løser ikke CORS. Klargjort
redirect-utkast kan legges under deployment/ i repo, men får ikke
erstatte V1 før fullstendig tilgangs-, lenke- og viewer-test,
backup og egen godkjenning. Eksisterende direkte semester-URL-er
skal fortsette å fungere.

## Feilhåndtering

Uklar offentlig/private-status, manglede directory listing,
HTTP-redirect, ukjent domene, dårlige JSON-data eller større
uforklart tap av filer skal stoppe oppdateringen og beholde sist
fungerende katalog. Ingen filinnhold eller sensitive felter lastes
opp til GitHub. Supabase fortsetter separat med Folk-kontoer og
progresjon; ingen ChatGPT-oppgave trenger å gjøre Git-commits.
