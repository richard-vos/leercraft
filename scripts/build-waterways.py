"""Build the classroom map from cached RWS, PDOK and Natural Earth GeoJSON.

Usage: py -3 scripts/build-waterways.py .tmp/water-qa
The four input files and their sources are documented in docs/wateren-kanalen.md.
No remote services are needed while playing. Geometry is simplified for teaching.
"""
import json
import math
import sys
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
spec=spec_from_file_location('geodata',ROOT/'scripts/build-europe-data.py')
geo=module_from_spec(spec);spec.loader.exec_module(geo)
WATERWAYS=[
 ('amsterdam-rijnkanaal','Amsterdam-Rijnkanaal',['Amsterdam-Rijnkanaal']),
 ('ijssel','IJssel',['Geldersche IJssel']),
 ('lek','Lek',['Lek']),('maas','Maas',['Maas']),
 ('nederrijn','Nederrijn',['Neder-Rijn']),('nieuwe-waterweg','Nieuwe Waterweg',['Nieuwe Waterweg']),
 ('noordzeekanaal','Noordzeekanaal',['Noordzeekanaal']),
 # The RWS feature named just "Rijn" is near Katwijk, NOT the Rhine at Lobith.
 ('rijn','Rijn',['Boven-Rijn','Bijlandsch Kanaal, Boven-Rijn']),('waal','Waal',['Waal']),
]
COLORS={'Flevoland':'#ccd8e6','Friesland':'#f5df8c','Fryslân':'#f5df8c','Groningen':'#e9eab7','Drenthe':'#d5c7a7',
 'Overijssel':'#bfd7c1','Gelderland':'#f6dfa6','Utrecht':'#e8c7bd','Noord-Holland':'#e0d49e',
 'Zuid-Holland':'#f1e897','Zeeland':'#e5b88b','Noord-Brabant':'#d7df9c','Limburg':'#cbb4d0'}

def project(p):
    return [round(30+(p[0]-3.1)*math.cos(math.radians(52))*365,2),round(30+(53.7-p[1])*365,2)]

def polygons(geometry):
    return geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]

def path_string(poly):
    return ''.join('M'+'L'.join(','.join(str(v) for v in project(p)) for p in geo.simplify(ring,.0015))+'Z' for ring in poly)

def build(directory):
    read=lambda name:json.loads((directory/(name+'.json')).read_text(encoding='utf-8'))
    land=next(f for f in read('natural-earth')['features'] if f['properties']['ADM0_A3']=='NLD')
    coast=[poly for poly in polygons(land['geometry']) if any(3<p[0]<8 and 50<p[1]<54 for p in poly[0])]
    provinces=[{'name':f['properties']['naam'],'color':COLORS[f['properties']['naam']],
                'd':''.join(path_string(poly) for poly in polygons(f['geometry']))}
               for f in read('province-shapes')['features']]
    lakes=[path_string(poly) for f in read('lakes')['features'] if f['properties'].get('name')=='IJsselmeer' for poly in polygons(f['geometry'])]
    features=read('waterways')['features']
    waters=[]
    for id,name,source_names in WATERWAYS:
        selected=[f for f in features if f['properties']['vwg_naam'] in source_names]
        assert selected,name+' is missing'
        lines=[]
        for f in selected:
            geometry=f['geometry'];parts=[geometry['coordinates']] if geometry['type']=='LineString' else geometry['coordinates']
            lines.extend([[project(p) for p in geo.simplify(part,.0003)] for part in parts])
        waters.append({'id':id,'name':name,'paths':lines,'sourceNames':source_names})
    context_names=['Nieuwe Maas','Oude Maas','Hollandsche IJssel','Bergsche Maas','Afgedamde Maas','Oude Rijn','Kromme Rijn','Maas-Waalkanaal',
                   'Pannerdensch Kanaal','Amer','Hollandsch Diep','Hollands Diep','Haringvliet','Keteldiep','Kattendiep']
    context=[[project(p) for p in geo.simplify(f['geometry']['coordinates'],.0005)] for f in features
             if f['properties']['vwg_naam'] in context_names and f['geometry']['type']=='LineString']
    return {'viewBox':[0,0,1000,1200],'land':''.join(path_string(poly) for poly in coast),
            'provinces':provinces,'lakes':lakes,'context':context,'waterways':waters,
            'sources':[
              {'name':'Rijkswaterstaat NWB Vaarwegen','license':'CC0 1.0','url':'https://data.overheid.nl/dataset/47097-nwb-vaarwegen---vaarwegvakken--rws-'},
              {'name':'Kadaster / PDOK Bestuurlijke Gebieden','license':'CC BY 4.0','url':'https://www.pdok.nl/introductie/-/article/bestuurlijke-gebieden'},
              {'name':'Natural Earth 1:10m (land en IJsselmeer)','license':'Public domain','url':'https://www.naturalearthdata.com/'}]}

if __name__=='__main__':
    data=build(Path(sys.argv[1]))
    target=ROOT/'assets/data/nederland-waterwegen.json'
    target.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Built {len(data["waterways"])} waterways and {len(data["provinces"])} provinces ({target.stat().st_size} bytes).')
