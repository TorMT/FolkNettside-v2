function uniqueStrings(values=[]){
  return [...new Set((values||[]).map(value=>String(value).trim()).filter(Boolean))];
}

export function componentSemantic(component={}){
  const metadata=component.metadata||{};
  const declared=metadata.semantic||component.semantic||{};
  const propulsion=metadata.propulsion||declared.thruster||null;
  return {
    role:declared.role||(propulsion?"thruster":component.type==="assembly"?"assembly":"component"),
    subtype:declared.subtype||propulsion?.type||null,
    subsystem:declared.subsystem||null,
    tags:uniqueStrings(declared.tags),
    hydro:declared.hydro||metadata.hydro||null,
    thruster:propulsion,
    source:{
      objectId:component.sourceObjectId??null,
      format:declared.sourceFormat||null
    }
  };
}

export function semanticAssembly(modelDocument){
  const components=modelDocument?.components||[];
  const byId=new Map();
  for(const component of components){
    if(byId.has(component.id))throw new Error(`Duplicate component id: ${component.id}`);
    byId.set(component.id,{
      id:component.id,
      name:component.name,
      parentId:component.parentId??null,
      type:component.type,
      hasGeometry:Boolean(component.geometry),
      semantic:componentSemantic(component),
      component,
      children:[]
    });
  }

  const roots=[];
  for(const node of byId.values()){
    if(node.parentId==null){
      roots.push(node);
      continue;
    }
    const parent=byId.get(node.parentId);
    if(!parent)throw new Error(`Missing parent ${node.parentId} for component ${node.id}`);
    parent.children.push(node);
  }

  const visiting=new Set(),visited=new Set();
  function walk(node,depth=0,path=[]){
    if(visiting.has(node.id))throw new Error(`Component hierarchy cycle at ${node.id}`);
    if(visited.has(node.id))return;
    visiting.add(node.id);
    node.depth=depth;
    node.path=[...path,node.id];
    for(const child of node.children)walk(child,depth+1,node.path);
    visiting.delete(node.id);
    visited.add(node.id);
  }
  for(const root of roots)walk(root);
  if(visited.size!==byId.size){
    const orphan=[...byId.keys()].find(id=>!visited.has(id));
    throw new Error(`Component hierarchy cycle or unreachable component at ${orphan}`);
  }

  return {roots,nodes:[...byId.values()],byId};
}

export function semanticComponents(modelDocument,{
  role=null,subtype=null,subsystem=null,tag=null,hasGeometry=null
}={}){
  return semanticAssembly(modelDocument).nodes.filter(node=>{
    const semantic=node.semantic;
    if(role!==null&&semantic.role!==role)return false;
    if(subtype!==null&&semantic.subtype!==subtype)return false;
    if(subsystem!==null&&semantic.subsystem!==subsystem)return false;
    if(tag!==null&&!semantic.tags.includes(tag))return false;
    if(hasGeometry!==null&&node.hasGeometry!==Boolean(hasGeometry))return false;
    return true;
  });
}

export function semanticSummary(modelDocument){
  const nodes=semanticAssembly(modelDocument).nodes;
  const countBy=selector=>{
    const counts={};
    for(const node of nodes){
      const value=selector(node);
      if(value==null||value==="")continue;
      counts[value]=(counts[value]||0)+1;
    }
    return counts;
  };
  return {
    components:nodes.length,
    geometryComponents:nodes.filter(node=>node.hasGeometry).length,
    roles:countBy(node=>node.semantic.role),
    subtypes:countBy(node=>node.semantic.subtype),
    subsystems:countBy(node=>node.semantic.subsystem)
  };
}
