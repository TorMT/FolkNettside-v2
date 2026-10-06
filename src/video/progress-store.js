const PREFIX="folk-v2-video:";

export function resourceProgressId(resource){
  return String(resource.id||resource.url||resource.path||resource.name||"video");
}

export function createProgressStore(storage=globalThis.localStorage){
  function key(resource){return PREFIX+resourceProgressId(resource)}
  return {
    read(resource){
      try{
        const raw=storage?.getItem?.(key(resource));
        const value=raw?JSON.parse(raw):{};
        return value&&typeof value==="object"?value:{};
      }catch{return{}}
    },
    write(resource,state){
      const clean={
        position:Number(state.position)||0,
        duration:Number(state.duration)||0,
        watched:Boolean(state.watched),
        updatedAt:Number(state.updatedAt)||Date.now()
      };
      try{storage?.setItem?.(key(resource),JSON.stringify(clean))}catch{}
      return clean;
    },
    clear(resource){
      try{storage?.removeItem?.(key(resource))}catch{}
    }
  };
}

export const localVideoProgress=createProgressStore();
