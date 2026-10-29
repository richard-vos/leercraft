"""Build the classroom map from Natural Earth 50m GeoJSON (public domain).

Usage: py -3 scripts/build-europe-data.py path/to/ne_50m_admin_0_countries.geojson
Source: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
Only the European map window (-25..60 E, 34..72 N) is retained, including
European Russia. Simplification is for a school game, not navigation.
"""
import json
import math
import sys
from pathlib import Path

# ISO/Natural Earth code, Dutch country/capital, capital longitude/latitude.
EUROPE_1 = [
 ('NLD','Nederland','Amsterdam',4.90,52.37),('BEL','België','Brussel',4.35,50.85),
 ('LUX','Luxemburg','Luxemburg',6.13,49.61),('DEU','Duitsland','Berlijn',13.40,52.52),
 ('FRA','Frankrijk','Parijs',2.35,48.86),('GBR','Verenigd Koninkrijk','Londen',-.13,51.51),
 ('IRL','Ierland','Dublin',-6.26,53.35),('CHE','Zwitserland','Bern',7.45,46.95),
 ('AUT','Oostenrijk','Wenen',16.37,48.21),('ESP','Spanje','Madrid',-3.70,40.42),
 ('PRT','Portugal','Lissabon',-9.14,38.72),('ITA','Italië','Rome',12.50,41.90),
 ('DNK','Denemarken','Kopenhagen',12.57,55.68),('NOR','Noorwegen','Oslo',10.75,59.91),
 ('SWE','Zweden','Stockholm',18.07,59.33),('FIN','Finland','Helsinki',24.94,60.17),
 ('ISL','IJsland','Reykjavik',-21.94,64.15),('CZE','Tsjechië','Praag',14.44,50.08),
 ('POL','Polen','Warschau',21.01,52.23),
]
EUROPE_2 = [
 ('EST','Estland','Tallinn',24.75,59.44),('LVA','Letland','Riga',24.11,56.95),
 ('LTU','Litouwen','Vilnius',25.28,54.69),('BLR','Wit-Rusland (Belarus)','Minsk',27.56,53.90),
 ('UKR','Oekraïne','Kyiv',30.52,50.45),('MDA','Moldavië','Chisinau',28.83,47.01),
 ('RUS','Rusland','Moskou',37.62,55.75),('SVK','Slowakije','Bratislava',17.11,48.15),
 ('HUN','Hongarije','Boedapest',19.04,47.50),('ROU','Roemenië','Boekarest',26.10,44.43),
 ('BGR','Bulgarije','Sofia',23.32,42.70),('SVN','Slovenië','Ljubljana',14.51,46.06),
 ('HRV','Kroatië','Zagreb',15.98,45.81),('BIH','Bosnië en Herzegovina','Sarajevo',18.41,43.86),
 ('SRB','Servië','Belgrado',20.46,44.82),('MNE','Montenegro','Podgorica',19.26,42.44),
 ('KOS','Kosovo','Pristina',21.16,42.66),('ALB','Albanië','Tirana',19.82,41.33),
 ('MKD','Noord-Macedonië','Skopje',21.43,42.00),('GRC','Griekenland','Athene',23.73,37.98),
]

def project(p):
    return [round((p[0]-17.5)*math.cos(math.radians(54))*.46,4),round((54-p[1])*.46,4)]

def clip(ring):
    points=ring[:-1] if ring[0]==ring[-1] else ring
    for axis,limit,greater in [(0,-25,True),(0,60,False),(1,34,True),(1,72,False)]:
        output=[]
        if not points: break
        a=points[-1]
        for b in points:
            ai=(a[axis]>=limit) if greater else (a[axis]<=limit)
            bi=(b[axis]>=limit) if greater else (b[axis]<=limit)
            if ai!=bi:
                t=(limit-a[axis])/(b[axis]-a[axis])
                output.append([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
            if bi: output.append(b)
            a=b
        points=output
    return points

def simplify(points, tolerance=.035):
    if len(points)<3: return points
    a,b=points[0],points[-1]
    def distance(p):
        dx,dz=b[0]-a[0],b[1]-a[1]
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz))) if dx or dz else 0
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)
    i=max(range(1,len(points)-1),key=lambda j:distance(points[j]))
    if distance(points[i])<=tolerance: return [a,b]
    return simplify(points[:i+1],tolerance)[:-1]+simplify(points[i:],tolerance)

def area(ring):
    return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:]+ring[:1]))/2)

def inside(p,ring):
    x,z=p; result=False
    for (a,b),(c,d) in zip(ring,ring[1:]+ring[:1]):
        if (b>z)!=(d>z) and x<(c-a)*(z-b)/(d-b)+a: result=not result
    return result

def build(source):
    features={f['properties']['ADM0_A3']:f for f in source['features']}
    countries=[]
    for level,rows in [(1,EUROPE_1),(2,EUROPE_2)]:
        for code,name,capital,lon,lat in rows:
            geometry=features[code]['geometry']
            polygons=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
            shapes=[]
            for poly in polygons:
                outer=clip(poly[0])
                if len(outer)<3: continue
                ring=[project(p) for p in simplify(outer+[outer[0]])]
                if len(ring)<4 or area(ring)<.001: continue
                shapes.append([ring])
            shapes.sort(key=lambda p:area(p[0]),reverse=True)
            ring=shapes[0][0]
            # A representative land point inside the main polygon (not its bounding box).
            xs=[p[0] for p in ring];zs=[p[1] for p in ring]
            signed=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:]+ring[:1]))
            centroid=[sum((a[k]+b[k])*(a[0]*b[1]-b[0]*a[1]) for a,b in zip(ring,ring[1:]+ring[:1]))/(3*signed) for k in [0,1]]
            candidates=[[min(xs)+(max(xs)-min(xs))*x/20,min(zs)+(max(zs)-min(zs))*z/20] for x in range(1,20) for z in range(1,20)]
            candidates.sort(key=lambda p:math.dist(p,centroid))
            center=next(p for p in [centroid]+candidates if inside(p,ring))
            countries.append(dict(id=code.lower(),naam=name,hoofdstad=capital,level=level,
                                  center=center,capital=project([lon,lat]),polygons=shapes))
    return countries

if __name__=='__main__':
    data=build(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')))
    target=Path(__file__).resolve().parents[1]/'assets/data/europe-countries.json'
    target.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Built {len(data)} countries: 19 Europa 1 + 20 Europa 2.')
