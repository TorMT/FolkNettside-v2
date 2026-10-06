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
  const cleanups=[];

  for(const {label,node} of panels){
    const action=makeButton(label);
    const close=makeButton("Close","mobile-panel-close");
    const openPanel=()=>{
      for(const other of panels){
        if(other.node!==node)other.node.classList.remove("mobile-open");
      }
      node.classList.add("mobile-open");
    };
    const closePanel=()=>node.classList.remove("mobile-open");

    action.addEventListener("click",openPanel);
    close.addEventListener("click",closePanel);
    actions.append(action);
    node.prepend(close);

    cleanups.push(()=>{
      action.removeEventListener("click",openPanel);
      close.removeEventListener("click",closePanel);
      close.remove();
      node.classList.remove("mobile-open");
    });
  }

  workspace.append(actions);

  const escape=event=>{
    if(event.key==="Escape"){
      for(const {node} of panels)node.classList.remove("mobile-open");
    }
  };
  window.addEventListener("keydown",escape);

  return ()=>{
    window.removeEventListener("keydown",escape);
    cleanups.forEach(cleanup=>cleanup());
    actions.remove();
  };
}
