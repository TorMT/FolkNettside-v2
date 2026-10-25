import {searchIndex} from "../search/search-index.js?v=13aa5b706807694568c59ee42c3eca4a70e87723";

function make(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
}

export function createSearchController({index,onNavigate}){
  let dialog=null;
  let input=null;
  let results=null;
  let current=[];
  let active=0;

  function ensureDialog(){
    if(dialog)return;

    dialog=make("dialog","search-dialog");
    const box=make("div","search-box");
    const inputRow=make("div","search-input-row");
    inputRow.append(make("span","",String.fromCharCode(8981)));
    input=make("input");
    input.type="search";
    input.placeholder="Search projects, courses, tools and Diverse";
    input.autocomplete="off";
    inputRow.append(input,make("kbd","","Esc"));

    results=make("div","search-results");
    const help=make("div","search-help");
    help.append(
      make("span","","Up/Down navigate"),
      make("span","","Enter open"),
      make("span","","Ctrl/Cmd K")
    );
    box.append(inputRow,results,help);
    dialog.append(box);
    document.body.append(dialog);

    input.addEventListener("input",()=>{active=0;render()});
    input.addEventListener("keydown",event=>{
      if(event.key==="ArrowDown"){
        event.preventDefault();
        active=Math.min(active+1,Math.max(0,current.length-1));
        render();
      }else if(event.key==="ArrowUp"){
        event.preventDefault();
        active=Math.max(0,active-1);
        render();
      }else if(event.key==="Enter"&&current[active]){
        event.preventDefault();
        openEntry(current[active]);
      }else if(event.key==="Escape"){
        event.preventDefault();
        close();
      }
    });

    dialog.addEventListener("click",event=>{
      if(event.target===dialog)close();
    });
    dialog.addEventListener("cancel",event=>{
      event.preventDefault();
      close();
    });
  }

  function render(){
    results.replaceChildren();
    const query=input.value.trim();
    current=searchIndex(index,query,{limit:14});

    if(!query){
      results.append(make("div","search-empty","Search across projects, courses, tools and Diverse."));
      return;
    }
    if(!current.length){
      results.append(make("div","search-empty","No matching results."));
      return;
    }

    current.forEach((item,indexValue)=>{
      const button=make("button","search-result"+(indexValue===active?" active":""));
      button.type="button";

      const icon=make("span","search-result-icon",item.type==="project"?"P":item.type==="course"?"C":item.type==="tool"?"T":item.type==="diverse"?"D":"F");
      const textWrap=make("span");
      textWrap.append(make("strong","",item.title),make("small","",item.subtitle));
      const type=make("span","search-result-type",item.type);
      button.append(icon,textWrap,type);
      button.addEventListener("click",()=>openEntry(item));
      results.append(button);
    });

    results.querySelector(".active")?.scrollIntoView({block:"nearest"});
  }

  function openEntry(item){
    close();
    onNavigate(item.route);
  }

  function open(){
    ensureDialog();
    if(!dialog.open)dialog.showModal();
    input.value="";
    active=0;
    render();
    requestAnimationFrame(()=>input.focus());
  }

  function close(){
    if(dialog?.open)dialog.close();
  }

  return {open,close};
}
