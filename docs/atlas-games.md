# Atlascode en Europa

Hoofdstuk 2 gebruikt zeven bestaande spelroutes. De groepskeuze staat op de
startpagina en in ieder spel; `?groep=5`, `6`, `7` of `8` selecteert dezelfde
gedeelde versie. Zo blijven bestaande links geldig en hoeven spellen niet te
worden gekopieerd naar vier mappen. De keuze wordt lokaal onthouden.

## Lesstof

`assets/data/europe-countries.json` bevat exact 39 landen met Nederlandse namen
en hoofdsteden. Groep 5 en 6 krijgen de 19 landen van Europa 1. Groep 7 en 8
krijgen diezelfde landen plus de 20 landen van Europa 2. De overige landen zijn
in Europa 1 grijs en worden niet bevraagd. De bestaande Atlascode oefent
atlasvaardigheden: inhoud, legenda, kompas, schaal en een eindmissie.

Schrijfspellen accepteren hoofdletter- en accentverschillen en expliciete
alternatieven, waaronder Belarus, Kyiv/Kiev en Chisinau/Chișinău. Engeland is
geen alternatief voor het Verenigd Koninkrijk. Klikken is herkennen;
schrijven vraagt zelfstandig ophalen. De rasterspellen voegen kaartlezen toe.
Ieder land heeft een vast landpunt; hoofdsteden gebruiken hun eigen
lengte- en breedtegraad. Gouden puntjes maken de te gebruiken rasterpositie
eenduidig. Een puntje is dus geen willekeurig vak binnen een groot land.

## Punten en outfits

Alle zeven spellen gebruiken `AtlasProgress`, boven op de bestaande
account-/scoreafhandeling. Een direct goed antwoord levert 10 punten op;
het voltooien levert 50 bonuspunten op. Europa heeft 10 opdrachten of de hele
landenlijst; de Atlascode heeft vijf missies. Een hersteld antwoord helpt bij
het leren, maar levert geen extra antwoordpunten op. Na drie fouten wordt
het antwoord bij Europa getoond. Dubbele klikken en herhaalde uploads leveren
geen dubbele punten op. Gasten spelen zonder score-upload.

De server controleert spelnaam, groep, curriculum, aantal vragen en scoregrenzen.
De bestaande scores-tabel, XP en winkelportemonnee worden gebruikt; hiervoor
is geen databasemigratie nodig. Alle zeven spellen verschijnen onder Mijn Steve.
De Atlascode-speler en de bewegende expeditiegids gebruiken hetzelfde Steve-model
en dezelfde vijf outfitslots als de rekenavonturen. Zonder account blijft de
standaard Steve zichtbaar. Inloggen en uitloggen gebeurt op de hoofdpagina.

## Kaart en onderhoud

Grenzen zijn afgeleid van [Natural Earth 1:50m Admin 0 Countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson),
publiek domein. De kaart is vereenvoudigd voor een educatief spel. Het
kaartvenster beslaat 25° westerlengte tot 60° oosterlengte en 34–72° noorderbreedte;
Rusland wordt daarmee alleen aan de Europese kant getoond. De hoofdsteden en
groepsindeling volgen de door de opdrachtgever opgegeven leslijst.

Om de geometrie opnieuw te bouwen, download het GeoJSON-bronbestand en voer uit:

```powershell
py -3 scripts/build-europe-data.py pad/naar/ne_50m_admin_0_countries.geojson
py -3 scripts/build-seo.py
node tests/atlas-games.cjs
php tests/game-scores.php
py -3 tests/seo.py
```

`tests/scores-api.php` controleert op de aparte CI-database ook de zeven uploads,
gedeelde portemonnee, geschiedenis, gasten en dubbele inzendingen.
