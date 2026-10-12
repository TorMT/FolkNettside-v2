import {diveFeatureKind,diveFeatureLevel,diveFeatureQuality} from "./dive-core.js?v=a86c590a4cc4c2a711867cba41af767bff1478b9";

// Bundled vector artwork: unlike the Leaflet default PNG marker icons, these
// do not depend on assets loading from the external Leaflet stylesheet/CDN.
const diveGlyph='<path d="M6 18c-1.8-1.6-2.5-3.6-2.5-6.1C3.5 8 6.3 6 9.5 6h5c3.2 0 6 2 6 5.9 0 2.5-.7 4.5-2.5 6.1"/><path d="M5 12h5l2 2 2-2h5"/><path d="M12 6V3m-2 0h4"/>';
const wreckGlyph='<path d="M12 3v18m-5-3 5 3 5-3M5 15c1.1 3 3.2 4 7 4s5.9-1 7-4M8 8h8M5 10h14"/>';
const safeText=value=>String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
export function diveMarkerClass(feature){
  return diveFeatureKind(feature)==="wreck"?"dive-map-marker--wreck":"dive-map-marker--nature";
}
export function diveMarkerHTML(feature){
  const wreck=diveFeatureKind(feature)==="wreck";
  const label= wreck?"Vrak":"Dykkested";
  const level=diveFeatureLevel(feature);
  const quality=diveFeatureQuality(feature);
  const glyph=wreck?wreckGlyph:diveGlyph;
  return `<span class="dive-map-pin ${diveMarkerClass(feature)}" data-dive-kind="${wreck?"wreck":"nature"}" data-dive-level="${safeText(level)}" data-dive-quality="${safeText(quality)}" role="img" aria-label="${label}: ${safeText(feature?.properties?.Navn||"Ukjent")}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg></span>`;
}
export function diveMapLegendHTML(){
  return `<div class="dive-map-legend" aria-label="Map marker types">
    <span>${diveMarkerHTML({properties:{Navn:"Naturdykk",Kategori:"Natur"}})} Naturdykk</span>
    <span>${diveMarkerHTML({properties:{Navn:"Vrakdykk",Kategori:"Vrak"}})} Vrak</span>
  </div>`;
}
