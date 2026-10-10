export const MATPRIS_ENDPOINT="/includes/matpris/api.php";
/** GitHub Pages serves static files and cannot execute PHP. */
export function matprisBackendAvailable({hostname=globalThis.location?.hostname,endpoint}={}){
  if(endpoint)return true; // Explicit external integration supplied by owner.
  return !String(hostname||"").toLowerCase().endsWith(".github.io");
}


const finite=value=>{
  const n=Number(value);
  return Number.isFinite(n)?n:null;
};

function priceValue(raw){
  if(raw&&typeof raw==="object")return finite(raw.price??raw.amount??raw.value);
  return finite(raw);
}

function storeFrom(raw){
  const nested=raw?.current_price&&typeof raw.current_price==="object"?raw.current_price.store:null;
  const store=raw?.store||nested||{};
  return {
    name:String(store.name||raw?.store_name||"Ukjent butikk"),
    code:String(store.code||raw?.store_code||""),
    url:String(store.url||"")
  };
}

export function normalizeProduct(raw={}){
  const price=priceValue(raw.current_price??raw.price);
  const unitPrice=priceValue(raw.current_unit_price??raw.unit_price);
  return {
    id:raw.id??null,
    ean:String(raw.ean||"").trim(),
    name:String(raw.name||"Uten navn"),
    brand:String(raw.brand||""),
    vendor:String(raw.vendor||""),
    price,
    unitPrice,
    weight:finite(raw.weight),
    weightUnit:String(raw.weight_unit||""),
    store:storeFrom(raw),
    url:String(raw.url||""),
    updatedAt:String(raw.updated_at||raw.last_checked||""),
    priceHistory:Array.isArray(raw.price_history)?raw.price_history:[]
  };
}

export function unwrapProducts(payload){
  const data=payload?.data??payload;
  if(Array.isArray(data))return data.map(normalizeProduct);
  if(data&&typeof data==="object"){
    if(Array.isArray(data.products))return data.products.map(normalizeProduct);
    return [normalizeProduct(data)];
  }
  return [];
}

export function groupProductsByEan(products=[]){
  const groups=new Map();
  for(const itemRaw of products){
    const item=itemRaw?.name!==undefined&&itemRaw?.store!==undefined?itemRaw:normalizeProduct(itemRaw);
    const key=item.ean||`id:${item.id??item.name}`;
    if(!groups.has(key))groups.set(key,{key,ean:item.ean,name:item.name,brand:item.brand,vendor:item.vendor,offers:[]});
    groups.get(key).offers.push(item);
  }
  return [...groups.values()].map(group=>{
    group.offers.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
    group.cheapest=group.offers.find(item=>item.price!==null)||group.offers[0]||null;
    group.storeCount=new Set(group.offers.map(item=>item.store.code||item.store.name)).size;
    return group;
  }).sort((a,b)=>(a.cheapest?.price??Infinity)-(b.cheapest?.price??Infinity));
}

export function matprisProxyUrl(action,params={},endpoint=MATPRIS_ENDPOINT){
  const url=new URL(endpoint,globalThis.location?.origin||"https://example.invalid");
  url.searchParams.set("action",action);
  for(const [key,value] of Object.entries(params)){
    if(value!==undefined&&value!==null&&value!=="")url.searchParams.set(key,String(value));
  }
  if(/^https?:/i.test(endpoint))return url.toString();
  return url.pathname+url.search;
}

async function request(action,params,options={}){
  const fetchImpl=options.fetchImpl||globalThis.fetch;
  if(typeof fetchImpl!=="function")throw new Error("Fetch is unavailable");
  const response=await fetchImpl(matprisProxyUrl(action,params,options.endpoint||MATPRIS_ENDPOINT),{
    headers:{Accept:"application/json"},
    signal:options.signal
  });
  const text=await response.text();
  let payload=null;
  try{payload=JSON.parse(text)}catch{throw new Error("Matpris backend returned an invalid response")}
  if(!response.ok)throw new Error(payload?.error||`Matpris backend failed (${response.status})`);
  return payload;
}

export async function searchMatpris(query,options={}){
  const q=String(query||"").trim();
  if(q.length<2)throw new Error("Skriv minst to tegn");
  const payload=await request("search",{
    q,
    page:options.page||1,
    size:options.size||50,
    sort:options.sort||"price_asc"
  },options);
  return {payload,products:unwrapProducts(payload)};
}

export async function compareMatprisEan(ean,options={}){
  const code=String(ean||"").replace(/\D/g,"");
  if(code.length<8||code.length>14)throw new Error("Ugyldig EAN");
  const payload=await request("compare",{ean:code},options);
  return {payload,products:unwrapProducts(payload)};
}
