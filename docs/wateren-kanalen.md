# Nederland en het water — hoofdstuk 2

Het hoofdstuk bevat nu drie spellen: Wateren en kanalen (9 vragen),
Zeeën en meren (`/spellen/topografie/groep-6/zeeen-meren/`, 8 vragen) en
Wateren: alles door elkaar (`/spellen/topografie/groep-6/wateren-compleet/`,
16 unieke vragen). Het Noordzeekanaal wordt in de gemengde ronde eenmaal gevraagd.
De maxima zijn respectievelijk 140, 130 en 210 punten, inclusief 50 finishpunten.

Zeeën en meren gebruikt IJsselmeer, Markermeer, Noordzee, Noordzeekanaal,
Oosterschelde, Veluwemeer, Waddenzee en Westerschelde. Bij gebieden telt het duidelijk
overheersende water: minimaal 25% van het rondje is water en dat water beslaat
minstens 2,5 maal zoveel als een concurrerend watergebied (of dat andere gebied
beslaat minder dan 10%). Zo mag ook oeverland in een rondje rond een smalle zeearm
liggen. Veel land en meerdere echte wateren krijgen afzonderlijke feedback;
land en de andere binnenwateren tellen niet als Noordzee. De gemengde ronde combineert deze controle
met de bestaande lijncontrole voor rivieren en kanalen.

De gebieden zijn vereenvoudigde [RWS KRW-oppervlaktewaterlichamen](https://data.overheid.nl/dataset/82c39ed4-6a08-410f-959a-79873ec2bf62).
Het Veluwemeer is een educatieve uitsnede van Randmeren-oost bij Harderwijk–Elburg;
Wolderwijd en Drontermeer worden niet als volledig Veluwemeer gebruikt. De zichtbare
Noordzee gebruikt een vereenvoudigd offshoregebied met land en binnenwateren
uitgesloten. Het Markermeer en IJsselmeer hebben eigen vlakken en een zichtbare grens.
De bronvermelding van deze aanvullende RWS-gegevens staat in de kaartgegevens.

Voor opnieuw bouwen: sla de RWS WFS `KRW_oppervlaktewaterlichamen_vlak`-features
op als `areas.json` (GeoJSON, EPSG:4326) in dezelfde tijdelijke bronmap.
Selecteer IJsselmeer, Markermeer, Oosterschelde, Westerschelde, Randmeren-oost,
Waddenzee en Waddenzee vastelandskust. Voer na `build-waterways.py` ook
`py -3 scripts/build-water-areas.py .tmp/water-qa` uit. Controleer aanvullend
met `node tests/water-areas.cjs`.

Spelroute: `/spellen/topografie/groep-6/wateren-kanalen/`.
De Atlascode en de zes Europaspellen zijn nu hoofdstuk 3. Bestaande adressen
blijven geldig. Hoofdstuk 1 bevat de twee provinciespellen.

## Lesstof en tekenen

Een ronde vraagt alle negen waterwegen eenmaal, in willekeurige volgorde:
Amsterdam-Rijnkanaal, IJssel, Lek, Maas, Nederrijn, Nieuwe Waterweg,
Noordzeekanaal, Rijn en Waal. De oefening is ingericht voor groep 6.

Spelers omcirkelen met vinger, pen of muis een duidelijk deel van de gevraagde
waterweg en kiezen **Controleer**. Een hele lange rivier omcirkelen is niet nodig.
Bijna gesloten rondjes klikken vanzelf dicht. Ook een rondje met een uitlopend staartje
wordt op het kruispunt gesloten. Het stipje toont waar je begon. Zoomknoppen vergroten
de plek die je op de kaart aanwijst; er is geen aparte verplaatsknop. Een toetsenbord kan ook: focus de kaart, verplaats de cirkel met de
pijltjestoetsen, wijzig de straal met +/− en plaats de cirkel met Enter.

De beoordeling gebruikt de werkelijk omsloten lengte van alle negen waterwegen,
in kaartcoördinaten. Daardoor blijven antwoorden gelijk bij zoomen en op andere
schermformaten. De dominante waterweg in de cirkel is het antwoord. Twee ongeveer
even sterk omsloten waterwegen zijn onduidelijk. Een open, heel kleine, te grote
of lege cirkel kost geen poging. Zo kan een cirkel om heel Nederland niet slagen.

Een duidelijk verkeerd antwoord kost een poging. Dezelfde getekende cirkel kan
maar eenmaal worden ingediend; voor een nieuwe poging teken je opnieuw. Na drie
fouten verschijnt de gevraagde waterweg groen. **Volgende** laat de speler zelf
bepalen wanneer de volgende vraag begint. Zo blijft er tijd om de feedback en
kaart te bekijken. Na een vraag keert de kaart terug naar het hele land.

Een direct goed antwoord geeft 10 punten, de finish 50 extra: maximaal 140.
In alle drie de spellen toont **Help — 10 punten** het gevraagde water groen.
Hulp kost eenmaal per vraag 10 punten van de eindscore, inclusief de finishbonus;
de eindscore wordt nooit negatief. De server valideert `hints_used` en de netto
score. Zonder hulp blijft de bestaande puntentelling gelijk.
Een hersteld antwoord helpt bij het leren maar geeft geen antwoordpunten.
De bestaande score-, geschiedenis- en winkelportemonnee worden gebruikt.
Herhaalde uploads gebruiken dezelfde run-ID en geven geen dubbele beloning.
Gasten kunnen de volledige ronde spelen en sturen geen scores op. Hiervoor
zijn geen nieuwe databasetabellen nodig. Steve gebruikt de bestaande winkeloutfit;
zonder account gebruikt de gids zijn standaarduiterlijk.

## Kaartbronnen

De meegeleverde kaart volgt de rustige provinciekleuren en blauwe waterwegen
van het aangeleverde voorbeeld. Het is een nieuwe, vereenvoudigde vectorkaart;
de afbeelding uit het gesprek is niet als rasterbestand ingevoegd.

* **Rijkswaterstaat, NWB Vaarwegen — vaarwegvakken (CC0 1.0):**
  [dataset en licentie](https://data.overheid.nl/dataset/47097-nwb-vaarwegen---vaarwegvakken--rws-).
  De geselecteerde middenlijnen komen uit `vwg_naam` in de WFS:
  `https://geo.rijkswaterstaat.nl/services/ogc/gdr/nwb_vaarwegen/ows`.
* **Kadaster / PDOK, Bestuurlijke Gebieden (CC BY 4.0):**
  [beschrijving](https://www.pdok.nl/introductie/-/article/bestuurlijke-gebieden).
  Provincievormen zijn vereenvoudigd en afgesneden op de landvorm.
  De bron staat in de kaart onder **Kaartbronnen** vermeld.
* **Natural Earth, 1:10m Admin 0 Countries en Lakes (publiek domein):**
  [bronbestanden](https://github.com/nvkelso/natural-earth-vector/tree/master/geojson).
  Landvorm, eilanden en het IJsselmeer zijn vereenvoudigd.

De RWS-namen worden bewust gekoppeld aan de lesnamen: `Geldersche IJssel` wordt
**IJssel**, `Neder-Rijn` wordt **Nederrijn**. **Rijn** gebruikt `Boven-Rijn` en
`Bijlandsch Kanaal, Boven-Rijn` bij Lobith. De RWS-objecten met uitsluitend de
naam `Rijn` liggen bij Katwijk en worden hiervoor uitdrukkelijk niet gebruikt.
Andere hoofdwaterwegen staan lichtblauw als context en worden niet bevraagd.
De kaart toont waterwegen als lijnen, geen werkelijke rivierbreedtes of dieptes.

## Onderhoud en controles

`assets/data/nederland-waterwegen.json` bevat de volledige lokale kaart; tijdens
het spelen is geen verbinding met de kaartdiensten nodig. De ontwikkelaar kan
de kaart opnieuw bouwen uit vier GeoJSON-bestanden in een tijdelijke map:

1. `province-shapes.json`: PDOK
   `https://api.pdok.nl/kadaster/brk-bestuurlijke-gebieden/ogc/v1/collections/provinciegebied/items?f=json&limit=20`.
2. `natural-earth.json`: `ne_10m_admin_0_countries.geojson` van Natural Earth.
3. `lakes.json`: `ne_10m_lakes.geojson` van Natural Earth.
4. `waterways.json`: RWS WFS 2.0.0 `GetFeature`, `typeNames=vaarwegvakken`,
   `outputFormat=json`, `srsName=EPSG:4326`. Neem de waternamen uit `WATERWAYS`
   en `context_names` in de bouwer op. Meerdere downloads mogen worden
   samengevoegd op feature-ID. Gebruik geen maximale `count` die de bron afkapt.

```powershell
py -3 scripts/build-waterways.py .tmp/water-qa
py -3 scripts/build-seo.py
node tests/waterways.cjs
php tests/game-scores.php
php tests/game-routes.php
py -3 tests/seo.py
```

`tests/scores-api.php` test de gedeelde portemonnee, geschiedenis, gasten en
herhaalde uploads op de aparte MariaDB-testdatabase van GitHub Actions.
