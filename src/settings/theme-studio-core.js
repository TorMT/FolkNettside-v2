export const THEME_ROLES=["primary","navbar1","navbar2","sidebar","background"];

export function clampByte(value){
  return Math.max(0,Math.min(255,Math.round(Number(value)||0)));
}

export function rgbToHex({r,g,b}){
  return "#"+[r,g,b].map(value=>clampByte(value).toString(16).padStart(2,"0")).join("");
}

export function hexToRgb(hex){
  const value=String(hex||"").trim().replace(/^#/,"");
  if(!/^[0-9a-f]{6}$/i.test(value))throw new Error("Expected 6-digit hex color");
  return {
    r:parseInt(value.slice(0,2),16),
    g:parseInt(value.slice(2,4),16),
    b:parseInt(value.slice(4,6),16)
  };
}

export function brightness(hex){
  const {r,g,b}=hexToRgb(hex);
  return (r+g+b)/3;
}

export function adjustColor(hex,percent){
  const {r,g,b}=hexToRgb(hex);
  const amount=Math.round(2.55*Number(percent||0));
  return rgbToHex({r:r+amount,g:g+amount,b:b+amount});
}

export function hexToRgba(hex,alpha=1){
  const {r,g,b}=hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Number(alpha)})`;
}

export function colorDistance(a,b){
  const A=typeof a==="string"?hexToRgb(a):a;
  const B=typeof b==="string"?hexToRgb(b):b;
  return Math.hypot(A.r-B.r,A.g-B.g,A.b-B.b);
}

export function kMeansPalette(colors,k=5,{iterations=18}={}){
  const points=(colors||[]).map(color=>typeof color==="string"?hexToRgb(color):{
    r:clampByte(color.r),g:clampByte(color.g),b:clampByte(color.b)
  });
  if(!points.length)return[];

  const unique=[...new Map(points.map(point=>[rgbToHex(point),point])).values()];
  k=Math.max(1,Math.min(Math.floor(k)||1,unique.length));

  // Deterministic farthest-point seeding avoids duplicate centroids when
  // large flat image regions dominate the pixel stream.
  const luminance=point=>.2126*point.r+.7152*point.g+.0722*point.b;
  const first=[...unique].sort((a,b)=>luminance(a)-luminance(b))[0];
  let centroids=[{...first}];
  while(centroids.length<k){
    let best=null,bestDistance=-1;
    for(const point of unique){
      const nearest=Math.min(...centroids.map(center=>colorDistance(point,center)));
      if(nearest>bestDistance){
        bestDistance=nearest;
        best=point;
      }
    }
    centroids.push({...best});
  }

  for(let iteration=0;iteration<iterations;iteration++){
    const clusters=Array.from({length:k},()=>[]);
    for(const point of points){
      let best=0,bestDistance=Infinity;
      centroids.forEach((centroid,index)=>{
        const distance=colorDistance(point,centroid);
        if(distance<bestDistance){bestDistance=distance;best=index}
      });
      clusters[best].push(point);
    }

    centroids=clusters.map((cluster,index)=>{
      if(!cluster.length)return centroids[index];
      const total=cluster.reduce((sum,p)=>({r:sum.r+p.r,g:sum.g+p.g,b:sum.b+p.b}),{r:0,g:0,b:0});
      return {
        r:clampByte(total.r/cluster.length),
        g:clampByte(total.g/cluster.length),
        b:clampByte(total.b/cluster.length)
      };
    });
  }

  return [...new Set(centroids.map(rgbToHex))]
    .sort((left,right)=>{
      const L=hexToRgb(left),R=hexToRgb(right);
      const satL=Math.max(L.r,L.g,L.b)-Math.min(L.r,L.g,L.b);
      const satR=Math.max(R.r,R.g,R.b)-Math.min(R.r,R.g,R.b);
      return satR-satL||brightness(left)-brightness(right);
    });
}
export function autoAssignTheme(palette){
  const colors=[...(palette||[])].filter(Boolean);
  if(!colors.length)throw new Error("Palette is empty");
  const scored=colors.map(hex=>{
    const {r,g,b}=hexToRgb(hex);
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    return {hex,brightness:(r+g+b)/3,saturation:max?((max-min)/max):0};
  });
  const vibrant=[...scored].sort((a,b)=>b.saturation-a.saturation||a.brightness-b.brightness);
  const darkest=[...scored].sort((a,b)=>a.brightness-b.brightness)[0];
  const lightest=[...scored].sort((a,b)=>b.brightness-a.brightness)[0];

  return {
    primary:vibrant[0].hex,
    navbar1:vibrant[0].hex,
    navbar2:(vibrant[1]||vibrant[0]).hex,
    sidebar:darkest.hex,
    background:lightest.brightness>180?lightest.hex:"#ffffff"
  };
}


// WCAG 2.x relative luminance in linear sRGB (not average RGB brightness).
export function relativeLuminance(hex){
  const {r,g,b}=hexToRgb(hex);
  const linear=value=>{
    const c=value/255;
    return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
  };
  return 0.2126*linear(r)+0.7152*linear(g)+0.0722*linear(b);
}

export function contrastRatio(a,b){
  const l1=relativeLuminance(a),l2=relativeLuminance(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

export function readableTextColor(background){
  return contrastRatio(background,"#ffffff")>=contrastRatio(background,"#000000")
    ?"#ffffff":"#000000";
}

// Find the closest blend toward the more contrasting black/white endpoint.
export function ensureTextContrast(color,background,minimum=4.5){
  if(contrastRatio(color,background)>=minimum)return color.toLowerCase();
  const target=readableTextColor(background);
  const source=hexToRgb(color),end=hexToRgb(target);
  let low=0,high=1;
  for(let i=0;i<22;i++){
    const t=(low+high)/2;
    const candidate=rgbToHex({
      r:source.r+(end.r-source.r)*t,
      g:source.g+(end.g-source.g)*t,
      b:source.b+(end.b-source.b)*t
    });
    if(contrastRatio(candidate,background)>=minimum)high=t;
    else low=t;
  }
  return rgbToHex({
    r:source.r+(end.r-source.r)*high,
    g:source.g+(end.g-source.g)*high,
    b:source.b+(end.b-source.b)*high
  });
}

function contrastSafeGradient(a,b,minimum=4.5){
  // An almost black→white gradient cannot have one readable text color
  // across both ends. Alter display endpoints, never the source palette.
  const options=["#ffffff","#000000"].map(text=>{
    const start=ensureTextContrast(a,text,minimum);
    const end=ensureTextContrast(b,text,minimum);
    return {start,end,text,change:colorDistance(a,start)+colorDistance(b,end)};
  });
  return options.sort((x,y)=>x.change-y.change)[0];
}

export function themeContrastReport(input={}){
  const theme=normalizeTheme(input);
  const c=theme.colors;
  const gradient=contrastSafeGradient(c.navbar1,c.navbar2);
  const sidebarText=readableTextColor(c.sidebar);
  const actionText=readableTextColor(c.primary);
  const heading=ensureTextContrast(c.primary,c.background);
  const mainText=readableTextColor(c.background);
  const secondaryText=ensureTextContrast(
    mainText==="#000000"?"#4a5568":"#cbd5e1",c.background);
  const mutedText=ensureTextContrast(
    mainText==="#000000"?"#718096":"#94a3b8",c.background);
  const border=ensureTextContrast("#9aaab5",c.background,3);
  const hoverBorder=ensureTextContrast("#778b9a",c.background,3);
  const checks=[
    {label:"Navbar (start)",foreground:gradient.text,background:gradient.start},
    {label:"Navbar (end)",foreground:gradient.text,background:gradient.end},
    {label:"Sidebar",foreground:sidebarText,background:c.sidebar},
    {label:"Primary action",foreground:actionText,background:c.primary},
    {label:"Heading/link",foreground:heading,background:c.background},
    {label:"Main text",foreground:mainText,background:c.background},
    {label:"Secondary text",foreground:secondaryText,background:c.background},
    {label:"Muted text",foreground:mutedText,background:c.background}
  ].map(item=>({...item,ratio:contrastRatio(item.foreground,item.background)}));
  const adjustments=[];
  if(gradient.start!==c.navbar1||gradient.end!==c.navbar2){
    adjustments.push("Navbar display gradient was adjusted for readable text.");
  }
  if(heading!==c.primary){
    adjustments.push("Heading/link color was adjusted against the background.");
  }
  return {colors:{
    navbar1:gradient.start,navbar2:gradient.end,navbarText:gradient.text,
    sidebar:c.sidebar,sidebarText,actionText,heading,mainText,secondaryText,
    mutedText,border,hoverBorder
  },checks,adjustments};
}

export function normalizeTheme(theme={}){
  const fallback={
    primary:"#b3157a",
    navbar1:"#142c3b",
    navbar2:"#1b4256",
    sidebar:"#142c3b",
    background:"#f4f8fa"
  };
  const colors={};
  for(const role of THEME_ROLES){
    const candidate=String(theme.colors?.[role]||theme[role]||fallback[role]).trim();
    colors[role]=/^#[0-9a-f]{6}$/i.test(candidate)?candidate.toLowerCase():fallback[role];
  }
  // Theme names also become CSS attribute selectors and download file names.
  const safeName=String(theme.name||"custom-theme").trim()
    .replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,64);
  return {
    name:safeName||"custom-theme",
    colors
  };
}

export function themeCss(theme={}){
  const {name,colors}=normalizeTheme(theme);
  const {colors:readable}=themeContrastReport({name,colors});
  return `[data-theme="${name}"] {
  --primary: ${colors.primary};
  --primary-light: ${adjustColor(colors.primary,20)};
  --primary-dark: ${adjustColor(colors.primary,-20)};
  --primary-transparent: ${hexToRgba(colors.primary,.1)};
  --primary-text: ${readable.actionText};
  --primary-readable: ${readable.heading};
  --accent: ${colors.primary};
  --accent-text: ${readable.actionText};
  --accent-light: ${adjustColor(colors.primary,30)};
  --accent-dark: ${adjustColor(colors.primary,-30)};
  --navbar-bg: linear-gradient(135deg, ${readable.navbar1} 0%, ${readable.navbar2} 100%);
  --navbar-text: ${readable.navbarText};
  --navbar-hover: rgba(255,255,255,.1);
  --sidebar-bg: ${colors.sidebar};
  --sidebar-text: ${readable.sidebarText};
  --sidebar-hover: rgba(255,255,255,.1);
  --sidebar-border: ${ensureTextContrast(adjustColor(colors.sidebar,10),colors.sidebar,3)};
  --bg-main: ${colors.background};
  --bg-alt: ${adjustColor(colors.background,-5)};
  --bg-card: ${colors.background};
  --text-main: ${readable.mainText};
  --text-secondary: ${readable.secondaryText};
  --text-muted: ${readable.mutedText};
  --border-color: ${readable.border};
  --border-hover: ${readable.hoverBorder};
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: ${readable.heading};
}`;
}

export function themeRegistrySnippet(theme={}){
  const {name,colors}=normalizeTheme(theme);
  const label=name.split("-").filter(Boolean).map(word=>word[0]?.toUpperCase()+word.slice(1)).join(" ");
  return `"${name}": {
  name: "${label}",
  color: "${colors.primary}"
}`;
}

export function themeJSON(theme={}){
  const normalized=normalizeTheme(theme);
  return JSON.stringify({
    version:1,
    ...normalized,
    generatedBy:"FolkNettside-v2 Theme Studio"
  },null,2);
}
