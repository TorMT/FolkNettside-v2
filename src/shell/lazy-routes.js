// Which on-demand module groups a route needs (see lazyRouteLoaders in app.js).
// Paths are the exact ones render() dispatches on; anything else needs none.
const ROUTES={
  "/engineering/kisssoft":["kisssoft"],
  "/engineering/cad":["cad"],
  "/tools/vault":["vault"],
  "/tools/python":["python"],
  "/tools/fluid":["fluid"],
  "/tools/model-inspector":["model-inspector"],
  "/tools/chemistry-editor":["chem"],
  "/tools/coolprop":["coolprop"],
  "/tools/periodic":["periodic"],
  "/tools/crystal":["crystal","crystal-editor"],
  "/settings/theme-studio/manual":["theme-studio"],
  "/settings/theme-studio/image":["theme-studio"],
  "/diverse/bilder":["photo-feed"],
  "/diverse/diving":["dive-map"],
  "/diverse/dive-map":["dive-map"],
  "/diverse/sandalen":["sandalen"],
  "/diverse/matpris":["matpris"],
  "/diverse/brewing":["brewing"],
  "/diverse/medisin":["medisin"],
  "/diverse/laos":["study-catalog"],
  "/diverse/andrekok":["study-catalog"],
  "/admin/courses":["course-admin"]
};

export const LAZY_ROUTE_KEYS=Object.freeze([...new Set(Object.values(ROUTES).flat())]);

export function lazyRouteKeys(path){
  return Object.hasOwn(ROUTES,String(path))?ROUTES[String(path)]:[];
}
