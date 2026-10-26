import {mountDiveLog} from "./dive-log.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";
import {diveCoordinateAssessment,diveDistanceKm,diveFeatureKind,diveFeatureLevel,diveFeatureMaxDepth,diveFeaturePoint,diveFeatureQuality,diveFeatureWildlife,diveSourceUrls,diveStats,diveWildlifeIndex,filterDiveFeatures,sortDiveFeatures} from "./dive-core.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";
import {diveFeaturesCSV,diveFeaturesGeoJSON,downloadDiveText} from "./dive-export.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";
import {diveMapLegendHTML,diveMarkerClass,diveMarkerHTML} from "./dive-marker-icons.js?v=7856141b0585c166ccf82c28f8c748b4a933cb64";

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
  return diveSourceUrls(properties).map((url,index)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Source ${index+1}</a>`).join("");
}
function featureDetail(feature,{origin=null}={}){
  const p=feature.properties||{};
  const depthMin=p.Dybde_min_m!==null&&p.Dybde_min_m!==undefined&&p.Dybde_min_m!==""&&Number.isFinite(Number(p.Dybde_min_m))?Number(p.Dybde_min_m):null;
  const depthMax=diveFeatureMaxDepth(feature);
  const depth=depthMin===null&&depthMax===null?"Not documented":depthMin===depthMax?`${depthMax} m`:`${depthMin??0}–${depthMax??"?"} m`;
  const coordinate=diveCoordinateAssessment(feature);
  const point=coordinate.point;
  const distance=origin&&point?diveDistanceKm(origin,point):null;
  const wildlife=diveFeatureWildlife(feature);
  return `<div class="dive-detail">
    <div class="dive-detail-head"><strong>${esc(p.Navn||"Unnamed site")}</strong><span>${diveFeatureLevel(feature)}</span></div>
    <div class="dive-detail-meta"><span>${esc(p.Kategori||"")}</span><span>${esc(p.Område||"")}</span><span>${depth}</span>${distance===null?"":`<span>${distance.toFixed(1)} km away</span>`}</div>
    ${coordinate.status==="unverified"?`<p><b>Location:</b> Unverified source coordinate — omitted from map and exports pending local verification.</p>`:""}
    ${coordinate.status==="invalid"?`<p><b>Location:</b> Invalid coordinates — map marker withheld.</p>`:""}
    ${p.Notater?`<p><b>Source note:</b> ${esc(p.Notater)}</p>`:""}
    ${p.Status?`<p><b>Status:</b> ${esc(p.Status)}</p>`:""}
    ${p.Adkomst?`<p><b>Access:</b> ${esc(p.Adkomst)}</p>`:""}
    ${p.Bunn_terreng?`<p><b>Bottom / terrain:</b> ${esc(p.Bunn_terreng)}</p>`:""}
    ${p.Strøm_fare_forbehold?`<p><b>Conditions / caveat:</b> ${esc(p.Strøm_fare_forbehold)}</p>`:""}
    ${p.Observert_dyreliv?`<p><b>Observed wildlife:</b> ${esc(p.Observert_dyreliv)}</p>`:""}
    ${wildlife.length?`<div class="dive-wildlife-tags">${wildlife.slice(0,12).map(item=>`<span>${esc(item)}</span>`).join("")}</div>`:""}
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
      <label><span>Type</span><select id="dive-kind"><option value="all">All</option><option value="nature">Nature / area</option><option value="wreck">Wreck</option></select></label>
      <label><span>Data quality</span><select id="dive-quality"><option value="all">All</option><option value="A">A · strongest</option><option value="B">B · usable</option><option value="C">C · verify</option></select></label>
      <label><span>Max depth</span><input id="dive-depth" type="number" min="0" step="1" placeholder="m"></label>
      <label><span>Wildlife</span><select id="dive-wildlife"><option value="all">All species</option></select></label>
      <label class="dive-exclude"><span>Species mode</span><select id="dive-wildlife-mode"><option value="include">With species</option><option value="exclude">Without species</option></select></label>
      <label><span>Sort</span><select id="dive-sort"><option value="name">Name</option><option value="depth">Depth</option><option value="level">Level</option><option value="quality">Evidence quality</option><option value="nearest">Nearest me</option></select></label>
      <button class="btn dive-location-button" id="dive-locate" type="button" aria-describedby="dive-location-status">Use my location</button>
      <p class="dive-location-status" id="dive-location-status" role="status" aria-live="polite">Optional: location is requested only if you tap the button. Used locally for straight-line distances; not saved or exported.</p>
    </section>
    <section class="dive-stats-row">
      <div class="dive-stats" id="dive-stats">Loading dive dataset…</div>
      <div class="dive-export-actions">
        <button class="btn" id="dive-export-csv">Export filtered CSV</button>
        <button class="btn" id="dive-export-geojson">Export filtered GeoJSON</button>
      </div>
    </section>
    <details class="dive-log-panel"><summary>Min dykkelogg · lokal og kryptert Google Drive-synk</summary><div id="dive-log-root"></div></details>
    <section class="dive-workspace">
      <div class="dive-map-panel"><div id="dive-map-canvas" aria-label="Dive sites map"></div>${diveMapLegendHTML()}<div id="dive-map-note" class="dive-map-note">Map loading…</div></div>
      <aside class="dive-list-panel"><div id="dive-list" class="dive-list"></div></aside>
      <aside class="dive-inspector" id="dive-inspector"><div class="dive-empty"><strong>Select a site</strong><span>Details, caveats and source links appear here.</span></div></aside>
    </section>
  </main>`;
}

export async function mountDiveMap(root,{dataUrl="./data/diving/trondheim-sites.geojson",onBack=()=>{},leaflet=null,geolocation=globalThis.navigator?.geolocation}={}){
  let disposed=false;
  let map=null;
  let layer=null;
  let locating=false;
  let locationRequestId=0;
  const state={query:"",level:"all",kind:"all",quality:"all",maxDepth:"",wildlife:"all",excludeWildlife:false,sort:"name",selected:null,origin:null};
  const response=await fetch(dataUrl,{cache:"no-cache"});
  if(!response.ok)throw new Error(`Dive dataset HTTP ${response.status}`);
  const data=await response.json();
  const features=data.features||[];
  const diveLog=mountDiveLog(root.querySelector("#dive-log-root"));
  let currentVisible=features;
  const elements={
    query:root.querySelector("#dive-query"),level:root.querySelector("#dive-level"),kind:root.querySelector("#dive-kind"),quality:root.querySelector("#dive-quality"),
    depth:root.querySelector("#dive-depth"),wildlife:root.querySelector("#dive-wildlife"),wildlifeMode:root.querySelector("#dive-wildlife-mode"),sort:root.querySelector("#dive-sort"),locate:root.querySelector("#dive-locate"),stats:root.querySelector("#dive-stats"),
    list:root.querySelector("#dive-list"),inspector:root.querySelector("#dive-inspector"),map:root.querySelector("#dive-map-canvas"),
    note:root.querySelector("#dive-map-note"),locationStatus:root.querySelector("#dive-location-status"),csv:root.querySelector("#dive-export-csv"),geojson:root.querySelector("#dive-export-geojson")
  };
  root.querySelector("[data-go-diverse]")?.addEventListener("click",onBack);

  const markers=new Map();
  const selectFeature=(feature,{zoom=true}={})=>{
    state.selected=feature?.properties?.ID==null?null:String(feature.properties.ID);
    diveLog.selectSite(feature);
    elements.inspector.innerHTML=featureDetail(feature,{origin:state.origin});
    root.querySelectorAll("[data-dive-id]").forEach(node=>node.classList.toggle("selected",node.dataset.diveId===state.selected));
    const marker=markers.get(state.selected);
    if(marker&&map){marker.openPopup();if(zoom)map.setView(marker.getLatLng(),Math.max(map.getZoom(),11),{animate:true})}
    elements.map?.querySelectorAll(".dive-map-pin").forEach(el=>el.classList.toggle("is-selected",el.closest(".leaflet-marker-icon")?.getAttribute("data-site-id")===state.selected));
  };

  const render=()=>{
    const visible=sortDiveFeatures(filterDiveFeatures(features,state),state.sort,{origin:state.origin});
    currentVisible=visible;
    if(state.selected&&!visible.some(feature=>String(feature.properties?.ID)===state.selected)){
      state.selected=null;
      elements.inspector.innerHTML='<div class="dive-empty"><strong>Select a site</strong><span>Choose a visible map marker or listed dive site.</span></div>';
    }
    const stats=diveStats(visible);
    elements.stats.innerHTML=`<strong>${stats.total}</strong> shown · ${stats.nature} nature/area · ${stats.wrecks} wreck · ${stats.withCoordinates} mapped${stats.unverifiedCoordinates?` · ${stats.unverifiedCoordinates} unverified pins withheld`:""} · ${stats.withDepth} with documented max depth · ${stats.withWildlife} with wildlife${state.origin?" · distance enabled":""}`;
    elements.list.innerHTML=visible.map(feature=>{
      const p=feature.properties||{};
      const max=diveFeatureMaxDepth(feature);
      const point=diveFeaturePoint(feature);
      const distance=state.origin&&point?diveDistanceKm(state.origin,point):null;
      return `<button class="dive-list-item ${state.selected===p.ID?"selected":""}" data-dive-id="${esc(p.ID)}">
        <span class="dive-list-title"><strong>${esc(p.Navn)}</strong><em>${diveFeatureLevel(feature)}</em></span>
        <span>${esc(p.Område||"")}</span>
        <small>${esc(p.Kategori||"")}${max===null?"":` · max ${max} m`} · quality ${diveFeatureQuality(feature)}${distance===null?"":` · ${distance.toFixed(1)} km`}${point?"":diveCoordinateAssessment(feature).status==="unverified"?" · coordinate unverified":" · no usable coordinates"}</small>
      </button>`;
    }).join("")||'<div class="dive-empty"><strong>No matching sites</strong><span>Adjust filters to show more locations.</span></div>';
    elements.list.querySelectorAll("[data-dive-id]").forEach(button=>{
      button.addEventListener("click",()=>selectFeature(visible.find(feature=>feature.properties?.ID===button.dataset.diveId)));
    });

    if(layer&&map){
      layer.clearLayers();markers.clear();
      const bounds=[];
      visible.forEach(feature=>{
        const point=diveFeaturePoint(feature);
        if(!point)return;
        const {lat,lon}=point;
        const marker=window.L.marker([lat,lon],{
          icon:window.L.divIcon({
            className:`dive-leaflet-marker ${diveMarkerClass(feature)}`,
            html:diveMarkerHTML(feature),iconSize:[36,42],iconAnchor:[18,40],popupAnchor:[0,-40]
          }),keyboard:true,riseOnHover:true,title:String(feature.properties?.Navn||"Dykkested")
        }).addTo(layer);
        marker.getElement?.()?.setAttribute("data-site-id",String(feature.properties?.ID||""));
        marker.bindTooltip(esc(feature.properties?.Navn||""),{direction:"top"});
        marker.bindPopup(featureDetail(feature,{origin:state.origin}),{maxWidth:340});
        marker.on("click",()=>selectFeature(feature,{zoom:false}));
        markers.set(String(feature.properties?.ID),marker);bounds.push([lat,lon]);
      });
      if(state.selected){
        elements.map.querySelectorAll(".dive-map-pin").forEach(el=>
          el.classList.toggle("is-selected",
            el.closest(".leaflet-marker-icon")?.getAttribute("data-site-id")===state.selected));
      }
      if(bounds.length>1)map.fitBounds(bounds,{padding:[24,24],maxZoom:11});
      else if(bounds.length===1)map.setView(bounds[0],11);
    }
  };

  for(const [element,key,event] of [
    [elements.query,"query","input"],[elements.level,"level","change"],[elements.kind,"kind","change"],[elements.quality,"quality","change"],
    [elements.depth,"maxDepth","input"],[elements.sort,"sort","change"],
    [elements.wildlife,"wildlife","change"]
  ]){
    element?.addEventListener(event,ev=>{state[key]=ev.currentTarget.value;render()});
  }
  elements.wildlifeMode?.addEventListener("change",event=>{
    state.excludeWildlife=event.currentTarget.value==="exclude";render();
  });
  // Geolocation is an explicit one-shot, per-mount action. Never request it
  // on page load, persist coordinates or attach them to CSV/GeoJSON exports.
  const setLocationButton=()=>{
    if(!elements.locate)return;
    elements.locate.disabled=locating;
    elements.locate.textContent=locating?"Finding location…":
      state.origin?"Clear my location":"Use my location";
    elements.locate.setAttribute("aria-pressed",String(Boolean(state.origin)));
  };
  const locationMessage=message=>{
    if(elements.locationStatus)elements.locationStatus.textContent=message;
  };
  elements.locate?.addEventListener("click",()=>{
    if(disposed||locating)return;
    if(state.origin){
      // Clear both the in-memory coordinates and any nearest-only display.
      locationRequestId++;
      state.origin=null;
      if(state.sort==="nearest"){
        state.sort="name";
        elements.sort.value="name";
      }
      setLocationButton();
      locationMessage("Location cleared from this view. No coordinates were saved.");
      render();
      return;
    }
    if(typeof geolocation?.getCurrentPosition!=="function"){
      locationMessage("Location unavailable in this browser. The dive list still works without it.");
      return;
    }
    const requestId=++locationRequestId;
    locating=true;
    setLocationButton();
    locationMessage("Requesting browser permission for a one-time approximate distance sort…");
    const finish=()=>{
      if(disposed||requestId!==locationRequestId)return false;
      locating=false;
      setLocationButton();
      return true;
    };
    const success=position=>{
      if(disposed||requestId!==locationRequestId)return;
      const candidate={lat:position?.coords?.latitude,lon:position?.coords?.longitude};
      if(diveDistanceKm(candidate,candidate)===null){
        finish();
        locationMessage("Browser returned an invalid position. The dive list is unchanged.");
        return;
      }
      state.origin={lat:Number(candidate.lat),lon:Number(candidate.lon)};
      state.sort="nearest";
      elements.sort.value="nearest";
      finish();
      const accuracy=Number(position?.coords?.accuracy);
      const estimated=Number.isFinite(accuracy)&&accuracy>=0
        ?` (browser accuracy about ±${Math.ceil(accuracy)} m)`:"";
      locationMessage("Sorted by straight-line distance"+estimated+
        ". Position stays in this page memory until you clear it or leave.");
      render();
    };
    const failure=error=>{
      if(!finish())return;
      const denied=error?.code===1;
      locationMessage(denied
        ?"Location permission declined. Dive sites remain available without location."
        :"Could not determine your location. Dive sites remain available without location.");
    };
    try{
      geolocation.getCurrentPosition(success,failure,{
        enableHighAccuracy:false,timeout:10000,maximumAge:0
      });
    }catch(error){failure(error)}
  });
  setLocationButton();

  const wildlifeChoices=diveWildlifeIndex(features);
  elements.wildlife?.insertAdjacentHTML("beforeend",
    wildlifeChoices.map(item=>`<option value="${esc(item.key)}">${esc(item.label)} (${item.count})</option>`).join(""));
  elements.csv?.addEventListener("click",()=>{
    downloadDiveText(diveFeaturesCSV(currentVisible),"trondheim-dive-filtered.csv","text/csv;charset=utf-8");
  });
  elements.geojson?.addEventListener("click",()=>{
    const filters={query:state.query,level:state.level,kind:state.kind,quality:state.quality,maxDepth:state.maxDepth,sort:state.sort,wildlife:state.wildlife,excludeWildlife:state.excludeWildlife};
    downloadDiveText(
      diveFeaturesGeoJSON(currentVisible,{source:data.metadata?.source||null,sourceDate:data.metadata?.created||null,filters}),
      "trondheim-dive-filtered.geojson","application/geo+json"
    );
  });

  render();

  try{
    ensureLeafletCSS();
    const module=leaflet||await import("https://esm.sh/leaflet@1.9.4?bundle");
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
    locationRequestId++; // discard a delayed browser permission result
    locating=false;
    state.origin=null;
    diveLog.cleanup();
    map?.remove();
    map=null;
    layer=null;
    markers.clear();
    if(window.L)delete window.L;
  };
}
