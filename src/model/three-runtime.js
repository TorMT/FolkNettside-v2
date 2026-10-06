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
