<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- leercraft:seo:start -->
<title>Europese landnamen schrijven en oefenen | LeerCraft</title>
<meta name="description" content="Typ de naam van het gemarkeerde Europese land. Oefen de ligging en spelling van landen met dit gratis topografiespel van LeerCraft voor groep 5 t/m 8.">
<link rel="canonical" href="https://leercraft.nl/spellen/topografie/groep-6/europa-landen-schrijf/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LeerCraft">
<meta property="og:locale" content="nl_NL">
<meta property="og:title" content="Europese landnamen schrijven en oefenen | LeerCraft">
<meta property="og:description" content="Typ de naam van het gemarkeerde Europese land. Oefen de ligging en spelling van landen met dit gratis topografiespel van LeerCraft voor groep 5 t/m 8.">
<meta property="og:url" content="https://leercraft.nl/spellen/topografie/groep-6/europa-landen-schrijf/">
<meta property="og:image" content="https://leercraft.nl/assets/images/social/leercraft.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="LeerCraft: rekenen en topografie oefenen voor groep 6">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Europese landnamen schrijven en oefenen | LeerCraft">
<meta name="twitter:description" content="Typ de naam van het gemarkeerde Europese land. Oefen de ligging en spelling van landen met dit gratis topografiespel van LeerCraft voor groep 5 t/m 8.">
<meta name="twitter:image" content="https://leercraft.nl/assets/images/social/leercraft.png">
<link rel="icon" type="image/svg+xml" href="/assets/images/ui-grass.svg">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://leercraft.nl/#website","url":"https://leercraft.nl/","name":"LeerCraft","inLanguage":"nl-NL"},{"@type":"VideoGame","@id":"https://leercraft.nl/spellen/topografie/groep-6/europa-landen-schrijf/#game","url":"https://leercraft.nl/spellen/topografie/groep-6/europa-landen-schrijf/","name":"Schrijf het Land","description":"Typ de naam van het gemarkeerde Europese land. Oefen de ligging en spelling van landen met dit gratis topografiespel van LeerCraft voor groep 5 t/m 8.","image":"https://leercraft.nl/assets/images/social/leercraft.png","inLanguage":"nl-NL","isAccessibleForFree":true,"educationalLevel":"Groep 5 t/m 8","genre":["Educatief","Topografie"],"applicationCategory":"EducationalApplication","gamePlatform":"Webbrowser","isPartOf":{"@id":"https://leercraft.nl/#website"}},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"LeerCraft","item":"https://leercraft.nl/"},{"@type":"ListItem","position":2,"name":"Schrijf het Land","item":"https://leercraft.nl/spellen/topografie/groep-6/europa-landen-schrijf/"}]}]}</script>
<!-- leercraft:seo:end -->
<link rel="stylesheet" href="/assets/game-info.css">
<link rel="stylesheet" href="/assets/atlas.css">
<script src="/assets/theme.js"></script>
<script src="/assets/responsive.js" defer></script>
</head><body class="atlas-modern game-europe" data-game="europa-landen-schrijf">
<div id="map-stage"><canvas id="game" aria-label="Interactieve 3D-kaart van Europa"></canvas>
<div class="atlas-zoom" aria-label="Kaartweergave"><button id="zoom-in" aria-label="Inzoomen">+</button><button id="zoom-out" aria-label="Uitzoomen">&#8722;</button><button id="zoom-reset" aria-label="Hele kaart">&#8634;</button></div></div>
<header class="atlas-hud"><div class="atlas-mission atlas-stone"><strong id="mission-title">Schrijf het Land</strong><span id="mission-help">Kies je groep en vertrek.</span><div class="atlas-progress"><span id="round-fill"></span></div></div><div class="atlas-score atlas-stone"><strong id="round-count">0 / 10</strong><span id="round-points">0 punten</span></div></header>
<p id="atlas-feedback" role="status" aria-live="polite"></p>
<footer class="atlas-footer atlas-stone"><canvas id="atlas-guide" aria-label="Jouw Steve als expeditiegids"></canvas><form id="answer-form" class="atlas-answer" autocomplete="off"><label><span id="answer-label">Antwoord</span><input id="answer-input" autocapitalize="off" spellcheck="false" autocomplete="off" enterkeyhint="done" required></label><button class="primary">Kies</button></form><p id="click-instruction" class="atlas-instruction">Tik op de kaart. Sleep om te bewegen.<br>Gebruik + om kleine landen te vergroten.</p><a class="atlas-button" href="/">Menu</a></footer>
<div id="start"><section class="card"><h1>Schrijf het Land</h1>
<!-- leercraft:game-info:start -->
<details class="game-info"><summary>Over dit spel</summary>
<div class="game-info-content"><h2>Schrijf het Land voor groep 5 t/m 8</h2>
<p>Je oefent het zelfstandig herinneren en schrijven van Europese landnamen. De vorm en ligging op de kaart zijn je aanwijzingen; de naam bedenk je zelf. Groep 5 en 6 oefenen de 19 landen van Europa 1; groep 7 en 8 ook de 20 extra landen van Europa 2.</p>
<h3>Hoe speel je?</h3>
<p>Bekijk het gemarkeerde land op de kaart en typ de juiste naam. Gebruik de terugkoppeling om landen die je lastig vindt opnieuw te oefenen. Je verdient 10 punten per direct goed antwoord en 50 bij de finish. Ingelogd worden die punten bewaard; zonder account speel je ook gewoon.</p>
<h3>Verder oefenen</h3><ul><li><a href="/spellen/topografie/groep-6/europa-landen-klik/">Zoek het Land</a></li><li><a href="/spellen/topografie/groep-6/europa-hoofdsteden-schrijf/">Schrijf de Hoofdstad</a></li></ul>
<p>Dit spel is gratis en zonder account te spelen.</p></div></details>
<!-- leercraft:game-info:end -->
<div class="atlas-config"><label>Mijn groep<select id="atlas-group"><option value="5">Groep 5</option><option value="6" selected>Groep 6</option><option value="7">Groep 7</option><option value="8">Groep 8</option></select></label><label>Expeditie<select id="atlas-count"><option value="10">10 opdrachten</option><option value="all">Alle landen</option></select></label></div>
<p id="curriculum" class="atlas-curriculum">Europa 1 &middot; 19 landen</p><p>10 punten per direct goed antwoord &middot; 50 bij de finish</p><button id="goBtn" class="primary" disabled>Start expeditie</button></section></div>
<div id="overlay" hidden><section class="card"><h2>Expeditie voltooid!</h2><p id="end-text"></p><p id="end-points" class="atlas-result-points"></p><p id="save-status" role="status"></p><button id="retry-save" hidden>Opnieuw bewaren</button><div class="atlas-result-actions"><button id="againBtn" class="primary">Nieuwe expeditie</button><a href="/" class="atlas-button">Alle spellen</a></div></section></div>
<div id="loading" role="status">De Europakaart wordt gebouwd&#8230;</div>
<div data-leercraft-account data-background="true" hidden></div>
<script src="/assets/avatar-profile.js"></script><script src="/assets/account.js" data-root="/"></script>
<script type="module" src="/assets/js/europe-game.js"></script>
</body></html>
