# Lokal lagring og kryptert Google Drive-synk i FolkNettside V2

**Status 2026-10-10:** Kodet og automatisert testet i V2-preview. Faktiske OAuth-/Drive-tillatelser, delt mappe og to samtidige enheter er **ikke** produksjonsverifisert. V1 og NTNU-kursinnhold er ikke endret.

## Dataskille og tilgang

| Modul | Lokal lagring | Drive-kopi | Innhold som gjenstår |
|---|---|---|---|
| MedisinTimer | Eksisterende v2 schema 1, partisjonert per Google-`sub` | Egen AES-256-GCM-kryptert `.enc.json` per konto | Legacy peptide-/FARE-funksjoner; atomisk konfliktløsning og to-enhetstest |
| Brygging → Raw materials | Versionert inventar med ID/oppdatering/tombstone; per konto eller gjest | Kryptert `brew-inventory`-vault per konto | Originale RAPT/PHP-logger, oppskrifter og serverlager er **ikke** det samme som dette inventaret |
| Dykkekart → Min dykkelogg | Ny personlig logg med dato/dybde/varighet/notater, per konto eller gjest | Kryptert `dive-log`-vault per konto | Tidligere private dykkerlogger fra V1 migreres ikke automatisk; offentlige GeoJSON-steder endres ikke |

Alle modulene bruker `src/platform/google-session.js` og scope `drive.file` (Google Identity Services). Det er ingen ekstra innloggingsflyt, passfrase eller hemmelighet i kildekoden. Passfrasen lever kun i aktiv faneminne og slettes ved profilskifte, avkobling eller navigasjon.

## Oppstart og gjenoppretting

1. Åpne **Innstillinger → Connections** og logg på ønsket Google-konto. Bekreft hvilken konto som er aktiv.
2. Gå til relevant modul, eventuelt oppgi Google Drive-mappe-ID (blankt betyr Min disk), og bruk en unik, sterk passfrase for den modulen.
3. Aktiver kryptert synk eksplisitt. Modulen leser/dekrypterer eventuell eksisterende fil, validerer schema, slår sammen registreringer og laster opp kryptert versjon når noe er endret.
4. Ta gjerne en **kryptert offline eksport** fra hver modul og oppbevar passfrasen separat. Uten passfrase kan ikke filen åpnes; vi har ingen sentral gjenopprettingsnøkkel.
5. På en annen enhet: samme Google-konto, samme mappe-ID og den samme modul-passfrasen. Logg inn, lås opp og synk. Kontrollér dataene før den første enheten brukes igjen.

**Gjest vs konto:** Gjesteregistreringer holdes separat fra en innlogget Google-kontos lokale lagring. Det skjer ingen automatisk kopiering av privat gjestedata. Eksporter som JSON, bytt til riktig konto og importer manuelt ved behov. Brygging støtter import av eldre schema 1. MedisinTimer beholder egen import og gamle ukrypterte Drive-filer helt urørt.

## Sikkerhets-/konfliktgrenser

- Drive får kun kryptert JSON for **disse tre modulbackupene**. Den eldre Brygging-loggsynkroniseringen er en **annen** mekanisme og må fortsatt vurderes mot live backend.
- AES-256-GCM, PBKDF2-HMAC-SHA-256 (310 000 iterasjoner), unik tilfeldig salt og IV per opplasting, og formålsbundet autentisert header/AAD. Google kan fremdeles se filnavn, størrelse, plassering, tilgangsrettigheter og endringstid.
- Lokal `localStorage` og eksportert *vanlig JSON* er **ikke kryptert**. Delte Google Drive-mapper gjør ikke automatisk disse kopiene private.
- Konflikter per post løses etter `updatedAt`; slettinger lagres som tombstones. Samme post redigert på to enheter er **last-write-wins** (ikke feltbasert sammenslåing).
- Før overwriting kontrolleres et SHA-256-fingeravtrykk av eksakt nedlastet kryptert fil. Dette oppdager mange utdaterte økter, men er **ikke atomisk compare-and-swap**. Endringer mellom siste lesing og PATCH kan fortsatt kollidere.
- To samtidige nyopprettelser kan gi flere matchingfiler; klienten stopper da uten automatisk å velge én. Dette er tilsiktet sikrere enn blind overskriving.
- Slette- eller skrivetilgang til en delt mappe lar andre slette/skifte ut krypterte filer selv om de ikke kjenner passfrasen. Hold medisindata i egen, tilgangsbegrenset mappe.
- Ingen medisinske råd, doseanbefaling eller påminnelsesgaranti er implisert av synkroniseringen.

## Manuell godkjenning før «ferdig»

- [ ] Test Chrome/Firefox/Safari på faktisk GitHub Pages-origin med autentisert Google-konto og `drive.file`.
- [ ] Test to enheter: opprett på A, synk på B; rediger ulike poster, synk begge retninger.
- [ ] Test samme post og samtidig opplasting. Verifiser eksplisitt feil/ingen taus overskriving; dersom full samtidig skrivesikkerhet kreves, bygg en transaksjonell backend.
- [ ] Test delt mappe og valgt mappe, ugyldig mappe-ID, manglende skrivetilgang, utløpt OAuth-token, kontoendring under synk.
- [ ] Test feil passfrase, korrumpert/kopiert kryptert fil, offline nettverk, kvote, duplikatfiler og manglende fil.
- [ ] Test eksport/import og gjenoppretting på en helt tom nettleserprofil.
- [ ] Test at V1, publisert kursmateriale og andre kontoers lokale data ikke endres.

## Relevante moduler/tester

- `src/platform/account-vault-sync.js` — formåls- og kontoseparert kryptert Drive-adapter
- `src/diverse/brewing/inventory-model.js`, `inventory.js` — migrering, lokalbeholdning og kryptert sky
- `src/diverse/dive-log-model.js`, `dive-log.js`, `dive-map.js` — privat logg på offentlig kartside
- `src/platform/medisin-vault.js`, `medisin-encrypted-drive.js` — separat MedisinTimer-kryptering
- `tests/account-vault-sync.test.mjs`, `tests/personal-vault-data.test.mjs` + eksisterende kryptering-/browser-smokes

Eksisterende `docs/PRODUCTION_PARITY_GAP_REGISTER.md` er fortsatt overordnet for V1/V2-paritet; denne filen dokumenterer bare nyere data-/synkfunksjoner.
