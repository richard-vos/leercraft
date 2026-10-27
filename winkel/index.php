<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Winkel &amp; mijn spullen · LeerCraft</title>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/responsive.css">
  <link rel="stylesheet" href="/assets/shop.css">
</head>
<body class="shop-page">
  <main class="shop-shell">
    <a class="shop-back" href="/">← Terug naar de spellen</a>
    <header class="shop-heading"><p>LEERCRAFT</p><h1>Winkel &amp; mijn spullen</h1><p>Je hebt de punten verdiend. Geef Steve jouw eigen stijl.</p></header>
    <div data-leercraft-account></div>
    <div class="shop-layout">
      <aside class="avatar-card" aria-label="Je personage">
        <h2>Jouw Steve</h2>
        <canvas id="avatar-preview" aria-label="3D-voorbeeld van je gedragen outfit"></canvas>
        <p id="preview-fallback" hidden>Je outfit wordt tijdens het spelen zichtbaar.</p>
        <p class="wallet-amount" id="shop-balance">Saldo laden...</p>
        <p id="shop-earned"></p>
        <p class="shop-help">Aankopen gaan van je saldo af. Je verdiende XP en level blijven behouden.</p>
        <p class="shop-help">Je outfit gaat mee naar RekenCraft en Getallenzee.</p>
        <div class="try-games"><a href="/spellen/rekenen/groep-6/rekencraft/">Speel RekenCraft</a><a href="/spellen/rekenen/groep-6/getallenzee/">Speel Getallenzee</a></div>
      </aside>
      <div class="shop-inventory">
        <p id="shop-message" role="status" aria-live="polite"></p>
        <button type="button" id="shop-refresh" class="shop-button secondary">Winkel vernieuwen</button>
        <section aria-labelledby="catalog-heading"><h2 id="catalog-heading">De winkel</h2><p>Een item koop je één keer. Daarna kies je zelf wanneer je het draagt.</p><div id="shop-catalog" class="item-grid"></div></section>
        <section aria-labelledby="owned-heading"><h2 id="owned-heading">Mijn gekochte items</h2><p id="owned-empty">Je hebt nog geen items gekocht.</p><div id="shop-owned" class="item-grid"></div></section>
      </div>
    </div>
  </main>
  <script src="/assets/avatar-profile.js"></script>
  <script src="/assets/account.js" data-root="/"></script>
  <script type="module" src="/assets/js/shop.js"></script>
</body>
</html>
