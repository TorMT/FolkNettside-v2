import {dataBounds,diagramDatasets,diagramType} from "./coolprop-diagram-core.js?v=5847de308f81a28abf005e6bee53d1782423cc42";

function css(name,fallback){
  const value=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value||fallback;
}

function datasetStyle(kind){
  if(kind==="states")return {stroke:css("--accent","#b3157a"),width:2.2,dash:[],point:true};
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
  container.append(canvas);
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
      if(index===0)context.moveTo(x,y);else context.lineTo(x,y);
    });
    if(dataset.kind!=="states")context.stroke();

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
  }

  function reset(){view={...initial};draw()}

  function onWheel(event){
    event.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const px=event.clientX-rect.left,py=event.clientY-rect.top;
    const {width,height}=dims();
    const cx=invX(px,width),cy=invY(py,height);
    const factor=Math.exp(event.deltaY*.001);
    view={
      xmin:cx+(view.xmin-cx)*factor,
      xmax:cx+(view.xmax-cx)*factor,
      ymin:cy+(view.ymin-cy)*factor,
      ymax:cy+(view.ymax-cy)*factor
    };
    draw();
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
  canvas.addEventListener("pointerdown",onPointerDown);
  canvas.addEventListener("pointermove",onPointerMove);
  canvas.addEventListener("pointerup",onPointerUp);
  canvas.addEventListener("pointercancel",onPointerUp);

  const observer=new ResizeObserver(draw);
  observer.observe(container);
  draw();

  return {
    datasets,
    reset,
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
    }
  };
}
