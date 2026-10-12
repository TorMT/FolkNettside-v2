# Prioritert videreføring av FolkNettside V2 — 2026-10-12

**Nåværende fase: funksjonskvalitet og forbedringer; ikke utrulling.**
Vi fortsetter utvikling og reell fil-/UI-testing før vi tar stilling til
publisering om én–to måneder. NTNU V1 og kursarkivet forblir urørt.

Full kvalitet, evidens per modul og anbefalt rekkefølge er kartlagt i
[V2-kvalitetskartet](V2_QUALITY_ROADMAP_2026-10-12.md).

**Arbeidsrekkefølge:** (1) data-/resultatkorrekthet: NTNUs ekte filer,
quiz og gjæringsprognose; (2) nested viewere og mobil; (3) Fusion,
KISSsoft, Hydro/FEM og CoolProp numerikk; (4) valgfri ekstern
konto-/Drive-/RAPT-synk; (5) konsekvent UI/tilgjengelighet; (6) først
til slutt staging og produksjonskontroll.

**Evidensregel:** Bruk `implementert`, `CI-testet`, `Chrome-testet`,
`testet med ekte data` og `testet med ekstern konto` separat.
Aldri kall en integrasjon ferdig når bare mock eller eksempeldata virker.

Dette er arbeidslisten for V2 **preview**, ikke en erklæring om paritet med NTNUs live V1. Ikke flytt produksjonsadresser eller publiser beskyttede kursdata. Detaljerte produksjonsporter finnes i [paritetsregisteret](PRODUCTION_PARITY_GAP_REGISTER.md).

## P0 — dataintegritet, sikkerhet og kodepublisering
1. **Kurs:** Ingen kursfilmigrering til GitHub. V2 leser eksisterende NTNU `/semestre/<n>/index.json` og peker til originalfilene på samme server. Verifiser NTNU `v2-staging` og rettighetsfilteret i ekte nettleser. Ta separat backup av V1 før en eventuell senere erstatning av forsiden.
2. **Brewing:** Fullfør dataparitet for logger, hydrometre, oppskrifter og råvarebeholdning. Test faktisk RAPT/PHP-tjeneste med serverlagrede hemmeligheter og autorisasjon.
3. **Google-kontoer:** Verifiser OAuth på publisert origin, utlogging, tokenfornyelse, 2 kontoer og 2 enheter for Brewing og MedisinTimer. Dykkelogg trenger fortsatt egen korrekt skyadapter.
4. **MedisinTimer:** AES-256-GCM Drive-kryptering, frivillig aktivering, frakoblet kryptert eksport/import og snapshot-fingeravtrykk er implementert. Snapshot-sjekken er **ikke atomisk**; ekte samtidige skrivinger trenger revisjonsbasert compare-and-swap eller serverstyrt versjonering. Test passfrasetap og gjenoppretting på separate enheter.
5. **Integrasjoner:** Verifiser faktiske tilgjengelige API-er og flytt alle hemmeligheter til et egnet servermiljø. Ingen autentiserte server-API-er kan regnes som migrert bare fordi UI finnes.

## P1 — funksjonell videreføring
6. **Viewer:** Test store/skadde PDF/Office-arkiv, sammensatte 3MF/F3Z, nestede Python-importer og mobiloppsett med ekte dokumenter. Bevar gamle lenker for ikke-støttede arbeidsflyter.
7. **Engineering:** Local Fusion export → ZIP import is the primary CAD workflow without APS; the installer and Pages download are tested, but a real Fusion assembly is still an acceptance gate. Kvalifiser hydrostatikk mot en uavhengig modell; sikre mesh- og overlappskontroll; test fordelt last og lastplassering, høyde og enheter. Ikke fremstille konseptuell KISSsoft-/bølgevisning som styrke- eller RAO-løser.
8. **CoolProp:** Verifiser væskespesifikke tabeller, diagramkoordinater, dimensjoner og mobil UI mot referanseverdier og gamle brukstilfeller.
9. **SiteUpdater:** Behold indeksoppdatering mot de faktiske filene på NTNUs webedit-område; V2 leser eksisterende indeksfiler og har ikke behov for å reindeksere innhold via GitHub. Test valgt semester/kurs og full oppdatering uten å slette eldre data.
10. **Dykking:** Validér stedlisten, koordinater, sikkerhets-/dybdeklassifisering, kart og logg. Null/manglende koordinater skal aldri tolkes som (0,0).
11. **Portefølje/CV:** Kontroller LinkedIn, faktisk CV/karakterutskrift, About og kontaktinformasjon før offentlig publisering. LinkedIn auto-speiling skal ikke antas å finnes.

## P2 — lanseringskvalitet
12. Test tastaturnavigering, fokus, små skjermer, horisontale semesterfaner og alle Settings-styrte temaer.
13. Kontrollér samtykke og privat GA4-rapporttilgang, og at privat brukerdata ikke inngår i analysehendelser.
14. Fullfør security headers, avhengighetsrevisjon, backup/rollback, broken-link-rapport og en dokumentert go/no-go før eventuell produksjonsflytting.

## Verifikasjon
- En grønn CI bekrefter bare automatiserte testporter, **ikke** live Google/RAPT/Autodesk eller full V1-paritet.
- Alle konkrete endringer følges av enhetstest eller browser smoke-test der det er mulig.
- Ingen destruktiv migrering; bevar V1 og eksisterende Engineering Portfolio-URL.
