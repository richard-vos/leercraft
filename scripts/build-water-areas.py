"""Add simplified RWS KRW water areas to the local teaching map.
Usage: py -3 scripts/build-water-areas.py .tmp/water-qa
Requires areas.json (KRW surface-water polygons) and the existing map inputs.
"""
import json,sys
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
s=spec_from_file_location('builder',ROOT/'scripts/build-waterways.py');b=module_from_spec(s);s.loader.exec_module(b)
def clip(ring):
    pts=ring
    for axis,limit,greater in [(0,5.609,True),(0,5.85,False),(1,52.358,True),(1,52.455,False)]:
        out=[]
        if not pts:break
        a=pts[-1]
        for c in pts:
            ai=a[axis]>=limit if greater else a[axis]<=limit;ci=c[axis]>=limit if greater else c[axis]<=limit
            if ai!=ci:
                t=(limit-a[axis])/(c[axis]-a[axis]);out.append([a[0]+t*(c[0]-a[0]),a[1]+t*(c[1]-a[1])])
            if ci:out.append(c)
            a=c
        pts=out
    return pts+[pts[0]] if pts else []
def build(directory):
    target=ROOT/'assets/data/nederland-waterwegen.json';data=json.loads(target.read_text(encoding='utf-8'))
    fs=json.loads((directory/'areas.json').read_text())['features'];areas=[]
    for id,name,names in [('ijsselmeer','IJsselmeer',['IJsselmeer']),('markermeer','Markermeer',['Markermeer']),
        ('oosterschelde','Oosterschelde',['Oosterschelde']),('veluwemeer','Veluwemeer',['Randmeren-oost']),
        ('waddenzee','Waddenzee',['Waddenzee','Waddenzee vastelandskust']),('westerschelde','Westerschelde',['Westerschelde'])]:
        polys=[]
        for f in fs:
            if f['properties']['naam'] not in names:continue
            for poly in b.polygons(f['geometry']):
                rings=[clip(r) if id=='veluwemeer' else r for r in poly]
                rings=[[b.project(p) for p in b.geo.simplify(r,.0006)] for r in rings if len(r)>=4]
                if rings and len(rings[0])>=4:polys.append(rings)
        assert polys,name
        areas.append({'id':id,'name':name,'polygons':polys})
    land=next(f for f in json.loads((directory/'natural-earth.json').read_text())['features'] if f['properties']['ADM0_A3']=='NLD')
    data['landPolygons']=[[[b.project(p) for p in b.geo.simplify(r,.0006)] for r in poly] for poly in b.polygons(land['geometry']) if any(3<p[0]<8 and 50<p[1]<54 for p in poly[0])]
    # The visible North Sea, with land and all other water areas subtracted at runtime.
    areas.append({'id':'noordzee','name':'Noordzee','polygons':[[[[0,0],[1000,0],[1000,45],[620,100],[430,300],[310,450],[210,700],[0,1200],[0,0]]]],'sea':True})
    order=['ijsselmeer','markermeer','noordzee','noordzeekanaal','oosterschelde','veluwemeer','waddenzee','westerschelde']
    canal=next(w for w in data['waterways'] if w['id']=='noordzeekanaal')
    data['waterAreas']=[next(a for a in areas+[canal] if a['id']==id) for id in order]
    data['sources'].append({'name':'Rijkswaterstaat KRW Oppervlaktewaterlichamen (vereenvoudigd)','license':'CC0 1.0','url':'https://data.overheid.nl/dataset/82c39ed4-6a08-410f-959a-79873ec2bf62'}) if not any('KRW' in s['name'] for s in data['sources']) else None
    target.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
if __name__=='__main__':build(Path(sys.argv[1]))
