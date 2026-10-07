let promise;
export function getThreeRuntime(){
  if(!promise){
    promise=Promise.all([
      import("https://esm.sh/three@0.180.0"),
      import("https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js")
    ]).then(([THREE,controls])=>({THREE,OrbitControls:controls.OrbitControls}));
  }
  return promise;
}


let gltfPromise;
export function getGLTFRuntime(){
  if(!gltfPromise){
    gltfPromise=Promise.all([
      getThreeRuntime(),
      import("https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js"),
      import("https://esm.sh/three@0.180.0/examples/jsm/libs/meshopt_decoder.module.js")
    ]).then(([runtime,loader,meshopt])=>({
      ...runtime,
      GLTFLoader:loader.GLTFLoader,
      MeshoptDecoder:meshopt.MeshoptDecoder
    }));
  }
  return gltfPromise;
}
