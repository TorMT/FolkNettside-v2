import {diveFeatureKind,diveFeatureLevel,diveFeatureMaxDepth,diveStats,filterDiveFeatures,sortDiveFeatures} from "./dive-core.js";

function esc(value){
  return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}
function ensureLeafletCSS(){
  if(document.querySelector('link[data-leaflet-css]'))return;
  const link=document.createElement("link");
  link.rel="stylesheet";
  link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.dataset.leafletCss="1";
  document.head.append(link);
}
function sourceLinks(properties){
  return (properties?.source_urls||[]).map((url,index)=>`<a href="${esc(url)}" target="_blank" rel="noopener">Source ${index+1}</a>`).join("");
}
function featureDetail(feature){
  const p=feature.properties||{};
  const depthMin=Number.isFinite(Number(p.Dybde_min_m))?Number(p.Dybde_min_m):null;
  const depthMax=diveFeatureMaxDepth(feature);
  const depth=depthMin===null&&depthMax===null?"Not documented":depthMin===depthMax?`${depthMax} m`:`${depthMin??0}–${depthMax??"?"} m`;
  return `<div class="dive-detail">
    <div class="dive-detail-head"><strong>${esc(p.Navn||"Unnamed site")}</strong><span>${diveFeatureLevel(feature)}</span></div>
    <div class="dive-detail-meta"><span>${esc(p.Kategori||"")}</span><span>${esc(p.Område||"")}</span><span>${depth}</span></div>
    ${p.Status?`<p><b>Status:</b> ${esc(p.Status)}</p>`:""}
    ${p.Adkomst?`<p><b>Access:</b> ${esc(p.Adkomst)}</p>`:""}
    ${p.Bunn_terreng?`<p><b>Bottom / terrain:</b> ${esc(p.Bunn_terreng)}</p>`:""}
    ${p.Strøm_fare_forbehold?`<p><b>Conditions / caveat:</b> ${esc(p.Strøm_fare_forbehold)}</p>`:""}
    ${p.Observert_dyreliv?`<p><b>Observed wildlife:</b> ${esc(p.Observert_dyreliv)}</p>`:""}
    ${p.Vrak_historie?`<p><b>Wreck:</b> ${esc(p.Vrak_historie)}</p>`:""}
    ${p.Vern_kulturminne?`<p><b>Protection:</b> ${esc(p.Vern_kulturminne)}</p>`:""}
    <div class="dive-detail-foot"><span>${esc(p.Datakvalitet||"Quality not set")}</span><span>Checked ${esc(p.verified_date||"unknown")}</span></div>
    <div class="dive-source-links">${sourceLinks(p)}</div>
  </div>`;
}

export function diveMapHTML(){
  return `<main class="dive-page">
    <header class="dive-hero">
      <div><span class="project-kicker">Diverse / Dive map</span><h1>Dive map</h1>
      <p>Source-traceable dive sites and wrecks. Public coordinates can be approximate; verify local access, conditions, regulations and qualification before a dive.</p></div>
      <button class="btn" data-go-diverse>Back to Diverse</button>
    </header>
    <section class="dive-controls">
      <label class="dive-search"><span>Search</span><input id="dive-query" type="search" placeholder="Site, wreck, wildlife, area…"></label>
      <label><span>Level</span><select id="dive-level"><option value="all">All</option><option>P1</option><option>P2</option><option>P3</option><option value="TECH">Technical</option><option value="UNKNOWN">Unrated</option></select></label>
      <label><span>Type</span><select id="dive-kind"><option value="all">All</option><option value="nature">Nature</option><option value="wreck">Wreck</option></select></label>
      <label><span>Max depth</span><input id="dive-depth" type="number" min="0" step="1" placeholder="m"></label>
      <label><span>Sort</span><select id="dive-sort"><option value="name">Name</option><option value="depth">Depth</option><option value="level">Level</option></select></label>
    </section>
    <section class="dive-stats" id="dive-stats">Loading dive dataset…</section>
    <section class="dive-workspace">
      <div class="dive-map-panel"><div id="dive-map-canvas" aria-label="Dive sites map"></div><div id="dive-map-note" class="dive-map-note">Map loading…</div></div>
      <aside class="dive-list-panel"><div id="dive-list" class="dive-list"></div></aside>
      <aside class="dive-inspector" id="dive-inspector"><div class="dive-empty"><strong>Select a site</strong><span>Details, caveats and source links appear here.</span></div></aside>
    </section>
  </main>`;
}

export async function mountDiveMap(root,{dataUrl="./data/diving/trondheim-sites.geojson",onBack=()=>{}}={}){
  let disposed=false;
  let map=null;
  let layer=null;
  const state={query:"",level:"all",kind:"all",maxDepth:"",sort:"name",selected:null};
  const response=await fetch(dataUrl,{cache:"no-cache"});
  if(!response.ok)throw new Error(`Dive dataset HTTP ${response.status}`);
  const data=await response.json();
  const features=data.features||[];
  const elements={
    query:root.querySelector("#dive-query"),level:root.querySelector("#dive-level"),kind:root.querySelector("#dive-kind"),
    depth:root.querySelector("#dive-depth"),sort:root.querySelector("#dive-sort"),stats:root.querySelector("#dive-stats"),
    list:root.querySelector("#dive-list"),inspector:root.querySelector("#dive-inspector"),map:root.querySelector("#dive-map-canvas"),
    note:root.querySelector("#dive-map-note")
  };
  root.querySelector("[data-go-diverse]")?.addEventListener("click",onBack);

  const markers=new Map();
  const selectFeature=(feature,{zoom=true}={})=>{
    state.selected=feature?.properties?.ID||null;
    elements.inspector.innerHTML=featureDetail(feature);
    root.querySelectorAll("[data-dive-id]").forEach(node=>node.classList.toggle("selected",node.dataset.diveId===state.selected));
    const marker=markers.get(state.selected);
    if(marker&&map){marker.openPopup();if(zoom)map.setView(marker.getLatLng(),Math.max(map.getZoom(),11),{animate:true})}
  };

  const render=()=>{
    const visible=sortDiveFeatures(filterDiveFeatures(features,state),state.sort);
    const stats=diveStats(visible);
    elements.stats.innerHTML=`<strong>${stats.total}</strong> shown · ${stats.nature} nature · ${stats.wrecks} wreck · ${stats.withDepth} with documented max depth`;
    elements.list.innerHTML=visible.map(feature=>{
      const p=feature.properties||{};
      const max=diveFeatureMaxDepth(feature);
      return `<button class="dive-list-item ${state.selected===p.ID?"selected":""}" data-dive-id="${esc(p.ID)}">
        <span class="dive-list-title"><strong>${esc(p.Navn)}</strong><em>${diveFeatureLevel(feature)}</em></span>
        <span>${esc(p.Område||"")}</span>
        <small>${esc(p.Kategori||"")}${max===null?"":` · max ${max} m`}</small>
      </button>`;
    }).join("")||'<div class="dive-empty"><strong>No matching sites</strong><span>Adjust filters to show more locations.</span></div>';
    elements.list.querySelectorAll("[data-dive-id]").forEach(button=>{
      button.addEventListener("click",()=>selectFeature(visible.find(feature=>feature.properties?.ID===button.dataset.diveId)));
    });

    if(layer&&map){
      layer.clearLayers();markers.clear();
      const bounds=[];
      const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#b3157a";
      visible.forEach(feature=>{
        const [lon,lat]=feature.geometry?.coordinates||[];
        if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
        const isWreck=diveFeatureKind(feature)==="wreck";
        const marker=window.L.circleMarker([lat,lon],{
          radius:isWreck?7:6,weight:2,color:accent,fillColor:isWreck?"#173b50":accent,fillOpacity:.78
        }).addTo(layer);
        marker.bindTooltip(esc(feature.properties?.Navn||""),{direction:"top"});
        marker.bindPopup(featureDetail(feature),{maxWidth:340});
        marker.on("click",()=>selectFeature(feature,{zoom:false}));
        markers.set(feature.properties?.ID,marker);bounds.push([lat,lon]);
      });
      if(bounds.length>1)map.fitBounds(bounds,{padding:[24,24],maxZoom:11});
      else if(bounds.length===1)map.setView(bounds[0],11);
    }
  };

  for(const [element,key,event] of [
    [elements.query,"query","input"],[elements.level,"level","change"],[elements.kind,"kind","change"],
    [elements.depth,"maxDepth","input"],[elements.sort,"sort","change"]
  ]){
    element?.addEventListener(event,ev=>{state[key]=ev.currentTarget.value;render()});
  }

  render();

  try{
    ensureLeafletCSS();
    const module=await import("https://esm.sh/leaflet@1.9.4?bundle");
    if(disposed)return ()=>{};
    window.L=module.default||module;
    map=window.L.map(elements.map,{zoomControl:true,preferCanvas:true});
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom:18,attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);
    layer=window.L.layerGroup().addTo(map);
    elements.note.textContent=`${features.length} sourced locations · dataset ${data.metadata?.created||"snapshot"}`;
    render();
    setTimeout(()=>map?.invalidateSize(),0);
  }catch(error){
    elements.note.textContent="Interactive basemap unavailable; the searchable sourced location list still works.";
    elements.map.innerHTML=`<div class="dive-map-fallback">Map library could not load.<br><small>${esc(error?.message||error)}</small></div>`;
  }

  return ()=>{
    disposed=true;
    map?.remove();
    map=null;
    layer=null;
    markers.clear();
    if(window.L)delete window.L;
  };
}
