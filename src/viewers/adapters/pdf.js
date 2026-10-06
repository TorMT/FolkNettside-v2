export async function render(container,resource){
  const frame=document.createElement("iframe");
  frame.className="pdf-frame";
  frame.src=resource.path;
  frame.title=resource.label || resource.name;
  container.replaceChildren(frame);
  return {info:"Native browser PDF renderer"};
}
