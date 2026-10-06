export function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"]/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  })[char]);
}

export function extension(path){
  return (String(path).split("?")[0].split(".").pop() || "").toLowerCase();
}

export async function fetchText(path){
  const response=await fetch(path);
  if(!response.ok) throw new Error(`HTTP ${response.status} while loading ${path}`);
  return response.text();
}

export async function fetchJSON(path){
  const response=await fetch(path);
  if(!response.ok) throw new Error(`HTTP ${response.status} while loading ${path}`);
  return response.json();
}
