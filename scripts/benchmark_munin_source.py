#!/usr/bin/env python3
"""Independent Munin hydro reference using local STEP B-Rep boolean cuts.

Requires cadquery-ocp. Publishes only numeric results, never original CAD bytes.
"""
import argparse
import hashlib
import json
from pathlib import Path
from OCP.STEPControl import STEPControl_Reader
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_SOLID
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.gp import gp_Pnt

SOURCE_SHA='93fd88d40842c2be0753bc426edb256f00490e75837203c83fa6b7e9121e70b2'
CENTER=[-0.013644054532051086,0.0,0.17725620418787003]

def properties(shape):
    p=GProp_GProps()
    BRepGProp.VolumeProperties_s(shape,p)
    return {'volume_m3':p.Mass()*1e-9,
            'center_of_buoyancy_m':[getattr(p.CentreOfMass(),axis)()*.001-CENTER[i]
                                    for i,axis in enumerate(['X','Y','Z'])]}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if hashlib.sha256(args.source.read_bytes()).hexdigest()!=SOURCE_SHA:
        raise ValueError('Expected reviewed Munin source STEP')
    reader=STEPControl_Reader()
    reader.ReadFile(str(args.source));reader.TransferRoots()
    explorer=TopExp_Explorer(reader.OneShape(),TopAbs_SOLID)
    hulls=[];index=0
    while explorer.More():
        index+=1
        if index in [15,16]:
            solid=explorer.Current()
            if not BRepCheck_Analyzer(solid).IsValid():raise ValueError('Invalid source B-Rep')
            samples=[]
            for wl in [-.32,-.22,-.12]:
                top=(wl+CENTER[2])*1000
                box=BRepPrimAPI_MakeBox(gp_Pnt(-2000,-2000,-2000),4000,4000,2000+top).Shape()
                common=BRepAlgoAPI_Common(solid,box)
                if not common.IsDone():raise ValueError('B-Rep cut failed')
                value=properties(common.Shape())
                if value['volume_m3']<=0:
                    samples.append({'waterline_m':wl,'status':'inconclusive',
                                    'reason':'B-Rep boolean returned an empty result inside the hull bounds; not a zero-volume reference'})
                else:
                    samples.append({'waterline_m':wl,'status':'reference',**value})
            hulls.append({'node':f'Munin-component-{index:04d}','brep_valid':True,
                          'full':properties(solid),'samples':samples})
        explorer.Next()
    if len(hulls)!=2:raise ValueError('Missing hull solids')
    output={'source_sha256':SOURCE_SHA,'method':'OpenCascade STEP B-Rep volume integrals and boolean intersection with below-waterline boxes',
            'coordinates':'metres, Z up, same centered frame as GLB','source_center_m':CENTER,'hulls':hulls}
    args.output.write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps(output,indent=2))

if __name__=='__main__':main()
