// Readable Norwegian message for a failed NTNU preview. Only the HTTP status
// is read from the error; the message itself is never shown, so filenames,
// URLs or query tokens in it cannot reach the page.
export function remoteViewerErrorMessage(error){
  const detail=String(error?.message||error||"").slice(0,240);
  if(/\bHTTP (?:404|410)\b/.test(detail))
    return "Filen ble ikke funnet på NTNU. Katalogen kan være utdatert eller filen flyttet. Prøv originaladressen.";
  if(/\bHTTP (?:401|403)\b/.test(detail))
    return "NTNU krever tilgang til denne filen. V2 omgår aldri adgangskontroll. Åpne originalen og logg inn hvis du har tilgang.";
  return "Forhåndsvisning på GitHub Pages kan være blokkert av NTNUs CORS-regler. Originalfilen kan åpnes direkte på NTNU.";
}
