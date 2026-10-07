import {
  THEME_ROLES,autoAssignTheme,kMeansPalette,normalizeTheme,
  themeCss,themeJSON,themeRegistrySnippet
} from "./theme-studio-core.js?v=0c572609238258b358cd83accef2e828f95d7316";

const ROLE_LABELS={
  primary:"Primary",
  navbar1:"Navbar start",
  navbar2:"Navbar end",
  sidebar:"Sidebar",
  background:"Background"
};

function esc(value){
  return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function roleControls(theme,palette){
  return THEME_ROLES.map(role=>{
    const selected=theme.colors[role];
    return '<div class="theme-role-row">'+
      '<label><span>'+ROLE_LABELS[role]+'</span><input type="color" data-theme-role="'+role+'" value="'+selected+'"></label>'+
      (palette.length?'<div class="theme-palette-mini">'+palette.map(color=>
        '<button type="button" data-theme-assign="'+role+'" data-theme-color="'+color+'" style="background:'+color+'" class="'+(color===selected?"selected":"")+'" title="'+color+'"></button>'
      ).join("")+'</div>':"")+
    '</div>';
  }).join("");
}

function preview(theme){
  return '<div class="theme-live-preview">'+
    '<div class="theme-preview-navbar" style="background:linear-gradient(135deg,'+theme.colors.navbar1+','+theme.colors.navbar2+')">'+
      '<strong>FolkNettside</strong><span>Projects · Engineering · Courses</span>'+
    '</div>'+
    '<div class="theme-preview-body">'+
      '<aside style="background:'+theme.colors.sidebar+'"><strong>Sidebar</strong><span>Overview</span><span>Resources</span><span>Tools</span></aside>'+
      '<main style="background:'+theme.colors.background+'">'+
        '<h2 style="color:'+theme.colors.primary+'">Theme preview</h2>'+
        '<div class="theme-preview-card" style="border-left-color:'+theme.colors.primary+'"><strong>Engineering card</strong><p>The studio previews the same role mapping used by the legacy generators.</p><button style="background:'+theme.colors.primary+'">Action</button></div>'+
      '</main>'+
    '</div>'+
  '</div>';
}

export function themeStudioHTML(state={}){
  const mode=state.mode==="image"?"image":"manual";
  const theme=normalizeTheme({name:state.name||"custom-theme",colors:state.colors||{}});
  const palette=state.palette||[];

  return '<main class="tool-page theme-studio-page">'+
    '<div class="crumbs">Settings / Developer / Theme Studio</div>'+
    '<header class="tool-header"><div><span class="project-kicker">Developer appearance tool</span><h1>Theme Studio</h1>'+
      '<p>One Settings-owned replacement for the old Theme Creator and Image→Theme tools. It generates theme assets without creating a second runtime theme system.</p>'+
      '<div class="tool-parity-banner"><strong>No-loss migration:</strong> manual authoring, image palette extraction, auto-assign, preview and CSS/JS/JSON outputs are preserved. Legacy links remain available during review.</div>'+
    '</div></header>'+
    '<div class="theme-mode-tabs">'+
      '<button data-theme-mode="manual" class="'+(mode==="manual"?"active":"")+'">Manual theme</button>'+
      '<button data-theme-mode="image" class="'+(mode==="image"?"active":"")+'">Image → theme</button>'+
    '</div>'+
    '<section class="theme-studio-layout">'+
      '<aside class="tool-inputs theme-studio-controls">'+
        '<label class="field"><span>Theme name</span><input id="theme-studio-name" value="'+esc(theme.name)+'"></label>'+
        (mode==="image"?'<div class="theme-upload" id="theme-upload" tabindex="0">'+
          '<strong>Drop an image here</strong><span>or click to choose JPG/PNG/WebP</span>'+
          '<input id="theme-image-input" type="file" accept="image/*" hidden>'+
        '</div><button class="btn" id="theme-sample-image">Load sample image</button>'+
        (state.imageSrc?'<img class="theme-image-preview" src="'+esc(state.imageSrc)+'" alt="Theme source preview">':"")+
        '<div class="theme-palette-grid">'+palette.map(color=>'<button type="button" data-theme-color-only="'+color+'" style="background:'+color+'" title="'+color+'"><span>'+color+'</span></button>').join("")+'</div>'+
        '<button class="btn" id="theme-auto-assign" '+(palette.length?"":"disabled")+'>Auto-assign palette</button>':"")+
        '<div id="theme-role-controls">'+roleControls(theme,palette)+'</div>'+
        '<div class="crystal-toggle-grid">'+
          '<button class="btn" id="theme-reset">Reset</button>'+
          '<button class="btn primary" id="theme-copy-css">Copy CSS</button>'+
          '<button class="btn" id="theme-copy-js">Copy JS</button>'+
          '<button class="btn" id="theme-download-json">Download JSON</button>'+
        '</div>'+
      '</aside>'+
      '<section class="theme-studio-main">'+preview(theme)+
        '<div class="theme-output-grid">'+
          '<section><div class="title-row"><strong>CSS</strong><button class="tool-action" id="theme-copy-css-2">Copy</button></div><pre id="theme-css-output"></pre></section>'+
          '<section><div class="title-row"><strong>Registry JS</strong><button class="tool-action" id="theme-copy-js-2">Copy</button></div><pre id="theme-js-output"></pre></section>'+
        '</div>'+
      '</section>'+
    '</section>'+
  '</main>';
}

function pixelsFromImage(img){
  const canvas=document.createElement("canvas");
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  const max=260;
  const scale=Math.min(1,max/img.naturalWidth,max/img.naturalHeight);
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const colors=[];
  for(let i=0;i<data.length;i+=16){
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    const nearBlack=r<18&&g<18&&b<18;
    const nearWhite=r>242&&g>242&&b>242;
    if(a>200&&!nearBlack&&!nearWhite)colors.push({r,g,b});
  }
  return colors;
}

export async function imageFileToPalette(file){
  if(!file?.type?.startsWith("image/"))throw new Error("Choose an image file");
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error("Could not decode image"));
      img.src=url;
    });
    const palette=kMeansPalette(pixelsFromImage(img),5);
    const preview=await new Promise(resolve=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||""));
      reader.readAsDataURL(file);
    });
    return {palette,imageSrc:preview};
  }finally{
    URL.revokeObjectURL(url);
  }
}

function downloadText(filename,text,type){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}

export function bindThemeStudio(root,state,onState){
  const readTheme=()=>{
    const colors={};
    for(const role of THEME_ROLES){
      colors[role]=root.querySelector('[data-theme-role="'+role+'"]')?.value||state.colors?.[role];
    }
    return normalizeTheme({
      name:root.querySelector("#theme-studio-name")?.value||state.name,
      colors
    });
  };

  const syncOutputs=()=>{
    const theme=readTheme();
    const css=themeCss(theme);
    const js=themeRegistrySnippet(theme);
    const cssTarget=root.querySelector("#theme-css-output");
    const jsTarget=root.querySelector("#theme-js-output");
    if(cssTarget)cssTarget.textContent=css;
    if(jsTarget)jsTarget.textContent=js;
    return {theme,css,js};
  };
  syncOutputs();

  root.querySelectorAll("[data-theme-mode]").forEach(button=>button.addEventListener("click",()=>{
    onState({...state,mode:button.dataset.themeMode},true);
  }));

  const updateAndRender=()=>{
    const {theme}=syncOutputs();
    onState({...state,name:theme.name,colors:theme.colors},true);
  };

  root.querySelector("#theme-studio-name")?.addEventListener("change",updateAndRender);
  root.querySelectorAll("[data-theme-role]").forEach(input=>input.addEventListener("input",updateAndRender));
  root.querySelectorAll("[data-theme-assign]").forEach(button=>button.addEventListener("click",()=>{
    const colors={...readTheme().colors,[button.dataset.themeAssign]:button.dataset.themeColor};
    onState({...state,name:readTheme().name,colors},true);
  }));

  root.querySelector("#theme-auto-assign")?.addEventListener("click",()=>{
    const colors=autoAssignTheme(state.palette||[]);
    onState({...state,name:readTheme().name,colors},true);
  });

  root.querySelector("#theme-reset")?.addEventListener("click",()=>{
    onState({mode:state.mode||"manual",name:"custom-theme",colors:{},palette:[],imageSrc:""},true);
  });

  const copy=async(kind)=>{
    const output=syncOutputs();
    const text=kind==="css"?output.css:output.js;
    await navigator.clipboard.writeText(text);
  };
  root.querySelector("#theme-copy-css")?.addEventListener("click",()=>copy("css"));
  root.querySelector("#theme-copy-css-2")?.addEventListener("click",()=>copy("css"));
  root.querySelector("#theme-copy-js")?.addEventListener("click",()=>copy("js"));
  root.querySelector("#theme-copy-js-2")?.addEventListener("click",()=>copy("js"));
  root.querySelector("#theme-download-json")?.addEventListener("click",()=>{
    const theme=readTheme();
    downloadText(theme.name+".json",themeJSON(theme),"application/json");
  });

  const input=root.querySelector("#theme-image-input");
  const upload=root.querySelector("#theme-upload");
  const useFile=async file=>{
    try{
      const image=await imageFileToPalette(file);
      const colors=autoAssignTheme(image.palette);
      onState({...state,...image,colors,name:readTheme().name,mode:"image"},true);
    }catch(error){
      upload?.setAttribute("data-error",String(error?.message||error));
    }
  };
  upload?.addEventListener("click",()=>input?.click());
  upload?.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();input?.click()}});
  upload?.addEventListener("dragover",event=>{event.preventDefault();upload.classList.add("dragover")});
  upload?.addEventListener("dragleave",()=>upload.classList.remove("dragover"));
  upload?.addEventListener("drop",event=>{
    event.preventDefault();
    upload.classList.remove("dragover");
    useFile(event.dataTransfer?.files?.[0]);
  });
  input?.addEventListener("change",()=>useFile(input.files?.[0]));
  root.querySelector("#theme-sample-image")?.addEventListener("click",async()=>{
    const canvas=document.createElement("canvas");
    canvas.width=240;
    canvas.height=160;
    const ctx=canvas.getContext("2d");
    const sampleColors=["#b3157a","#142c3b","#2f7fa4","#8f5a00","#dce7ec"];
    sampleColors.forEach((color,index)=>{
      ctx.fillStyle=color;
      ctx.fillRect(index*48,0,48,160);
    });
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob){
      upload?.setAttribute("data-error","Could not create sample image");
      return;
    }
    await useFile(new File([blob],"theme-sample.png",{type:"image/png"}));
  });
}
