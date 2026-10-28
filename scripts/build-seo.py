"""Generate static, crawlable metadata, game help and sitemap. Use --check in CI."""
import argparse
import html
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://leercraft.nl'
IMAGE = BASE + '/assets/images/social/leercraft.png'
START, END = '<!-- leercraft:seo:start -->', '<!-- leercraft:seo:end -->'
INFO_START, INFO_END = '<!-- leercraft:game-info:start -->', '<!-- leercraft:game-info:end -->'
PAGES = json.loads((ROOT / 'scripts/seo-pages.json').read_text(encoding='utf-8'))
GAMES = {Path(page['file']).parent.name: page for page in PAGES if page['path'] != '/'}


def structured(page):
    url = BASE + page['path']
    site = {'@type': 'WebSite', '@id': BASE + '/#website', 'url': BASE + '/', 'name': 'LeerCraft', 'inLanguage': 'nl-NL'}
    if page['path'] == '/':
        content = {'@type': 'CollectionPage', '@id': url + '#spellen', 'url': url, 'name': page['title'],
                   'description': page['description'], 'inLanguage': 'nl-NL', 'isPartOf': {'@id': site['@id']},
                   'mainEntity': {'@type': 'ItemList', 'itemListElement': [
                       {'@type': 'ListItem', 'position': i, 'name': game['name'], 'url': BASE + game['path']}
                       for i, game in enumerate(GAMES.values(), 1)]}}
        return {'@context': 'https://schema.org', '@graph': [site, content]}
    game = {'@type': 'VideoGame', '@id': url + '#game', 'url': url, 'name': page['name'],
            'description': page['description'], 'image': IMAGE, 'inLanguage': 'nl-NL',
            'isAccessibleForFree': True, 'educationalLevel': 'Groep 6',
            'genre': ['Educatief', page['subject']], 'applicationCategory': 'EducationalApplication',
            'gamePlatform': 'Webbrowser', 'isPartOf': {'@id': site['@id']}}
    breadcrumbs = {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'LeerCraft', 'item': BASE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': page['name'], 'item': url}]}
    return {'@context': 'https://schema.org', '@graph': [site, game, breadcrumbs]}


def head(page):
    title, description = html.escape(page['title'], quote=True), html.escape(page['description'], quote=True)
    url = BASE + page['path']
    lines = [START, '<title>' + title + '</title>',
             '<meta name="description" content="' + description + '">',
             '<link rel="canonical" href="' + url + '">',
             '<meta name="robots" content="index, follow, max-image-preview:large">',
             '<meta property="og:type" content="website">', '<meta property="og:site_name" content="LeerCraft">',
             '<meta property="og:locale" content="nl_NL">',
             '<meta property="og:title" content="' + title + '">',
             '<meta property="og:description" content="' + description + '">',
             '<meta property="og:url" content="' + url + '">',
             '<meta property="og:image" content="' + IMAGE + '">',
             '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
             '<meta property="og:image:alt" content="LeerCraft: rekenen en topografie oefenen voor groep 6">',
             '<meta name="twitter:card" content="summary_large_image">',
             '<meta name="twitter:title" content="' + title + '">',
             '<meta name="twitter:description" content="' + description + '">',
             '<meta name="twitter:image" content="' + IMAGE + '">',
             '<link rel="icon" type="image/svg+xml" href="/assets/images/ui-grass.svg">']
    if page['path'] == '/':
        lines.append('<link rel="preload" href="/assets/fonts/press-start-2p.ttf" as="font" type="font/ttf" crossorigin>')
    data = json.dumps(structured(page), ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    lines.extend(['<script type="application/ld+json">' + data + '</script>', END])
    return '\n'.join(lines)


def game_info(page):
    links = ''.join('<li><a href="' + GAMES[slug]['path'] + '">' + html.escape(GAMES[slug]['name']) + '</a></li>' for slug in page['related'])
    return '\n'.join([INFO_START, '<details class="game-info"><summary>Over dit spel</summary>',
                      '<div class="game-info-content"><h2>' + html.escape(page['name']) + ' voor groep 6</h2>',
                      '<p>' + html.escape(page['learn']) + '</p>', '<h3>Hoe speel je?</h3>',
                      '<p>' + html.escape(page['play']) + '</p>',
                      '<h3>Verder oefenen</h3><ul>' + links + '</ul>',
                      '<p>Dit spel is gratis en zonder account te spelen.</p></div></details>', INFO_END])


def build(check=False):
    pending = []
    for page in PAGES:
        path = ROOT / page['file']
        before = path.read_text(encoding='utf-8')
        if START in before:
            after = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: head(page), before, count=1, flags=re.S)
        else:
            after = re.sub(r'<title>.*?</title>', lambda _: head(page), before, count=1, flags=re.S)
        if page['path'] != '/':
            if INFO_START in after:
                after = re.sub(re.escape(INFO_START) + r'.*?' + re.escape(INFO_END), lambda _: game_info(page), after, count=1, flags=re.S)
            else:
                after = re.sub(r'</h1>', lambda _: '</h1>\n' + game_info(page), after, count=1)
            if '/assets/game-info.css' not in after:
                after = after.replace('</head>', '<link rel="stylesheet" href="/assets/game-info.css">\n</head>', 1)
        if after != before:
            pending.append(page['file'])
            if not check:
                path.write_text(after, encoding='utf-8')
    # Only real public pages, not account hash views or redirect aliases. No fabricated lastmod dates.
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += ''.join('  <url><loc>' + escape(BASE + page['path']) + '</loc></url>\n' for page in PAGES)
    sitemap += '</urlset>\n'
    target = ROOT / 'sitemap.xml'
    if not target.exists() or target.read_text(encoding='utf-8') != sitemap:
        pending.append('sitemap.xml')
        if not check:
            target.write_text(sitemap, encoding='utf-8')
    if check and pending:
        raise SystemExit('SEO-output wijkt af; voer python3 scripts/build-seo.py uit: ' + ', '.join(pending))
    print(('Gecontroleerd' if check else 'Bijgewerkt') + ': SEO voor ' + str(len(PAGES)) + ' publieke pagina\'s.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
