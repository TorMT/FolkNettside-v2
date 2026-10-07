export const PRIMARY_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio"},
  {id:"engineering",label:"Engineering",route:"/engineering"},
  {id:"diverse",label:"Diverse",route:"/diverse"},
  {id:"about",label:"About",route:"/portfolio"},
  {id:"cv",label:"CV",route:"/portfolio"},
  {id:"contact",label:"Contact",route:"/portfolio"}
];

export const MOBILE_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio",icon:"◇"},
  {id:"courses",label:"Courses",route:"/courses",icon:"▤"},
  {id:"engineering",label:"Engineering",route:"/engineering",icon:"⌁"},
  {id:"diverse",label:"Diverse",route:"/diverse",icon:"•••"}
];

function navButton(item,active,{mobile=false,coursesLabel="Courses"}={}){
  const label=item.id==="courses"?coursesLabel:item.label;
  const activeClass=active===item.id?"active":"";
  if(item.action==="search"){
    return `<button data-search-open class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  if(mobile){
    return `<button data-go="${item.route}" class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  return `<button data-go="${item.route}" class="${activeClass}">${label}</button>`;
}

export function renderTopShell(active,{coursesLabel="Courses"}={}){
  const desktopPrimary=PRIMARY_NAV.map(item=>navButton(item,active,{coursesLabel})).join("");
  const mobile=MOBILE_NAV.map(item=>navButton(item,active,{mobile:true,coursesLabel})).join("");

  return `<header class="topbar">
    <div class="brand" id="home"><span class="brand-mark"></span>FolkNettside</div>
    <nav class="nav">${desktopPrimary}</nav>
    <span class="top-spacer"></span>
    <nav class="nav"><button data-go="/courses" class="${active==="courses"?"active":""}">${coursesLabel}</button></nav>
    <div class="top-actions">
      <button class="icon-btn" data-search-open aria-label="Search">⌕</button>
      <button class="icon-btn" data-go="/settings" aria-label="Settings">⚙</button>
    </div>
  </header>
  <nav class="mobile-nav" aria-label="Primary">${mobile}</nav>`;
}

export function bindShellNavigation(root,{navigate,openSearch,onHome}){
  root.querySelectorAll("[data-go]").forEach(button=>{
    button.addEventListener("click",()=>navigate(button.dataset.go));
  });
  root.querySelector("#home")?.addEventListener("click",onHome);
  root.querySelectorAll("[data-search-open]").forEach(button=>{
    button.addEventListener("click",openSearch);
  });
}
