"""Check public page coverage, crawlable metadata and generated SEO artifacts."""
import json
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.meta, self.links, self.anchors, self.tags = {}, [], [], []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append(tag)
        if tag == 'meta':
            self.meta[attrs.get('name', attrs.get('property'))] = attrs.get('content')
        if tag == 'link':
            self.links.append(attrs)
        if tag == 'a':
            self.anchors.append(attrs.get('href', ''))


subprocess.run([sys.executable, str(ROOT / 'scripts/build-seo.py'), '--check'], check=True, cwd=ROOT)
pages = json.loads((ROOT / 'scripts/seo-pages.json').read_text(encoding='utf-8'))
game_files = {str(path.relative_to(ROOT)).replace('\\', '/') for path in (ROOT / 'spellen').rglob('index.php')}
assert {page['file'] for page in pages} == game_files | {'index.html'}, 'Every public game needs metadata'
titles, descriptions, urls = set(), set(), set()
home = Document((ROOT / 'index.html').read_text(encoding='utf-8'))
assert home.tags.count('h1') == 1 and home.tags.count('main') == 1
for page in pages:
    source = (ROOT / page['file']).read_text(encoding='utf-8')
    document = Document(source)
    title = re.findall(r'<title>(.*?)</title>', source, re.S)
    assert len(title) == 1 and title[0] not in titles, page['file'] + ': missing or duplicate title'
    titles.add(title[0])
    description = document.meta.get('description', '')
    assert 80 <= len(description) <= 190 and description not in descriptions, page['file'] + ': invalid description'
    descriptions.add(description)
    canonical = [link['href'] for link in document.links if link.get('rel') == 'canonical']
    url = 'https://leercraft.nl' + page['path']
    assert canonical == [url] and url not in urls
    urls.add(url)
    assert document.meta['og:url'] == url and document.meta['og:description'] == description
    assert 'noindex' not in document.meta['robots']
    assert document.meta['twitter:card'] == 'summary_large_image'
    assert 'h1' in document.tags and 'lang="nl"' in source
    graphs = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
    assert len(graphs) == 1
    data = json.loads(graphs[0])
    assert data['@context'] == 'https://schema.org'
    if page['path'] != '/':
        game = next(node for node in data['@graph'] if node['@type'] == 'VideoGame')
        assert game['url'] == url and game['isAccessibleForFree'] is True
        assert page['path'] in home.anchors, 'Game is not linked from the homepage'
        assert 'leercraft:game-info:start' in source and 'Over dit spel' in source
        for related in page['related']:
            target = next(entry['path'] for entry in pages if Path(entry['file']).parent.name == related)
            assert target in document.anchors, 'Related game link missing'
    assert 'aggregateRating' not in data and 'review' not in data
sitemap = ET.parse(ROOT / 'sitemap.xml')
locations = [element.text for element in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(locations) == len(urls) and set(locations) == urls
robots = (ROOT / 'robots.txt').read_text()
assert 'Sitemap: https://leercraft.nl/sitemap.xml' in robots and 'Disallow: /api/' in robots
assert 'Disallow: /assets/' not in robots
image = (ROOT / 'assets/images/social/leercraft.png').read_bytes()
assert image[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', image[16:24]) == (1200, 630)
sea = (ROOT / 'spellen/rekenen/groep-6/getallenzee/index.php').read_text(encoding='utf-8')
assert "const REVISION = '160'" not in sea and 'import * as THREE from "/assets/vendor/three-0.160.0.module.js"' in sea
print('Passed: 13 unique SEO pages, structured data, internal links, sitemap, robots and 1200x630 share image.')
