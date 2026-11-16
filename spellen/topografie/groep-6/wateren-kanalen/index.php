<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- leercraft:seo:start -->
<title>Rivieren en kanalen van Nederland oefenen | LeerCraft</title>
<meta name="description" content="Herken negen Nederlandse rivieren en kanalen voor groep 6. Omcirkel de gevraagde waterweg op de kaart met je vinger of muis. Gratis oefenen met LeerCraft.">
<link rel="canonical" href="https://leercraft.nl/spellen/topografie/groep-6/wateren-kanalen/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LeerCraft">
<meta property="og:locale" content="nl_NL">
<meta property="og:title" content="Rivieren en kanalen van Nederland oefenen | LeerCraft">
<meta property="og:description" content="Herken negen Nederlandse rivieren en kanalen voor groep 6. Omcirkel de gevraagde waterweg op de kaart met je vinger of muis. Gratis oefenen met LeerCraft.">
<meta property="og:url" content="https://leercraft.nl/spellen/topografie/groep-6/wateren-kanalen/">
<meta property="og:image" content="https://leercraft.nl/assets/images/social/leercraft.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="LeerCraft: rekenen en topografie oefenen voor groep 6">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Rivieren en kanalen van Nederland oefenen | LeerCraft">
<meta name="twitter:description" content="Herken negen Nederlandse rivieren en kanalen voor groep 6. Omcirkel de gevraagde waterweg op de kaart met je vinger of muis. Gratis oefenen met LeerCraft.">
<meta name="twitter:image" content="https://leercraft.nl/assets/images/social/leercraft.png">
<link rel="icon" type="image/svg+xml" href="/assets/images/ui-grass.svg">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://leercraft.nl/#website","url":"https://leercraft.nl/","name":"LeerCraft","inLanguage":"nl-NL"},{"@type":"VideoGame","@id":"https://leercraft.nl/spellen/topografie/groep-6/wateren-kanalen/#game","url":"https://leercraft.nl/spellen/topografie/groep-6/wateren-kanalen/","name":"Wateren en kanalen","description":"Herken negen Nederlandse rivieren en kanalen voor groep 6. Omcirkel de gevraagde waterweg op de kaart met je vinger of muis. Gratis oefenen met LeerCraft.","image":"https://leercraft.nl/assets/images/social/leercraft.png","inLanguage":"nl-NL","isAccessibleForFree":true,"educationalLevel":"Groep 6","genre":["Educatief","Topografie"],"applicationCategory":"EducationalApplication","gamePlatform":"Webbrowser","isPartOf":{"@id":"https://leercraft.nl/#website"}},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"LeerCraft","item":"https://leercraft.nl/"},{"@type":"ListItem","position":2,"name":"Wateren en kanalen","item":"https://leercraft.nl/spellen/topografie/groep-6/wateren-kanalen/"}]}]}</script>
<!-- leercraft:seo:end -->
<link rel="stylesheet" href="/assets/game-info.css">
<link rel="stylesheet" href="/assets/atlas.css">
<link rel="stylesheet" href="/assets/waterways.css">
<script src="/assets/theme.js"></script><script src="/assets/responsive.js" defer></script>
</head><body class="atlas-modern game-waters">
<main class="water-layout">
 <header class="water-header atlas-stone"><a href="/" class="atlas-button">Menu</a><div class="water-mission"><span class="water-eyebrow">HOOFDSTUK 2 · GROEP 6</span><h2 id="water-mission">Wateren en kanalen</h2><p id="water-instruction">Omcirkel een duidelijk stuk van de waterweg.</p><div class="atlas-progress"><span id="water-fill"></span></div></div><div class="water-score"><strong id="water-round">0 / 9</strong><span id="water-points">0 punten</span></div></header>
 <div class="water-playfield">
  <section class="water-map-panel atlas-stone" aria-label="Kaart van Nederland">
   <svg id="water-map" viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg" tabindex="0" role="img" aria-label="Tekenkaart van Nederland met rivieren en kanalen" aria-describedby="water-map-help"><defs><clipPath id="water-land-clip"><path id="water-land-clip-path"/></clipPath></defs><rect x="-3000" y="-3000" width="7000" height="8000" class="water-sea"/><g id="water-base"></g><g id="water-lines"></g><path id="water-drawing"/><circle id="water-keyboard-circle" r="45" cx="500" cy="700" hidden/></svg>
   <div class="water-zoom" aria-label="Kaartweergave"><button id="water-zoom-in" aria-label="Inzoomen">+</button><button id="water-zoom-out" aria-label="Uitzoomen">−</button><button id="water-home" aria-label="Hele kaart">↺</button></div>
   <span class="water-map-badge">N ↑</span>
  </section>
  <aside class="water-sidebar">
   <div class="water-guide atlas-stone"><canvas id="water-steve" aria-label="Jouw Steve als gids"></canvas><img id="water-steve-fallback" src="/assets/images/steve-portrait.svg" alt="Steve" hidden></div>
   <div class="water-task atlas-stone"><p id="water-map-help">Teken met je vinger of muis een cirkel. Gebruik + voor een groter beeld.</p><p id="water-feedback" role="status" aria-live="polite">Klaar voor de eerste waterweg?</p><div class="water-actions"><button id="water-check" class="primary" disabled>Controleer</button><button id="water-next" class="primary" hidden>Volgende</button><button id="water-clear" disabled>Opnieuw tekenen</button><button id="water-pan" aria-pressed="false">Kaart verplaatsen</button></div></div>
  </aside>
 </div>
 <footer class="water-sources"><details><summary>Kaartbronnen</summary><p>Vereenvoudigde kaart: <a href="https://data.overheid.nl/dataset/47097-nwb-vaarwegen---vaarwegvakken--rws-" target="_blank" rel="noopener noreferrer">Rijkswaterstaat NWB (CC0)</a> · <a href="https://www.pdok.nl/introductie/-/article/bestuurlijke-gebieden" target="_blank" rel="noopener noreferrer">Kadaster / PDOK (CC BY 4.0)</a> · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth (publiek domein)</a>.</p></details></footer>
</main>
<div id="start"><section class="card"><h1>Wateren en kanalen</h1>
<!-- leercraft:game-info:start -->
<details class="game-info"><summary>Over dit spel</summary>
<div class="game-info-content"><h2>Wateren en kanalen voor groep 6</h2>
<p>Je herkent het Amsterdam-Rijnkanaal, de IJssel, Lek, Maas, Nederrijn, Nieuwe Waterweg, het Noordzeekanaal, de Rijn en Waal op de kaart van Nederland. Je koppelt de naam aan de ligging en het verloop van de waterweg.</p>
<h3>Hoe speel je?</h3>
<p>Teken een gesloten cirkel om een duidelijk stuk van de gevraagde waterweg en kies Controleer. Je hoeft niet de hele rivier te omcirkelen. Gebruik de zoomknoppen voor kleine stukken. Met het toetsenbord: focus de kaart, verplaats de cirkel met de pijltjestoetsen, wijzig de grootte met + of - en plaats hem met Enter. Een direct goed antwoord is 10 punten waard; de finish levert 50 extra op. Ingelogd worden je punten bewaard.</p>
<h3>Verder oefenen</h3><ul><li><a href="/spellen/topografie/groep-6/provincie-klik/">Provincie Klikspel</a></li><li><a href="/spellen/topografie/groep-6/atlascode/">De Atlascode</a></li></ul>
<p>Dit spel is gratis en zonder account te spelen.</p></div></details>
<!-- leercraft:game-info:end --><p>Herken de 9 waterwegen van Nederland.<br>Teken een cirkel om een duidelijk stuk.</p><p>10 punten per direct goed antwoord + 50 bij de finish</p><button id="water-start" class="primary" disabled>Start de watertocht</button></section></div>
<div id="overlay" hidden><section class="card"><h2>Watertocht voltooid!</h2><p id="water-result"></p><p id="water-result-points" class="atlas-result-points"></p><p id="water-save" role="status"></p><button id="water-retry" hidden>Opnieuw bewaren</button><div class="atlas-result-actions"><button id="water-again" class="primary">Nog een watertocht</button><a href="/" class="atlas-button">Alle spellen</a></div></section></div>
<div id="loading" role="status">De waterkaart wordt geladen…</div>
<div data-leercraft-account data-background="true" hidden></div>
<script src="/assets/avatar-profile.js"></script><script src="/assets/account.js" data-root="/"></script>
<script type="module" src="/assets/js/waterways-game.js"></script>
</body></html>
