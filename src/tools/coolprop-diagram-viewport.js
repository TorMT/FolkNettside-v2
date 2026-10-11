/**
 * Bounded, focus-preserving zoom for physical diagram coordinates.
 * Logarithmic pressure is already transformed to log10 by the canvas viewer.
 */
export function zoomDiagramViewport(view,focus,factor,initial=view){
  const values=[view?.xmin,view?.xmax,view?.ymin,view?.ymax,
    initial?.xmin,initial?.xmax,initial?.ymin,initial?.ymax,
    focus?.x,focus?.y,factor];
  if(!values.every(Number.isFinite)||!(view.xmax>view.xmin)||
    !(view.ymax>view.ymin)||!(initial.xmax>initial.xmin)||
    !(initial.ymax>initial.ymin)||factor<=0)return null;
  const xWidth=view.xmax-view.xmin,yWidth=view.ymax-view.ymin;
  const initialX=initial.xmax-initial.xmin,initialY=initial.ymax-initial.ymin;
  const scale=Math.max(.2,Math.min(5,factor));
  const newX=xWidth*scale,newY=yWidth*scale;
  // Prevent successive mouse-wheel events from collapsing ranges to 0,
  // overflowing floating-point values or losing tick precision.
  if(!Number.isFinite(newX)||!Number.isFinite(newY)||
    newX<initialX*1e-5||newY<initialY*1e-5||
    newX>initialX*1e5||newY>initialY*1e5)return null;
  const next={
    xmin:focus.x+(view.xmin-focus.x)*scale,
    xmax:focus.x+(view.xmax-focus.x)*scale,
    ymin:focus.y+(view.ymin-focus.y)*scale,
    ymax:focus.y+(view.ymax-focus.y)*scale
  };
  return Object.values(next).every(Number.isFinite)&&
    next.xmax>next.xmin&&next.ymax>next.ymin?next:null;
}
