import test from "node:test";
import assert from "node:assert/strict";
import {diveMarkerClass,diveMarkerHTML,diveMapLegendHTML} from "../src/diverse/dive-marker-icons.js";
import {diveMapHTML} from "../src/diverse/dive-map.js";

const nature={properties:{Navn:"Naturdykk",Kategori:"Naturdykk",Kilde_nivå:"nivå 1",Datakvalitet:"A"}};
const wreck={properties:{Navn:"Vrak",Kategori:"Vrak",Kilde_nivå:"nivå 2",Datakvalitet:"B"}};
test("all mapped dive features have bundled SVG pictogram instead of CDN PNG marker",()=>{
 const n=diveMarkerHTML(nature),w=diveMarkerHTML(wreck);
 assert.match(n,/<svg[^>]+viewBox=/);
 assert.match(w,/<svg[^>]+viewBox=/);
 assert.match(n,/dive-map-marker--nature/);
 assert.match(w,/dive-map-marker--wreck/);
 assert.equal(diveMarkerClass(wreck),"dive-map-marker--wreck");
 assert.ok(!n.includes("http"));
 assert.ok(!w.includes("http"));
 assert.match(diveMapLegendHTML(),/Vrak/);
 assert.match(diveMapHTML(),/dive-map-legend/);
});
test("map marker HTML escapes user-sourced names safely",()=>{
 const s=diveMarkerHTML({properties:{Navn:'<img src=x onerror="x">',Kategori:"Natur"}});
 assert.ok(!s.includes("<img"));
 assert.match(s,/&lt;img/);
 assert.match(s,/&quot;/);
});
