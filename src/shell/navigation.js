export const PRIMARY_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio"},
  {id:"engineering",label:"Engineering",route:"/engineering"},
  {id:"diverse",label:"Diverse",route:"/diverse"},
  {id:"about",label:"About",route:"/about"},
  {id:"cv",label:"CV",route:"/cv"},
  {id:"contact",label:"Contact",route:"/contact"}
];

export const MOBILE_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio",icon:"◇"},
  {id:"courses",label:"Courses",route:"/courses",icon:"▤"},
  {id:"engineering",label:"Engineering",route:"/engineering",icon:"⌁"},
  {id:"diverse",label:"Diverse",route:"/diverse",icon:"•••"},
  {id:"search",label:"Search",action:"search",icon:"⌕"},
  {id:"more",label:"More",action:"more",icon:"☰"}
];

function navButton(item,active,{mobile=false,coursesLabel="Courses"}={}){
  const label=item.id==="courses"?coursesLabel:item.label;
  const activeClass=active===item.id?"active":"";
  if(item.action==="more"){
    return `<button data-mobile-more-toggle type="button" aria-controls="mobile-more-menu" aria-expanded="false" class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  if(item.action==="search"){
    return `<button data-search-open class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  if(mobile){
    return `<button data-go="${item.route}" class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  return `<button data-go="${item.route}" class="${activeClass}">${label}</button>`;
}

export function renderTopShell(active,{coursesLabel="Courses",account={}}={}){
  const desktopPrimary=PRIMARY_NAV.map(item=>navButton(item,active,{coursesLabel})).join("");
  const mobile=MOBILE_NAV.map(item=>navButton(item,active,{mobile:true,coursesLabel})).join("");
  const signedIn=account?.status==="signed-in";
  const accountName=signedIn?(account?.profile?.name||account?.profile?.email||"Google"):"Sign in";
  const accountInitial=signedIn?String(accountName).trim().slice(0,1).toUpperCase():"○";

  return `<header class="topbar">
    <div class="brand" id="home"><span class="brand-mark"></span>FolkNettside</div>
    <nav class="nav">${desktopPrimary}</nav>
    <span class="top-spacer"></span>
    <nav class="nav"><button data-go="/courses" class="${active==="courses"?"active":""}">${coursesLabel}</button></nav>
    <div class="top-actions">
      <button class="icon-btn" data-search-open aria-label="Search">⌕</button>
      <button class="account-chip ${signedIn?"signed-in":""}" data-go="/settings/connections" aria-label="${signedIn?`Account: ${accountName}`:"Sign in"}"><span>${accountInitial}</span><em>${accountName}</em></button>
      <button class="icon-btn" data-go="/settings" aria-label="Settings">⚙</button>
    </div>
  </header>
  <nav class="mobile-nav" aria-label="Primary">${mobile}</nav>
  <nav class="mobile-more-menu" id="mobile-more-menu" aria-label="Additional navigation" hidden>
    <button data-go="/about">About</button>
    <button data-go="/cv">CV</button>
    <button data-go="/contact">Contact</button>
    <button data-go="/settings">Settings</button>
  </nav>`;
}

export function bindShellNavigation(root,{navigate,openSearch,onHome}){
  root.querySelectorAll("[data-go]").forEach(button=>{
    button.addEventListener("click",()=>navigate(button.dataset.go));
  });
  const moreButton=root.querySelector("[data-mobile-more-toggle]");
  const moreMenu=root.querySelector("#mobile-more-menu");
  moreButton?.addEventListener("click",()=>{
    if(!moreMenu)return;
    moreMenu.hidden=!moreMenu.hidden;
    moreButton.setAttribute("aria-expanded",String(!moreMenu.hidden));
  });
  root.querySelector("#home")?.addEventListener("click",onHome);
  root.querySelectorAll("[data-search-open]").forEach(button=>{
    button.addEventListener("click",openSearch);
  });
}
