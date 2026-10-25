function makeButton(label,className=""){
  const button=document.createElement("button");
  button.type="button";
  if(className)button.className=className;
  button.textContent=label;
  return button;
}

export function bindWorkspaceDrawers(root){
  const workspace=root.querySelector(".workspace");
  if(!workspace||workspace.querySelector(".mobile-workspace-actions"))return ()=>{};

  const panels=[
    {label:"Components",node:workspace.querySelector(".tree")},
    {label:"Properties",node:workspace.querySelector(".inspector")}
  ].filter(item=>item.node);

  if(!panels.length)return ()=>{};

  const actions=document.createElement("div");
  actions.className="mobile-workspace-actions";
  const media=window.matchMedia("(max-width: 760px)");
  const cleanups=[];
  let openPanel=null;

  function syncPanels(){
    const mobile=media.matches;
    for(const panel of panels){
      const isOpen=mobile&&openPanel===panel;
      panel.node.classList.toggle("mobile-open",isOpen);
      // Off-canvas controls must not remain keyboard or screen-reader targets.
      panel.node.inert=mobile&&!isOpen;
      if(mobile&&!isOpen)panel.node.setAttribute("aria-hidden","true");
      else panel.node.removeAttribute("aria-hidden");
      panel.action.setAttribute("aria-expanded",String(isOpen));
    }
  }
  function closePanel(restoreFocus=false){
    const previous=openPanel;
    if(!previous)return;
    openPanel=null;
    if(restoreFocus)previous.action.focus();
    syncPanels();
  }

  for(const [index,panel] of panels.entries()){
    const {label,node}=panel;
    const action=makeButton(label);
    const close=makeButton("Close "+label,"mobile-panel-close");
    const previousId=node.id;
    const generatedId=previousId||"mobile-workspace-drawer-"+index;
    if(!previousId)node.id=generatedId;
    action.setAttribute("aria-controls",generatedId);
    action.setAttribute("aria-expanded","false");
    node.setAttribute("role","region");
    node.setAttribute("aria-label",label);
    panel.action=action;
    const open=()=>{
      if(!media.matches)return;
      openPanel=panel;
      syncPanels();
      close.focus();
    };
    const closeOwn=()=>closePanel(true);
    action.addEventListener("click",open);
    close.addEventListener("click",closeOwn);
    actions.append(action);
    node.prepend(close);
    cleanups.push(()=>{
      action.removeEventListener("click",open);
      close.removeEventListener("click",closeOwn);
      close.remove();
      if(!previousId)node.removeAttribute("id");
      node.removeAttribute("role");
      node.removeAttribute("aria-label");
      node.removeAttribute("aria-hidden");
      node.inert=false;
      node.classList.remove("mobile-open");
    });
  }

  workspace.append(actions);
  syncPanels();
  const escape=event=>{
    if(event.key==="Escape"&&openPanel){
      event.preventDefault();
      closePanel(true);
    }
  };
  const dismissOutside=event=>{
    if(!openPanel)return;
    if(openPanel.node.contains(event.target)||actions.contains(event.target))return;
    closePanel();
  };
  const resize=()=>{
    // Desktop panels must never inherit the mobile inert/hidden state.
    if(!media.matches)openPanel=null;
    syncPanels();
  };
  window.addEventListener("keydown",escape);
  document.addEventListener("pointerdown",dismissOutside);
  media.addEventListener("change",resize);

  return ()=>{
    window.removeEventListener("keydown",escape);
    document.removeEventListener("pointerdown",dismissOutside);
    media.removeEventListener("change",resize);
    cleanups.forEach(cleanup=>cleanup());
    actions.remove();
  };
}
