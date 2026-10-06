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

export function kMeansPalette(colors,k=5,{iterations=15}={}){
  const points=(colors||[]).map(color=>typeof color==="string"?hexToRgb(color):{
    r:clampByte(color.r),g:clampByte(color.g),b:clampByte(color.b)
  });
  if(!points.length)return[];
  k=Math.max(1,Math.min(Math.floor(k)||1,points.length));

  let centroids=Array.from({length:k},(_,index)=>{
    const point=points[Math.min(points.length-1,Math.floor(index*points.length/k))];
    return {...point};
  });

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

  return centroids
    .map(rgbToHex)
    .sort((left,right)=>{
      const L=hexToRgb(left),R=hexToRgb(right);
      const satL=Math.max(L.r,L.g,L.b)-Math.min(L.r,L.g,L.b);
      const satR=Math.max(R.r,R.g,R.b)-Math.min(R.r,R.g,R.b);
      return satR-satL;
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

export function normalizeTheme(theme={}){
  const fallback={
    primary:"#b3157a",
    navbar1:"#142c3b",
    navbar2:"#1b4256",
    sidebar:"#142c3b",
    background:"#f4f8fa"
  };
  const colors={};
  for(const role of THEME_ROLES)colors[role]=theme.colors?.[role]||theme[role]||fallback[role];
  return {
    name:String(theme.name||"custom-theme").trim()||"custom-theme",
    colors
  };
}

export function themeCss(theme={}){
  const {name,colors}=normalizeTheme(theme);
  const lightText=brightness(colors.background)>128;
  return `[data-theme="${name}"] {
  --primary: ${colors.primary};
  --primary-light: ${adjustColor(colors.primary,20)};
  --primary-dark: ${adjustColor(colors.primary,-20)};
  --primary-transparent: ${hexToRgba(colors.primary,.1)};
  --accent: ${colors.primary};
  --accent-light: ${adjustColor(colors.primary,30)};
  --accent-dark: ${adjustColor(colors.primary,-30)};
  --navbar-bg: linear-gradient(135deg, ${colors.navbar1} 0%, ${colors.navbar2} 100%);
  --navbar-text: #ffffff;
  --navbar-hover: rgba(255,255,255,.1);
  --sidebar-bg: ${colors.sidebar};
  --sidebar-text: #ffffff;
  --sidebar-hover: rgba(255,255,255,.1);
  --sidebar-border: ${adjustColor(colors.sidebar,10)};
  --bg-main: ${colors.background};
  --bg-alt: ${adjustColor(colors.background,-5)};
  --bg-card: ${colors.background};
  --text-main: ${lightText?"#1a202c":"#f1f5f9"};
  --text-secondary: ${lightText?"#4a5568":"#cbd5e1"};
  --text-muted: ${lightText?"#718096":"#94a3b8"};
  --border-color: ${adjustColor(colors.background,-10)};
  --border-hover: ${adjustColor(colors.background,-20)};
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: ${colors.primary};
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
