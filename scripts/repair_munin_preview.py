#!/usr/bin/env python3
"""Remove only two exactly zero-area facets from the approved Munin preview.

No welding, coordinate movement, hole filling, normal changes or remeshing.
Run after convert_munin_step.py with its original 15 mm settings.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

SOURCE_SHA256 = 'ec63e9193ed523d2f9f9ec5e84bbc1731940702e54ff9ca08a478e64f2873f33'
HULLS = {'Munin-component-0015': 1228, 'Munin-component-0016': 1196}


def repair_bytes(source):
    if hashlib.sha256(source).hexdigest() != SOURCE_SHA256:
        raise ValueError('Expected original approved 15 mm Munin preview; refusing unknown input')
    size, = struct.unpack_from('<I', source, 12)
    model = json.loads(source[20:20+size])
    binary = bytearray(source[28+size:])
    repairs = []
    for node in model['nodes']:
        if node['name'] not in HULLS:
            continue
        primitive, = model['meshes'][node['mesh']]['primitives']
        pa = model['accessors'][primitive['attributes']['POSITION']]
        ia = model['accessors'][primitive['indices']]
        pv = model['bufferViews'][pa['bufferView']]
        iv = model['bufferViews'][ia['bufferView']]
        assert pa['componentType'] == 5126 and ia['componentType'] == 5125
        assert not pv.get('byteStride') and not iv.get('byteStride')
        po = pv.get('byteOffset', 0) + pa.get('byteOffset', 0)
        io = iv.get('byteOffset', 0) + ia.get('byteOffset', 0)
        indices = list(struct.unpack_from('<'+'I'*ia['count'], binary, io))
        face = HULLS[node['name']]
        ids = indices[3*face:3*face+3]
        points = [struct.unpack_from('<fff', binary, po+i*12) for i in ids]
        if len(set(points)) != 2:
            raise ValueError('Expected two exactly coincident corners; refusing to alter a surface')
        del indices[3*face:3*face+3]
        struct.pack_into('<'+'I'*len(indices), binary, io, *indices)
        # Retain the original buffer layout; unused tail is zero padding.
        binary[io+len(indices)*4:io+ia['count']*4] = bytes(12)
        ia['count'] = len(indices)
        ia['min'], ia['max'] = [min(indices)], [max(indices)]
        repairs.append({'node': node['name'], 'original_triangle': face,
                        'indices': ids, 'reason': 'two exactly coincident corners; zero area'})
    if len(repairs) != 2:
        raise ValueError('Missing expected hulls')
    encoded = json.dumps(model, separators=(',', ':'), ensure_ascii=True).encode()
    encoded += b' ' * (-len(encoded) % 4)
    output = (struct.pack('<III', 0x46546c67, 2, 28+len(encoded)+len(binary))
              + struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
              + struct.pack('<II', len(binary), 0x004e4942) + binary)
    return output, repairs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('preview', type=Path)
    args = parser.parse_args()
    repaired, removed = repair_bytes(args.preview.read_bytes())
    meta_path = args.preview.with_suffix('.meta.json')
    meta = json.loads(meta_path.read_text())
    meta.update(preview_sha256=hashlib.sha256(repaired).hexdigest(),
                preview_bytes=len(repaired), triangles=meta['triangles']-2,
                notes='Approximate 15 mm tessellation for visualization and exploratory hull-only hydrostatics. Generic colors; no certified vessel mass, loading, stability or strength.', 
                mesh_repair={'input_sha256': SOURCE_SHA256, 'removed_triangles': removed,
                             'coordinates_changed': False, 'volume_change_m3': 0})
    args.preview.write_bytes(repaired)
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False)+'\n')
    print(json.dumps(meta['mesh_repair'], indent=2))


if __name__ == '__main__':
    main()
