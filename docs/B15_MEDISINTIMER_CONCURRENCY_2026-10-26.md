# B15 – MedisinTimer samtidige faner og Drive-konflikt (26.10.2026)

## Hva ble rettet

Den opprinnelige V2-koden skrev en utdatert `backup` fra sin egen fane direkte til `localStorage`. Hvis en annen fane hadde skrevet nye registreringer etter at den første fanen ble åpnet, kunne historikken i den andre fanen bli skjult/overskrevet.

Nå validerer og **sammenslår hver lokal lagring mot sist eksisterende, gyldige JSON på disk** (`reconcileMedisinLocalWrite`). Sammenslåing er per immutable ID og `updatedAt`, med tombstones for slettinger. Dette gjelder også lokal lagring av nedlastede Drive-data. Den faktisk sammenslåtte lokale backupen er den som sendes videre til kryptert Drive-opplasting, ikke en eldre kopi av datasettet.

Nettleserens `storage`-hendelse oppdaterer den andre åpne fanens visning når et annet nettleserkontekst endrer samme profil. Hvis lokal historikk blir ugyldig under en ny lagring, videreføres tidligere fail-closed-beskyttelse og skriving stoppes. Hvis den lokale profilnøkkelen har blitt fjernet eksternt etter at fanen lastet den, stopper neste skriving fremfor å gjenopprette slettede data fra en gammel fane.

## Testmatrise

- Syntetiske faner A/B starter med hver sin tomme tilstand, lagrer oppføringer etter tur og ender med begge registreringene.
- Et tombstonet element i den oppdaterte profilen forblir slettet selv når en utdatert fane oppretter nye elementer.
- Invalid JSON og ekstern fjerning av tidligere eksisterende `localStorage` avvises før skriving.
- Ekte Chrome kjører to samtidig monterte MedisinTimer-visninger med stalet state og simulerer en annen fanes `storage`-melding.
- Ved kryptert Drive-backup kontrolleres en syntetisk konflikt: klient B leser revisjon V1, klient A endrer den krypterte filen til V2, og B får avvist forsøket på å overskrive ut fra foreldet V1. Ingen PATCH skal sendes når revisjonskontrollen avdekker forskjellen. AES-GCM, passfrase og opt-in-regresjonen kjører samtidig.

Kjørekommandoer: `node --test tests/medisin-local-race.test.mjs` og eksisterende Chrome CI-test `tests/browser/medisin-v2-smoke.html`.

## Viktig grense: ikke atomisk multi-enhetslås

Denne rettelsen beskytter **sekvensielle** lagringer fra faner med utdatert state og kjente Drive-revisjonskonflikter. Den er **ikke** en ekte transaksjon eller sammenlign-og-bytt (CAS) på Google Drive. Adapteren bruker før-opplasting SHA-256-revisjonssammenligning, men en annen enhet kan fortsatt skrive etter kontrollen og før PATCH eller to enheter kan opprette hver sin fil samtidig. Lagringer fra to nettleserfaner kan også teoretisk interleaves akkurat mellom lokal lesing og lokal `setItem`. Google Drive v3-dokumentasjonen verifiserer ikke her noen pålitelig atomisk If-Match-garanti for denne kombinasjonen av opplastingsmetode og rettigheter.

**Bruksråd:** Ikke bruk flere enheter til å endre samme medisinhistorikk samtidig. La kryptert synkronisering fullføres, og ta private krypterte sikkerhetskopier. Konfliktfeil betyr at du må synkronisere på nytt, ikke forsøke blind overskriving. En servermediert transaksjon/revisjonslogg og ekte to-enheters Google Drive-test kreves før fullt samtidighetssikker synk kan loves.

## Personvern og sikkerhet

Kun syntetiske timerdata og passfrase brukes i tester. Ingen faktisk medisinhistorikk, Google-konto, token eller hemmelig nøkkel er lagt i kode, dokumentasjon eller GitHub. V1 er urørt.
