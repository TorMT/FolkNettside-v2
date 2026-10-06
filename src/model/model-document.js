export const UNIT_SCALE_TO_METERS={
  micron:1e-6,micrometer:1e-6,millimeter:1e-3,centimeter:1e-2,
  meter:1,inch:0.0254,foot:0.3048
};

export function createModelDocument({name,format,unit="meter",components=[]}){
  return {
    schemaVersion:1,
    name,
    format,
    unit,
    unitScaleToMeters:UNIT_SCALE_TO_METERS[unit]??1,
    components:components.map((component,index)=>({
      id:component.id??`component-${index+1}`,
      name:component.name??`Component ${index+1}`,
      sourceObjectId:component.sourceObjectId??null,
      parentId:component.parentId??null,
      transform:component.transform??null,
      geometry:component.geometry??null,
      metadata:component.metadata??{}
    }))
  };
}
