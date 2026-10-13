# Egendefinerte visningsnavn for NTNU-filer i FolkNettside V2

**Status:** Implementert som separat V2-frontendkonfigurasjon. De originale
NTNU-filene blir aldri flyttet, omdøpt eller kopiert for å endre tekst på siden.

## Enkel redigering fra nettsiden

Åpne **Courses → Tilpass navn på fag og filer**, eller naviger direkte til:

`https://tormt.github.io/FolkNettside-v2/src/courses/name-editor.html`

1. Velg semester og fag. Se originalt fagnavn og originale filnavn.
2. Legg inn nye navn på fag, seksjoner, undermapper eller enkeltfiler.
   Blank tekst betyr «bruk originalt navn». Søkefeltet filtrerer filer.
3. Klikk **Last ned felles navnefil (JSON)** eller **Kopier JSON**.
4. Åpne `config/ntnu-display-names.json` i V2-repositoriet på GitHub
   og erstatt innholdet med den eksporterte JSON-en. Commit til GitHub.
5. Pages publiseres deretter gjennom eksisterende `pages.yml`.
   Endringene blir synlige for alle besøkende etter publisering.

**Editoren har ingen GitHub skrivetilgang.** Den kan ikke endre globalt
innhold før du selv publiserer den eksporterte JSON-filen med riktig
GitHub-tilgang. Lokale redigeringer lagres ikke automatisk i skyen.
Dette forhindrer at en vilkårlig besøkende endrer navn for alle.

## Direkte redigering i GitHub

Konfigurasjonsfilen er `config/ntnu-display-names.json`.

```json
{
  "schemaVersion": 1,
  "courses": {
    "5/Marin-Dynamikk": {
      "title": "Marin dynamikk"
    }
  },
  "sections": {
    "5/Marin-Dynamikk/Øving3": "Øving 3"
  },
  "folders": {
    "4/marin-Hydro/filer/Øving3/oppgave2": "Oppgave 2"
  },
  "files": {
    "5/Marin-Dynamikk/filer/Øving3/const_avg_acc.py": "Konstant gjennomsnittsakselerasjon"
  }
}
```

Dette er bare visningsmetadata. Ressursidentiteten er alltid den opprinnelige
stien fra NTNUs indeks: `semester/eksakt-fagmappe/eksakt-relativ-filbane`,
inkludert store/små bokstaver og ÆØÅ.

## Hva som bevares

- Den faktiske NTNU-filbanen, URL-en og originalt filnavn.
- Filtype/viserverktøy (PDF, PY, Jupyter, quiz osv.).
- Ressursrekkefølgen brukt til intern navigasjon og lagret quizprogresjon.
- Den synlige originalen under nytt filnavn og ved omdøpte mapper/seksjoner.
- De 24 offentlige fagene fra semester 1–5; nye filer fra GitHub Actions
  får automatisk original visning med mindre en alias er definert.

Navn som ikke finnes i den aktuelle offentlige katalogen lager **ikke**
nytt fag eller ressurskort. Beskyttede filer kan ikke «navngis inn» i
katalogen via aliaser. Ugyldige konfigurasjoner brukes ikke, og V2 faller
tilbake til uendrede originale visningsnavn. Ingen sensitive filreferanser
skal legges i en offentlig alias-fil.

## Videre forbedringer

- Når Google/Folk-koblingen er verifisert kan personlige navnevalg lagres
  under brukerkontoen. Dagens konfigurasjon gjelder **alle besøkende**.
- Ved omflytting av originalfiler trengs en gjennomgått
  gammel-til-ny URL- og progresjonsmapping; navnealias er ikke en redirect.
- Redaksjonelle oppdateringer kan automatiseres via GitHub PR etter
  sikker autentisering, men ingen GitHub-token skal legges i nettleseren.
- Den timebaserte filskanningen fortsetter uavhengig av disse navnene.
  ChatGPT-vakt er ikke nødvendig for å oppdatere kurskatalogen; den
  eksisterende vaktoppgaven kan bare varsle om feil.
