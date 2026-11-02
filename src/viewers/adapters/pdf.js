// Continuous multi-page PDF reader. The native fallback remains available if
// PDF.js, CORS or a browser-specific PDF implementation is unavailable.
const PDFJS="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs";
const WORKER="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";

function nativeFallback(container,resource,message){
  const notice=document.createElement("p");
  notice.className="muted";
  notice.style.cssText="padding:10px 14px;margin:0";
  notice.textContent=message;
  const frame=document.createElement("iframe");
  frame.className="pdf-frame";
  frame.src=resource.path;
  frame.title=resource.label||resource.name||"PDF";
  frame.style.cssText="width:100%;height:calc(100% - 48px);min-height:60vh;border:0";
  container.replaceChildren(notice,frame);
  return {info:"PDF · nettleservisning (åpne original ved problemer)"};
}

export async function render(container,resource){
  let pdf=null,observer=null,resizeObserver=null,disposed=false;
  const tasks=new Map(),loaded=new Map(),pages=new Map();
  const stop=()=>{
    disposed=true;
    observer?.disconnect();resizeObserver?.disconnect();
    for(const task of tasks.values())task.cancel();
    tasks.clear();
    pdf?.destroy();
  };
  try{
    const pdfjs=await import(PDFJS);
    if(disposed)return {cleanup:stop};
    pdfjs.GlobalWorkerOptions.workerSrc=WORKER;
    pdf=await pdfjs.getDocument({url:resource.path}).promise;
    if(disposed){stop();return {cleanup:stop}}
    const style=document.createElement("style");
    style.textContent=`
      .pdf-reader{height:100%;min-height:0;display:flex;flex-direction:column;background:#e6e8eb;color:#17212b}
      .pdf-reader-controls{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;
        padding:8px;background:#fff;border-bottom:1px solid #cdd3d9;flex:none}
      .pdf-reader-controls button{background:#f5f7f9;border:1px solid #aab3bd;border-radius:5px;
        padding:7px 11px;color:#17212b;min-height:36px;cursor:pointer}
      .pdf-reader-controls input{width:5ch;max-width:65px;text-align:center;font:inherit;padding:6px}
      .pdf-reader-scroll{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
        flex:1;min-height:0;padding:14px 8px 30px;scrollbar-gutter:stable}
      .pdf-reader-page{position:relative;margin:0 auto 14px;background:white;
        box-shadow:0 1px 7px #0002;max-width:100%;overflow:hidden}
      .pdf-reader-page canvas{display:block;width:100%;height:auto}
      .pdf-reader-page-label{position:absolute;top:12px;left:12px;color:#555;font-size:12px}
      @media(max-width:600px){.pdf-reader-scroll{padding:6px 3px 18px}
        .pdf-reader-page{margin-bottom:8px}.pdf-reader-controls{gap:6px;padding:6px}}
    `;
    const wrapper=document.createElement("div");wrapper.className="pdf-reader";
    const controls=document.createElement("div");controls.className="pdf-reader-controls";
    const prev=document.createElement("button");prev.type="button";prev.textContent="Forrige";
    const next=document.createElement("button");next.type="button";next.textContent="Neste";
    const input=document.createElement("input");input.type="number";input.min="1";
    input.max=String(pdf.numPages);input.value="1";input.setAttribute("aria-label","Gå til PDF-side");
    const count=document.createElement("span");count.textContent="/ "+pdf.numPages;
    const label=document.createElement("span");label.textContent="Side";
    controls.append(prev,label,input,count,next);
    const scroll=document.createElement("div");scroll.className="pdf-reader-scroll";
    scroll.setAttribute("aria-label","PDF-sider, scroll for å lese hele dokumentet");
    wrapper.append(controls,scroll);
    container.replaceChildren(style,wrapper);
    const first=await pdf.getPage(1);
    if(disposed)return {cleanup:stop};
    const firstView=first.getViewport({scale:1});
    const ratio=firstView.height/firstView.width;
    const holders=[];
    for(let n=1;n<=pdf.numPages;n++){
      const holder=document.createElement("section");
      holder.className="pdf-reader-page";holder.dataset.page=String(n);
      holder.setAttribute("aria-label","Side "+n+" av "+pdf.numPages);
      holder.style.aspectRatio=firstView.width+" / "+firstView.height;
      const marker=document.createElement("span");
      marker.className="pdf-reader-page-label";marker.textContent="Side "+n;
      holder.append(marker);scroll.append(holder);holders.push(holder);
    }
    const pageWidth=()=>Math.max(1,scroll.clientWidth-18);
    let generation=0;
    async function draw(holder,gen){
      const n=Number(holder.dataset.page);
      if(loaded.get(n)===gen||tasks.has(n)||disposed)return;
      const page=n===1?first:await pdf.getPage(n);
      if(disposed||gen!==generation)return;
      const natural=page.getViewport({scale:1});
      const scale=pageWidth()/natural.width;
      const viewport=page.getViewport({scale});
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(viewport.width*dpr));
      canvas.height=Math.max(1,Math.round(viewport.height*dpr));
      canvas.style.width="100%";canvas.style.height="auto";
      const ctx=canvas.getContext("2d",{alpha:false});
      if(!ctx)return;
      holder.style.aspectRatio=natural.width+" / "+natural.height;
      holder.replaceChildren(canvas);
      const task=page.render({canvasContext:ctx,viewport,transform:dpr===1?undefined:[dpr,0,0,dpr,0,0]});
      tasks.set(n,task);
      try{
        await task.promise;
        if(!disposed&&gen===generation)loaded.set(n,gen);
      }catch(error){
        if(error?.name!=="RenderingCancelledException"&&!disposed){
          holder.textContent="Kunne ikke vise side "+n+". Åpne originalfilen.";
        }
      }finally{if(tasks.get(n)===task)tasks.delete(n)}
    }
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)void draw(entry.target,generation);
    },{root:scroll,rootMargin:"900px 0px"});
    holders.forEach(holder=>observer.observe(holder));
    const visiblePage=()=>{
      const top=scroll.getBoundingClientRect().top;
      let best=1,distance=Infinity;
      for(const holder of holders){
        const rect=holder.getBoundingClientRect();
        const diff=Math.abs(rect.top-top);
        if(diff<distance){distance=diff;best=Number(holder.dataset.page)}
        if(rect.top>top+scroll.clientHeight)break;
      }
      return best;
    };
    let pending=false;
    scroll.addEventListener("scroll",()=>{
      if(pending)return;pending=true;
      requestAnimationFrame(()=>{pending=false;if(!disposed)input.value=String(visiblePage())});
    },{passive:true});
    const goto=n=>{
      const target=holders[Math.min(pdf.numPages,Math.max(1,n))-1];
      target?.scrollIntoView({block:"start",behavior:"smooth"});
    };
    prev.addEventListener("click",()=>goto(Number(input.value)-1));
    next.addEventListener("click",()=>goto(Number(input.value)+1));
    input.addEventListener("change",()=>goto(Number(input.value)||1));
    let priorWidth=scroll.clientWidth;
    resizeObserver=new ResizeObserver(()=>{
      const width=scroll.clientWidth;
      if(Math.abs(width-priorWidth)<2||disposed)return;
      priorWidth=width;generation++;loaded.clear();
      for(const task of tasks.values())task.cancel();
      for(const holder of holders){
        holder.replaceChildren();
        const marker=document.createElement("span");
        marker.className="pdf-reader-page-label";marker.textContent="Side "+holder.dataset.page;
        holder.append(marker);
      }
      for(const holder of holders){
        const r=holder.getBoundingClientRect(),s=scroll.getBoundingClientRect();
        if(r.bottom>s.top-900&&r.top<s.bottom+900)void draw(holder,generation);
      }
    });
    resizeObserver.observe(scroll);
    return {info:"PDF · "+pdf.numPages+" sider · scroll for å bla",cleanup:stop};
  }catch(error){
    stop();
    return nativeFallback(container,resource,"Kontinuerlig PDF-visning er utilgjengelig her. Prøv å scrolle i feltet, eller bruk «Open original».");
  }
}
