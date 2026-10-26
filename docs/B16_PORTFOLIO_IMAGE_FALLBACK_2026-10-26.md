# B16 — Porteføljebilder ved nettverksfeil (26.10.2026)

## Problem

Prosjektkort og detaljgallerier viser bilder fra den eksisterende, offentlige Engineering Portfolio-adressen på NTNU. Filnavn og URL-allowlist er kontrollert i kildekoden, men at `<img src="...">` blir rendret er **ikke** et bevis på at den eksterne bildefilen svarer, at den er tilgjengelig på mobil, eller at den blir lastet inn.

Når nettverket, NTNU-webserveren eller en fil feiler, kunne nettleseren derfor vise et brutt bilde og la en gallerilenke til et ugyldig bilde bli stående.

## Endringen

- Bilder beholder de godkjente URL-ene, alternative tekstene og bildetekstene så lenge ressursen er tilgjengelig. Ingen nye bilder eller fakta er funnet på.
- En delegert `error`-lytter på `#app` reagerer på faktiske feil for `data-project-image="card|gallery"`. Prosjektkortet beholder sin navigerbare lenke og viser et alternativ med tekst; den ødelagte `img` fjernes.
- I et prosjektgalleri fjernes også lenken til bildet som ikke kunne lastes. En tekstforklaring vises i samme ramme, mens eksisterende bildetekst, prosjektbeskrivelse, rapport-/PDF-lenker og verktøy-lenker beholdes.
- Lytteren settes opp én gang og virker også etter navigering mellom portefølje og prosjekt-detalj. Eventer fanges i capture-fase fordi `img`-feil normalt ikke bobler.
- CSS holder fallback skjult ved normal bildelasting og gir en lesbar utforming på smale skjermer.

## Tester

`tests/portfolio-media.test.mjs` verifiserer korrekt semantisk HTML og det opprinnelige kildegrunnlaget.

`tests/browser/projects-gallery-smoke.html` tester automatisk feil (hvis nettverksbildet allerede feiler) eller utløser en syntetisk `error`-hendelse, og sjekker at brutt bilde og død lenke fjernes uten at prosjektlenke, bildetekst eller prosjekt-PDF forsvinner.

## Videre, manuell godkjenning

Dette er en **feiltoleranse-forbedring**, ikke dokumentasjon på at alle NTNU-bilder i porteføljen faktisk eksisterer i dag. De faktiske filene må verifiseres på godkjent NTNU-kilde, og eventuelle lokale kopier må først vurderes med tanke på opphavsrett og publiseringsrett. Ikke bruk generiske eller oppdiktede prosjektbilder som erstatning for dokumentasjon av det virkelige ingeniørarbeidet.

V1 og det historiske NTNU-porteføljearkivet er urørt.
