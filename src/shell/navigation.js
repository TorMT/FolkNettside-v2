import {escapeHTML} from "../viewers/utils.js?v=147b200fd8fa2ad17fc5101436c7b76d3deb6f36";
export const PRIMARY_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio"},
  {id:"engineering",label:"Engineering",route:"/engineering"},
  {id:"diverse",label:"Diverse",route:"/diverse"},
  {id:"about",label:"About",route:"/about"},
  {id:"cv",label:"CV",route:"/cv"},
  {id:"contact",label:"Contact",route:"/contact"}
];

function courseUpdateCounter(value){
  const count=Math.max(0,Math.min(999,Math.floor(Number(value)||0)));
  return count?'<span class="course-update-count" aria-label="'+count+' nye filer">'+count+'</span>':"";
}

export const MOBILE_NAV=[
  {id:"portfolio",label:"Projects",route:"/portfolio",icon:"◇"},
  {id:"courses",label:"Courses",route:"/courses",icon:"▤"},
  {id:"engineering",label:"Eng.",route:"/engineering",icon:"⌁"},
  {id:"diverse",label:"Diverse",route:"/diverse",icon:"•••"},
  {id:"search",label:"Search",action:"search",icon:"⌕"},
  {id:"more",label:"More",action:"more",icon:"☰"}
];

function navButton(item,active,{mobile=false,coursesLabel="Courses",courseUpdates=0}={}){
  const label=escapeHTML(item.id==="courses"?coursesLabel:item.label);
  const news=item.id==="courses"?courseUpdateCounter(courseUpdates):"";
  const activeClass=active===item.id?"active":"";
  const current=active===item.id?' aria-current="page"':"";
  if(item.action==="more"){
    return `<button data-mobile-more-toggle type="button" aria-controls="mobile-more-menu" aria-expanded="false" class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  if(item.action==="search"){
    return `<button type="button" data-search-open class="${activeClass}"><span>${item.icon||""}</span>${label}</button>`;
  }
  if(mobile){
    return `<button data-go="${item.route}" aria-label="${item.id==="engineering"?"Engineering":label}" class="${activeClass}"${current}><span>${item.icon||""}</span>${label}${news}</button>`;
  }
  return `<button data-go="${item.route}" class="${activeClass}"${current}>${label}${news}</button>`;
}

export function renderTopShell(active,{coursesLabel="Courses",account={},folkAccount={},courseUpdates=0}={}){
  const desktopPrimary=PRIMARY_NAV.map(item=>navButton(item,active,{coursesLabel})).join("");
  const mobile=MOBILE_NAV.map(item=>navButton(item,active,{mobile:true,coursesLabel,courseUpdates})).join("");
  const googleConnected=account?.status==="signed-in";
  const folkConnected=folkAccount?.status==="signed-in";
  const signedIn=googleConnected||folkConnected;
  const text=googleConnected&&folkConnected?"FolkNet + Drive":
    folkConnected?(folkAccount.user?.email||"FolkNet account"):
    googleConnected?(account?.profile?.name||account?.profile?.email||"Google"):"Sign in";
  const accountName=escapeHTML(text);
  const accountInitial=signedIn?escapeHTML(String(text).trim().slice(0,1).toUpperCase()):"○";

  return `<button type="button" class="skip-to-content" data-skip-content>Skip to content</button>
  <header class="topbar">
    <button type="button" class="brand" id="home" aria-label="Go to Projects"><span class="brand-mark" aria-hidden="true"></span>FolkNettside</button>
    <nav class="nav" aria-label="Main navigation">${desktopPrimary}</nav>
    <span class="top-spacer"></span>
    <nav class="nav" aria-label="Course navigation"><button data-go="/courses" class="${active==="courses"?"active":""}"${active==="courses"?' aria-current="page"':""}>${escapeHTML(coursesLabel)}${courseUpdateCounter(courseUpdates)}</button></nav>
    <div class="top-actions">
      <button class="icon-btn" data-search-open aria-label="Search">⌕</button>
      <button class="account-chip ${signedIn?"signed-in":""}" data-go="/settings/connections" aria-label="${signedIn?`Account: ${accountName}`:"Sign in"}"><span>${accountInitial}</span><em>${accountName}</em></button>
      <button class="icon-btn" data-go="/settings" aria-label="Settings">⚙</button>
    </div>
  </header>
  <nav class="mobile-nav" aria-label="Primary">${mobile}</nav>
  <nav class="mobile-more-menu" id="mobile-more-menu" aria-label="Additional navigation" hidden>
    <button type="button" data-go="/about">About</button>
    <button type="button" data-go="/cv">CV</button>
    <button type="button" data-go="/contact">Contact</button>
    <button type="button" data-go="/settings">Settings</button>
  </nav>`;
}

export function bindShellNavigation(root,{navigate,openSearch,onHome}){
  root.querySelectorAll("[data-go]").forEach(button=>{
    button.addEventListener("click",()=>navigate(button.dataset.go));
  });
  const moreButton=root.querySelector("[data-mobile-more-toggle]");
  const moreMenu=root.querySelector("#mobile-more-menu");
  // Global listeners are attached only while the popup is open.
  const closeMoreMenu=(restoreFocus=false)=>{
    if(!moreMenu||moreMenu.hidden)return;
    moreMenu.hidden=true;
    moreButton?.setAttribute("aria-expanded","false");
    document.removeEventListener("pointerdown",closeOnOutside);
    document.removeEventListener("focusin",closeOnOutside);
    window.removeEventListener("hashchange",closeOnRoute);
    if(restoreFocus)moreButton?.focus();
  };
  function closeOnOutside(event){
    if(moreMenu?.contains(event.target)||moreButton?.contains(event.target))return;
    closeMoreMenu();
  }
  function closeOnRoute(){closeMoreMenu();}
  function closeOnEscape(event){
    if(event.key!=="Escape"||moreMenu?.hidden)return;
    event.preventDefault();
    closeMoreMenu(true);
  }
  moreButton?.addEventListener("click",event=>{
    if(!moreMenu)return;
    if(!moreMenu.hidden){closeMoreMenu();return;}
    moreMenu.hidden=false;
    moreButton.setAttribute("aria-expanded","true");
    document.addEventListener("pointerdown",closeOnOutside);
    document.addEventListener("focusin",closeOnOutside);
    window.addEventListener("hashchange",closeOnRoute);
    if(event.detail===0)moreMenu.querySelector("button")?.focus();
  });
  moreButton?.addEventListener("keydown",closeOnEscape);
  moreMenu?.addEventListener("keydown",closeOnEscape);
  moreMenu?.querySelectorAll("[data-go]").forEach(button=>{
    button.addEventListener("click",()=>closeMoreMenu());
  });
  root.querySelector("[data-skip-content]")?.addEventListener("click",()=>{
    // Hash routing owns the URL fragment: using href="#main" would change routes.
    const target=root.querySelector("main, [role='main'], .workspace, .viewer, .layout, .settings, .engineering-cad-page, .kisssoft-page, .python-workbench, .course-admin-page, .diverse-page, .dive-page");
    if(!target)return;
    if(!target.hasAttribute("tabindex"))target.setAttribute("tabindex","-1");
    if(target.tagName!=="MAIN"&&!target.hasAttribute("role"))target.setAttribute("role","main");
    target.focus();
  });
  root.querySelector("#home")?.addEventListener("click",onHome);
  root.querySelectorAll("[data-search-open]").forEach(button=>{
    button.addEventListener("click",openSearch);
  });
}
