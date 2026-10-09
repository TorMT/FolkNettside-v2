/**
 * Courses in-page navigation.
 *
 * One document-space reference line controls both sidebar highlighting and
 * programmatic navigation. IntersectionObserver entry batches are unsuitable
 * here: a batch omits sections that remain visible and can select the prior
 * section during smooth scrolling.
 */
export function chooseCourseSection(items,currentId,anchorY,hysteresis=22){
  if(!items.length)return null;
  const positions=items.map(item=>Number(item.top));
  let candidate=0;
  for(let i=0;i<positions.length;i++){
    if(positions[i]<=anchorY)candidate=i;
  }
  const currentIndex=items.findIndex(item=>item.id===currentId);
  if(currentIndex<0)return items[candidate].id;
  if(candidate>currentIndex){
    // Crossing downward requires passing the anchor by this margin.
    if(positions[candidate]>anchorY-hysteresis)return currentId;
    return items[candidate].id;
  }
  if(candidate<currentIndex){
    // Crossing upward is intentionally delayed to avoid flicker.
    if(positions[currentIndex]<=anchorY+hysteresis)return currentId;
    return items[candidate].id;
  }
  return currentId;
}

export function bindCourseNavigation({sections,buttons,topbar,scrollWindow=window}){
  const anchors=sections.filter(item=>item?.element&&item?.id);
  const links=Array.from(buttons||[]);
  if(!anchors.length)return {disconnect(){}};
  let activeId="overview";
  let scrollFrame=0;
  let scrollIdle=0;
  let lockTimer=0;
  let pinnedId=null;
  let disposed=false;

  const offset=()=>{
    const height=topbar?.getBoundingClientRect?.().height||58;
    return Math.round(height)+24;
  };
  const geometry=()=>anchors.map(item=>({
    id:item.id,top:item.element.getBoundingClientRect().top
  }));
  const atBottom=()=>(
    scrollWindow.scrollY+scrollWindow.innerHeight>=
    scrollWindow.document.documentElement.scrollHeight-3
  );
  const activate=id=>{
    if(!id||activeId===id&&links.every(link=>link.classList.contains("active")===(link.dataset.courseNav===id)))return;
    activeId=id;
    for(const button of links){
      const selected=button.dataset.courseNav===id;
      button.classList.toggle("active",selected);
      if(selected)button.setAttribute("aria-current","location");
      else button.removeAttribute("aria-current");
    }
  };
  const update=()=>{
    scrollFrame=0;
    if(disposed||pinnedId)return;
    const rects=geometry();
    const next=atBottom()&&rects[rects.length-1].top<scrollWindow.innerHeight
      ?rects[rects.length-1].id
      :chooseCourseSection(rects,activeId,offset());
    activate(next);
  };
  const schedule=()=>{
    if(disposed||scrollFrame)return;
    scrollFrame=scrollWindow.requestAnimationFrame(update);
  };
  const releasePin=()=>{
    pinnedId=null;
    scrollWindow.clearTimeout(lockTimer);lockTimer=0;
    scrollWindow.clearTimeout(scrollIdle);scrollIdle=0;
    schedule();
  };
  const onScroll=()=>{
    if(pinnedId){
      scrollWindow.clearTimeout(scrollIdle);
      scrollIdle=scrollWindow.setTimeout(releasePin,170);
    }else schedule();
  };
  const cancelClickNavigation=()=>{if(pinnedId)releasePin()};
  const onClick=event=>{
    const id=event.currentTarget.dataset.courseNav;
    const selected=anchors.find(item=>item.id===id);
    if(!selected)return;
    scrollWindow.clearTimeout(lockTimer);
    scrollWindow.clearTimeout(scrollIdle);
    pinnedId=id;
    activate(id);
    // The scroll destination exactly matches the scroll-spy reference line.
    const targetY=Math.max(0,scrollWindow.scrollY+selected.element.getBoundingClientRect().top-offset());
    const reduceMotion=scrollWindow.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    scrollWindow.scrollTo({top:targetY,behavior:reduceMotion?"instant":"smooth"});
    lockTimer=scrollWindow.setTimeout(releasePin,1600);
  };
  links.forEach(button=>button.addEventListener("click",onClick));
  scrollWindow.addEventListener("scroll",onScroll,{passive:true});
  scrollWindow.addEventListener("resize",schedule,{passive:true});
  scrollWindow.addEventListener("wheel",cancelClickNavigation,{passive:true});
  scrollWindow.addEventListener("touchstart",cancelClickNavigation,{passive:true});
  schedule();
  return {
    getActiveId:()=>activeId,
    disconnect(){
      disposed=true;
      links.forEach(button=>button.removeEventListener("click",onClick));
      scrollWindow.removeEventListener("scroll",onScroll);
      scrollWindow.removeEventListener("resize",schedule);
      scrollWindow.removeEventListener("wheel",cancelClickNavigation);
      scrollWindow.removeEventListener("touchstart",cancelClickNavigation);
      if(scrollFrame)scrollWindow.cancelAnimationFrame(scrollFrame);
      scrollWindow.clearTimeout(scrollIdle);
      scrollWindow.clearTimeout(lockTimer);
    }
  };
}
