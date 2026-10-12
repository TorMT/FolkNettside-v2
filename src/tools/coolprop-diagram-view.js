import {dataBounds,diagramDatasets,diagramType} from "./coolprop-diagram-core.js?v=79586a975aa0b383788b1de8e40d9d0f17450156";
import {zoomDiagramViewport} from "./coolprop-diagram-viewport.js?v=79586a975aa0b383788b1de8e40d9d0f17450156";

function css(name,fallback){
  const value=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value||fallback;
}

function datasetStyle(kind){
  if(kind==="states")return {stroke:css("--accent","#b3157a"),width:2.2,dash:[],point:true};
  if(kind==="critical")return {stroke:css("--danger","#b42318"),width:2.2,dash:[],point:true};
  if(kind==="saturation")return {stroke:css("--ink","#163041"),width:2,dash:[],point:false};
  if(kind==="quality")return {stroke:css("--warn","#8f5a00"),width:1,dash:[4,4],point:false};
  if(kind==="isotherm")return {stroke:css("--ink-3","#82939e"),width:1,dash:[6,5],point:false};
  return {stroke:css("--line-strong","#90a4af"),width:1,dash:[],point:false};
}

function transformedY(value,logY){
  return logY?Math.log10(Math.max(value,1e-12)):value;
}

function makeView(bounds,logY){
  return {
    xmin:bounds.xmin,xmax:bounds.xmax,
    ymin:transformedY(bounds.ymin,logY),
    ymax:transformedY(bounds.ymax,logY)
  };
}

export function mountCoolPropDiagram(container,{engine,fluid,type="log-ph",states=[],options={}}){
  container.replaceChildren();
  const canvas=document.createElement("canvas");
  canvas.className="coolprop-diagram-canvas";
  canvas.tabIndex=0;
  canvas.setAttribute("role","img");
  canvas.setAttribute("aria-label",`${fluid} ${diagramType(type).label} diagram; drag to pan, wheel or plus/minus to zoom, 0 to reset`);
  const overlay=document.createElement("div");
  overlay.className="coolprop-diagram-overlay";
  const legend=document.createElement("div");
  legend.className="coolprop-diagram-legend";
  const readout=document.createElement("div");
  readout.className="coolprop-diagram-readout";
  overlay.append(legend,readout);
  container.append(canvas,overlay);
  const context=canvas.getContext("2d");
  const meta=diagramType(type);
  const datasets=diagramDatasets(engine,fluid,type,states,options);
  const bounds=dataBounds(datasets,{logY:meta.logY});
  const initial=makeView(bounds,meta.logY);
  let view={...initial};
  let drag=null;

  const pad={left:62,right:18,top:20,bottom:50};

  function dims(){
    const rect=canvas.getBoundingClientRect();
    return {width:Math.max(260,rect.width),height:Math.max(260,rect.height)};
  }

  function sx(x,w){return pad.left+(x-view.xmin)/(view.xmax-view.xmin)*(w-pad.left-pad.right)}
  function sy(y,h){
    const t=transformedY(y,meta.logY);
    return h-pad.bottom-(t-view.ymin)/(view.ymax-view.ymin)*(h-pad.top-pad.bottom);
  }
  function invX(px,w){return view.xmin+(px-pad.left)/(w-pad.left-pad.right)*(view.xmax-view.xmin)}
  function invY(py,h){
    const t=view.ymin+(h-pad.bottom-py)/(h-pad.top-pad.bottom)*(view.ymax-view.ymin);
    return t;
  }

  function formatTick(value){
    const abs=Math.abs(value);
    if(abs!==0&&(abs<.01||abs>10000))return value.toExponential(1);
    return Number(value.toFixed(2)).toString();
  }

  function drawAxes(w,h){
    const ink=css("--ink","#163041"),line=css("--line","#c8d5dc"),muted=css("--ink-2","#607783");
    context.strokeStyle=line;
    context.fillStyle=muted;
    context.lineWidth=1;
    context.font="11px system-ui,sans-serif";
    context.textAlign="center";
    context.textBaseline="top";

    context.beginPath();
    context.moveTo(pad.left,pad.top);
    context.lineTo(pad.left,h-pad.bottom);
    context.lineTo(w-pad.right,h-pad.bottom);
    context.stroke();

    for(let i=0;i<=5;i++){
      const x=view.xmin+(view.xmax-view.xmin)*i/5;
      const px=sx(x,w);
      context.strokeStyle=line;
      context.beginPath();context.moveTo(px,pad.top);context.lineTo(px,h-pad.bottom);context.stroke();
      context.beginPath();context.moveTo(px,h-pad.bottom);context.lineTo(px,h-pad.bottom+5);context.stroke();
      context.fillStyle=muted;context.fillText(formatTick(x),px,h-pad.bottom+8);
    }

    context.textAlign="right";
    context.textBaseline="middle";
    for(let i=0;i<=5;i++){
      const ty=view.ymin+(view.ymax-view.ymin)*i/5;
      const value=meta.logY?10**ty:ty;
      const py=h-pad.bottom-(i/5)*(h-pad.top-pad.bottom);
      context.strokeStyle=line;
      context.beginPath();context.moveTo(pad.left,py);context.lineTo(w-pad.right,py);context.stroke();
      context.beginPath();context.moveTo(pad.left-5,py);context.lineTo(pad.left,py);context.stroke();
      context.fillStyle=muted;context.fillText(formatTick(value),pad.left-8,py);
    }

    context.fillStyle=ink;
    context.textAlign="center";
    context.textBaseline="bottom";
    context.font="12px system-ui,sans-serif";
    context.fillText(meta.xLabel,(pad.left+w-pad.right)/2,h-5);

    context.save();
    context.translate(14,(pad.top+h-pad.bottom)/2);
    context.rotate(-Math.PI/2);
    context.fillText(meta.yLabel,0,0);
    context.restore();
  }

  function drawDataset(dataset,w,h){
    const style=datasetStyle(dataset.kind);
    const points=(dataset.points||[]).filter(point=>
      Number.isFinite(point.x)&&Number.isFinite(point.y)&&(!meta.logY||point.y>0)
    );
    if(!points.length)return;
    context.strokeStyle=style.stroke;
    context.fillStyle=style.stroke;
    context.lineWidth=style.width;
    context.setLineDash(style.dash);
    context.beginPath();
    points.forEach((point,index)=>{
      const x=sx(point.x,w),y=sy(point.y,h);
      if(index===0||point.breakBefore)context.moveTo(x,y);else context.lineTo(x,y);
    });
    if(dataset.kind!=="states"&&dataset.kind!=="critical")context.stroke();

    if(dataset.kind==="critical"){
      context.setLineDash([]);
      const point=points[0],x=sx(point.x,w),y=sy(point.y,h);
      context.beginPath();context.arc(x,y,5.5,0,Math.PI*2);context.fill();
      context.font="10px system-ui,sans-serif";context.textAlign="left";context.textBaseline="bottom";context.fillText("Critical",x+7,y-5);
    }

    if(dataset.kind==="states"){
      context.setLineDash([]);
      if(points.length>1){
        context.beginPath();
        points.forEach((point,index)=>{
          const x=sx(point.x,w),y=sy(point.y,h);
          if(index===0)context.moveTo(x,y);else context.lineTo(x,y);
        });
        context.stroke();
      }
      context.font="11px system-ui,sans-serif";
      context.textAlign="left";
      context.textBaseline="bottom";
      points.forEach((point,index)=>{
        const x=sx(point.x,w),y=sy(point.y,h);
        context.beginPath();context.arc(x,y,4.2,0,Math.PI*2);context.fill();
        context.fillText(point.label||String(index+1),x+6,y-5);
      });
    }
    context.setLineDash([]);
  }

  function drawDatasetLabel(dataset,w,h){
    if(!dataset?.label||!["quality","isotherm","isobar"].includes(dataset.kind))return;
    const points=(dataset.points||[]).filter(point=>
      Number.isFinite(point.x)&&Number.isFinite(point.y)&&(!meta.logY||point.y>0)
    );
    if(points.length<2)return;
    const fraction=dataset.kind==="quality"?.58:.72;
    const point=points[Math.min(points.length-1,Math.max(0,Math.floor((points.length-1)*fraction)))];
    const x=sx(point.x,w),y=sy(point.y,h);
    if(x<pad.left+6||x>w-pad.right-6||y<pad.top+6||y>h-pad.bottom-6)return;
    const label=dataset.label;
    context.save();
    context.font="9px system-ui,sans-serif";
    const metrics=context.measureText(label);
    const width=metrics.width+8,height=15;
    const left=Math.min(w-pad.right-width-2,Math.max(pad.left+2,x+4));
    const top=Math.min(h-pad.bottom-height-2,Math.max(pad.top+2,y-height/2));
    context.fillStyle=css("--surface","#fff");
    context.globalAlpha=.88;
    context.fillRect(left,top,width,height);
    context.globalAlpha=1;
    context.fillStyle=datasetStyle(dataset.kind).stroke;
    context.textAlign="left";
    context.textBaseline="middle";
    context.fillText(label,left+4,top+height/2+.5);
    context.restore();
  }

  function draw(){
    const {width,height}=dims();
    const ratio=Math.min(devicePixelRatio||1,2);
    const rw=Math.round(width*ratio),rh=Math.round(height*ratio);
    if(canvas.width!==rw||canvas.height!==rh){
      canvas.width=rw;canvas.height=rh;
    }
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,width,height);
    context.fillStyle=css("--surface","#fff");
    context.fillRect(0,0,width,height);
    drawAxes(width,height);
    context.save();
    context.beginPath();
    context.rect(pad.left,pad.top,width-pad.left-pad.right,height-pad.top-pad.bottom);
    context.clip();
    for(const dataset of datasets)drawDataset(dataset,width,height);
    context.restore();

    const contourCount={quality:0,isotherm:0,isobar:0};
    for(const dataset of datasets){
      if(!(dataset.kind in contourCount))continue;
      const index=contourCount[dataset.kind]++;
      if(dataset.kind!=="quality"&&index%2===1)continue;
      drawDatasetLabel(dataset,width,height);
    }
  }

  function reset(){view={...initial};draw()}

  function zoom(factor,focus=null){
    const target=focus||{x:(view.xmin+view.xmax)/2,y:(view.ymin+view.ymax)/2};
    const next=zoomDiagramViewport(view,target,factor,initial);
    if(next){view=next;draw()}
  }
  function onWheel(event){
    event.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const px=event.clientX-rect.left,py=event.clientY-rect.top;
    const {width,height}=dims();
    const cx=invX(px,width),cy=invY(py,height);
    zoom(Math.exp(Math.max(-600,Math.min(600,event.deltaY))*.001),{x:cx,y:cy});
  }
  function onKeyDown(event){
    if(event.key==="+"||event.key==="="){event.preventDefault();zoom(.8)}
    else if(event.key==="-"){event.preventDefault();zoom(1.25)}
    else if(event.key==="0"){event.preventDefault();reset()}
  }

  function onPointerDown(event){
    if(event.button!==0)return;
    canvas.setPointerCapture?.(event.pointerId);
    drag={x:event.clientX,y:event.clientY,view:{...view}};
  }
  function onPointerMove(event){
    if(!drag)return;
    const {width,height}=dims();
    const dx=(event.clientX-drag.x)/(width-pad.left-pad.right)*(drag.view.xmax-drag.view.xmin);
    const dy=(event.clientY-drag.y)/(height-pad.top-pad.bottom)*(drag.view.ymax-drag.view.ymin);
    view={
      xmin:drag.view.xmin-dx,xmax:drag.view.xmax-dx,
      ymin:drag.view.ymin+dy,ymax:drag.view.ymax+dy
    };
    draw();
  }
  function onPointerUp(){drag=null}

  canvas.addEventListener("wheel",onWheel,{passive:false});
  canvas.addEventListener("keydown",onKeyDown);
  canvas.addEventListener("pointerdown",onPointerDown);
  canvas.addEventListener("pointermove",onPointerMove);
  canvas.addEventListener("pointerup",onPointerUp);
  canvas.addEventListener("pointercancel",onPointerUp);

  const legendKinds=[
    ["saturation","Saturation"],["quality","Quality"],["isotherm","Isotherms"],["isobar","Isobars"],["states","States"],["critical","Critical"]
  ].filter(([kind])=>datasets.some(dataset=>dataset.kind===kind));
  legend.innerHTML=legendKinds.map(([kind,label])=>`<span data-kind="${kind}"><i></i>${label}</span>`).join("");

  function onPointerReadout(event){
    const rect=canvas.getBoundingClientRect();
    const {width,height}=dims();
    const px=event.clientX-rect.left,py=event.clientY-rect.top;
    if(px<pad.left||px>width-pad.right||py<pad.top||py>height-pad.bottom){
      readout.textContent="";
      return;
    }
    const x=invX(px,width);
    const rawY=invY(py,height);
    const y=meta.logY?10**rawY:rawY;
    const stateDataset=datasets.find(dataset=>dataset.kind==="states");
    let nearest=null;
    for(const point of stateDataset?.points||[]){
      const dx=sx(point.x,width)-px,dy=sy(point.y,height)-py;
      const distance=Math.hypot(dx,dy);
      if(!nearest||distance<nearest.distance)nearest={point,distance};
    }
    if(nearest&&nearest.distance<=18){
      readout.textContent=`State ${nearest.point.label||""} · ${meta.xLabel.split(" (")[0]} ${formatTick(nearest.point.x)} · ${meta.yLabel.split(" (")[0]} ${formatTick(nearest.point.y)}`;
      return;
    }
    readout.textContent=`${meta.xLabel.split(" (")[0]} ${formatTick(x)} · ${meta.yLabel.split(" (")[0]} ${formatTick(y)}`;
  }
  canvas.addEventListener("pointermove",onPointerReadout);
  canvas.addEventListener("pointerleave",()=>{readout.textContent=""});

  const observer=new ResizeObserver(draw);
  observer.observe(container);
  draw();

  return {
    datasets,
    reset,
    zoom,
    getView:()=>({...view}),
    downloadPNG(filename="coolprop-diagram.png"){
      canvas.toBlob(blob=>{
        if(!blob)return;
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=filename;a.click();
        setTimeout(()=>URL.revokeObjectURL(url),0);
      },"image/png");
    },
    cleanup(){
      observer.disconnect();
      canvas.removeEventListener("wheel",onWheel);
      canvas.removeEventListener("pointerdown",onPointerDown);
      canvas.removeEventListener("pointermove",onPointerMove);
      canvas.removeEventListener("pointerup",onPointerUp);
      canvas.removeEventListener("pointercancel",onPointerUp);
      canvas.removeEventListener("pointermove",onPointerReadout);
    }
  };
}
