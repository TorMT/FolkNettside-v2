// Which hash routes show the start (portfolio) page.
// "" and "/" are the bare site address; a fragment without a leading slash is an
// in-page anchor from an old link or another tool, not a route, so it also lands on
// the start page instead of an error.
export function isStartRoute(path){
  const value=String(path??"");
  return value===""||value==="/"||value==="/portfolio"||value==="/portfolio/"||!value.startsWith("/");
}
