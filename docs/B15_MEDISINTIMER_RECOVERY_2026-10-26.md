# B15 – MedisinTimer: lokal databevaring og varslingsgrenser (2026-10-26)

## Rettet feil

Tidligere ble feil under lesing av `localStorage` fanget, men erstattet med `newMedisinBackup()`. Siden ble dermed vist som tom. Neste lagring kunne skrive den tomme historikken tilbake over en uleselig original. Dette var en reell fare for uopprettelig lokalt datatap.

Nå sperres **alle ordinære skriveoperasjoner, import og sky-synkronisering** for den gjeldende profilen når en eksisterende backup ikke kan valideres. Originalteksten ligger urørt i `localStorage`. En tydelig feilmelding erstatter en misvisende «Ingen timere».

## Gjenoppretting

1. Trykk **Last ned original lokaltekst (ukryptert)**. Den eksporterer de opprinnelige lokalstorage-bytene som ren tekst, uten forsøk på parsingen. Filen kan inneholde sensitive personopplysninger og skal oppbevares privat.
2. Verifiser faktisk at den nedlastede filen kan åpnes og inneholder originaldataene. Det er **ikke** nok å se at nedlastingen ble startet.
3. Bare deretter kan **Start tom lokal profil etter sikkerhetskopi** brukes, og brukeren må eksplisitt godkjenne tilbakestillingen. Den aktive lokale profilnøkkelen nullstilles, ikke andre profiler eller eksisterende Drive-filer.
4. Når profilen er gjenopprettet, kan en separat gyldig lokal JSON-/kryptert backup importeres og kontrolleres manuelt. Ugyldige filer importeres aldri automatisk.

Kryptert Google Drive-synk beholder den eksisterende opt-in- og passfraseflyten. En korrupt lokal profil får ikke erstatte en eventuell kryptert skybackup. Ingen private MedisinTimer-opplysninger legges i Git eller logger.

## Varslinger og medisinske begrensninger

- **Ingen operativ alarmløsning:** MedisinTimer sender *ikke* varsel, push, e-post eller kalenderpåminnelse mens nettsiden er lukket. Dette gjelder også hvis nettsiden er installert som PWA.
- «Neste tidspunkt» er en utregning fra brukerens registrering og intervall, **ikke** en medisinsk anbefaling, verifisert legemiddelplan eller garanti for påminnelse.
- Forenklede nivåkurver har ikke klinisk modellvalidering og må ikke brukes som beslutningsgrunnlag for medisinering.
- Lokal lagring i nettleseren er **ukryptert**; den separate krypterte Drive-backupen krever eksplisitt samtykke og passfrase. Sikkerhetskopier er brukerens eget ansvar.

## Testing og gjenstående arbeid

`tests/browser/medisin-v2-smoke.html` verifiserer syntetiske, ikke-sensitive korrupte data i ekte Chrome, at opprinnelige råbytes ikke skrives over ved submit, at gjenoppretting krever eksport og eksplisitt bekreftelse, samt at ny lagring fungerer etter et kontrollert reset. Eksisterende E2EE/Google Drive-regresjoner kjører i samme test.

Dette er ikke en test av reelle medisinske data, nettleserens diskfeil, fysiske telefoner eller kollisjoner ved samtidig sky-synk på to enheter. Disse må fortsatt vurderes særskilt.
