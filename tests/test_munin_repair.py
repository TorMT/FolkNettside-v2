import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('repair',Path(__file__).resolve().parents[1]/'scripts/repair_munin_preview.py')
repair=importlib.util.module_from_spec(spec);spec.loader.exec_module(repair)


def fixture(degenerate=True):
    binary=bytearray();views=[];accessors=[];meshes=[];nodes=[]
    for name in repair.HULLS:
        points=[0,0,0,1,0,0,0,1,0,1,0,0] if degenerate else [0,0,0,1,0,0,0,1,0,0,0,1]
        for data,kind in [(points,'f'),([0,1,2,0,1,3],'I')]:
            raw=struct.pack('<'+kind*len(data),*data)
            views.append({'buffer':0,'byteOffset':len(binary),'byteLength':len(raw)})
            accessors.append({'bufferView':len(views)-1,'componentType':5126 if kind=='f' else 5125,
                              'type':'VEC3' if kind=='f' else 'SCALAR','count':len(data)//3 if kind=='f' else len(data)})
            binary.extend(raw)
        meshes.append({'primitives':[{'attributes':{'POSITION':len(accessors)-2},'indices':len(accessors)-1}]})
        nodes.append({'name':name,'mesh':len(meshes)-1})
    model={'asset':{'version':'2.0'},'nodes':nodes,'meshes':meshes,'accessors':accessors,'bufferViews':views,
           'buffers':[{'byteLength':len(binary)}]}
    text=json.dumps(model).encode();text+=b' '*(-len(text)%4)
    return struct.pack('<III',0x46546c67,2,28+len(text)+len(binary))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(binary),0x004e4942)+binary


class RepairTest(unittest.TestCase):
    def test_removes_only_exact_duplicate_corner_facets(self):
        source=fixture()
        with patch.object(repair,'SOURCE_SHA256',hashlib.sha256(source).hexdigest()),patch.object(repair,'HULLS',dict.fromkeys(repair.HULLS,1)):
            output,removed=repair.repair_bytes(source)
        n=struct.unpack_from('<I',output,12)[0];model=json.loads(output[20:20+n]);binary=output[28+n:]
        self.assertEqual(len(removed),2)
        for mesh in model['meshes']:
            primitive=mesh['primitives'][0]
            a=model['accessors'][primitive['indices']];view=model['bufferViews'][a['bufferView']]
            self.assertEqual(a['count'],3)
            self.assertEqual(struct.unpack_from('<III',binary,view['byteOffset']),(0,1,2))
            pos=model['accessors'][primitive['attributes']['POSITION']];pv=model['bufferViews'][pos['bufferView']]
            self.assertEqual(struct.unpack_from('<12f',binary,pv['byteOffset']),(0,0,0,1,0,0,0,1,0,1,0,0))

    def test_unknown_input_and_nonzero_facets_are_rejected(self):
        with self.assertRaises(ValueError):repair.repair_bytes(b'unknown')
        source=fixture(False)
        with patch.object(repair,'SOURCE_SHA256',hashlib.sha256(source).hexdigest()),patch.object(repair,'HULLS',dict.fromkeys(repair.HULLS,1)):
            with self.assertRaisesRegex(ValueError,'exactly coincident'):repair.repair_bytes(source)

if __name__=='__main__':unittest.main()
