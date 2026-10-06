export function findIndices(text,query){
  const source=String(text??"").toLocaleLowerCase();
  const needle=String(query??"").trim().toLocaleLowerCase();
  if(!needle)return[];
  const indices=[];
  let offset=0;
  while(offset<=source.length-needle.length){
    const index=source.indexOf(needle,offset);
    if(index<0)break;
    indices.push(index);
    offset=index+Math.max(1,needle.length);
  }
  return indices;
}

export function createDomFinder(container){
  let lastQuery="";
  let cursor=-1;

  return function find(query){
    const needle=String(query??"").trim().toLocaleLowerCase();
    if(!needle){
      globalThis.getSelection?.()?.removeAllRanges?.();
      lastQuery="";
      cursor=-1;
      return {index:0,total:0};
    }

    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent||parent.closest("script,style,[aria-hidden='true']"))return NodeFilter.FILTER_REJECT;
        return node.nodeValue?.toLocaleLowerCase().includes(needle)
          ?NodeFilter.FILTER_ACCEPT
          :NodeFilter.FILTER_REJECT;
      }
    });

    const matches=[];
    let node;
    while((node=walker.nextNode())){
      const text=node.nodeValue.toLocaleLowerCase();
      let offset=0,index;
      while((index=text.indexOf(needle,offset))>=0){
        matches.push({node,start:index,end:index+needle.length});
        offset=index+Math.max(1,needle.length);
      }
    }

    if(!matches.length)return {index:0,total:0};

    cursor=needle===lastQuery?(cursor+1)%matches.length:0;
    lastQuery=needle;
    const match=matches[cursor];
    const range=document.createRange();
    range.setStart(match.node,match.start);
    range.setEnd(match.node,match.end);
    const selection=globalThis.getSelection?.();
    selection?.removeAllRanges();
    selection?.addRange(range);
    match.node.parentElement?.scrollIntoView({block:"center",inline:"nearest",behavior:"smooth"});
    return {index:cursor+1,total:matches.length};
  };
}
