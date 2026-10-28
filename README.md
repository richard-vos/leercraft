# LeerCraft

Educatieve browserspellen. Accounts en opgeslagen resultaten zijn voorlopig
beschikbaar op de startpagina, in het provincieklikspel, RekenCraft en Getallenzee.

## Winkel en outfits

Via Winkel koop je permanente items en bij Mijn Steve kies je wat je draagt.
De vijf categorieën bevatten elk 20 items: petjes, schoenen, T-shirts, broeken
en voorwerpen. Je kunt één item per categorie tegelijk dragen.
`/winkel/` opent de winkel op de hoofdpagina.

De server bepaalt de prijzen en controleert bezit en saldo. `user_items` bewaart
aankopen en betaalde prijzen; `avatar_equipment` bewaart de gedragen items. De
tabellen worden automatisch toegevoegd binnen de bestaande database `DB_NAME`.
Aankopen zijn transacties met een lock op het account, zodat gelijktijdige
aankopen het saldo niet dubbel kunnen uitgeven. Herhaald kopen van hetzelfde
item geeft geen tweede afschrijving. De accountidentiteit wordt ook gecontroleerd.

Het beschikbare saldo is verdiende punten minus aankoopkosten. De totale XP,
levels en bestaande scores worden niet verlaagd door winkelen. Er is geen echt
geld of betaling betrokken. `assets/shop-catalog.json` bevat de catalogus en
prijzen. Na wijzigingen bouw je de browsercatalogus met
`py -3 scripts/build-shop-catalog.py`; de CI controleert of beide overeenkomen.

Na OTP-login krijgt `richard.vos@outlook.com` automatisch testbeheerrechten voor
de winkel: het saldo toont ∞ en aankopen worden voor 0 munten vastgelegd.
De server controleert hiervoor het e-mailadres van het account in de database.
Andere accounts kunnen deze status niet via aanvraagvelden inschakelen.

RekenCraft, Getallenzee en Reken Race laden de outfit bij het account en bij terugkeer naar
het spelvenster. Alleen het eigen personage krijgt die outfit; NPC's blijven
ongewijzigd. Zonder account speel je met de herkenbare standaard-Steve. Een
netwerkfout bij het laden van de outfit blokkeert het spel niet en gebruikt de
standaardoutfit. De gedeelde visuele code staat in `avatar-cosmetics.js`.

## Tablet, telefoon en computer

Bij Mijn Steve wissel je met Dark mode tussen de Overworld en The End.
De voorkeur wordt lokaal in de browser onthouden en geldt voor de hoofdpagina,
RekenCraft, Getallenzee en Reken Race. De End-achtergrond bevat obsidiaanpilaren,
draaiende kristallen en een vliegende draak. De sfeer heeft geen invloed op scores
of de bereikbaarheid van de baan.

Alle pagina's gebruiken `assets/responsive.css`: een compacte basis met grote
aanraakvlakken, tabletindeling vanaf 600px en uitbreiding voor computers vanaf
1100px. De instellingen van RekenCraft krijgen vanaf 800px twee kolommen.
Het inlogvenster heeft vier Minecraft-cijfervakken met automatisch doorspringen,
plakken/autofill en terugwissen. `assets/responsive.js` houdt de beschikbare
viewporthoogte en de ruimte voor het schermtoetsenbord bij.

RekenCraft gebruikt de bestaande Three.js 0.160-engine met een lage volgcamera,
uitgewerkte Minecraft-personages en gepixeld water met blokwolken. De visuele
bouwstenen staan in `assets/js/minecraft-runner-visuals.js`. De rekeninstellingen,
poorten, gevechten en obstakels blijven in de spelpagina. Bomen,
heuvels en wolken gebruiken instancing om herhaalde tekenopdrachten te beperken;
apparaten met aanraakbediening gebruiken een kleinere schaduwkaart.
De stuurknoppen staan links- en rechtsonder, met pauze en geluid rechtsboven.
Over het vrije speelveld slepen stuurt Steve dezelfde richting op; de afstand
van de vinger bepaalt hoeveel hij opzij beweegt. De baan begrenst zijn positie.
Op tablets blijven de aanraakknoppen zichtbaar, ook met een aangesloten trackpad.
Op grote computers met alleen een muis verdwijnen alleen de stuurknoppen; pauze
en geluid blijven bereikbaar. Bij verlies van focus wordt het spel gepauzeerd
en worden ingedrukte stuurknoppen losgelaten.
Personages combineren hun gekleurde blokonderdelen per geanimeerd lichaamsdeel,
zodat elk personage maximaal zes meshes nodig heeft.

## Speladressen

De homepage linkt naar adressen zoals `/spellen/topografie/groep-6/provincie-klik/`
en `/spellen/rekenen/groep-6/getallenzee/`. Elke spelmap bevat het
volledige spel in `index.php`, zonder dubbele bestanden of doorgeefpagina's.
Oude speladressen en
`/index.html` verwijzen permanent door naar de nieuwe adressen. De slash aan
het eind is verplicht en wordt automatisch toegevoegd.

Deze routes vereisen PHP, de root-`.htaccess`, Apache 2.4 met `mod_rewrite` en hosting
op de root van het domein. De eenvoudige Python-server ondersteunt deze rewrites
niet; gebruik lokaal Apache om de nette speladressen te testen.

## Bestandsstructuur

- `index.html`: startpagina en spellenmenu.
- `spellen/<vak>/groep-<nummer>/<spelnaam>/index.php`: vak, schoolgroep en spel.
- `assets/`: gedeelde stijlen, JavaScript, lettertypen, afbeeldingen en kaartdata.
- `api/`: account-, score- en bezoeker-API; gedeelde PHP-code staat in `api/lib/`.
- `scripts/`: hulpmiddelen voor deployment; worden niet gepubliceerd.
- `tests/`: automatische controles; worden niet gepubliceerd.
- `.github/workflows/`: tests en deployment naar STRATO.
- `data/visitor-count.json`: oude tellerstand, alleen nog gelezen bij de eerste
  migratie naar de databaseteller. Wordt niet meer bijgewerkt of geupload.

De oude map `games/` is vervallen. Oude HTML-links blijven via `.htaccess`
doorverwijzen naar de huidige speladressen. Na controle van alle nieuwe spelroutes
ruimt de deployment uitsluitend de bekende oude spelbestanden en de vervallen
loader op de server op. De oude mappen worden alleen verwijderd als ze leeg zijn.

De vakken zijn `rekenen`, `topografie` en `taal`, elk met groep 4 t/m 8.
Alle 12 huidige spellen staan onder **groep 6**. De andere groepsmappen zijn
voorbereid, maar bevatten nog geen spellen. Spelinhoud wordt niet gedupliceerd
om lege groepen op te vullen.

Niveaus horen bij het spel binnen de groep: RekenCraft heeft instelbare bewerkingen,
een instelbaar getalbereik en oplopende levels. Getallenzee heeft plus/min,
keersommen en gemengde bewerkingen. Bij topografie zijn klikken en zelf schrijven
verschillende oefenvormen; rasterspellen voegen kaartcoordinaten toe. Er zijn bij
deze herindeling geen nieuwe leerinhouden of groepsniveaus verzonnen. Toekomstige
groepsvarianten krijgen een eigen spel onder de betreffende groepsmap.

### Didactische niveaus binnen groep 6

Het spellenmenu gebruikt de volgende voorlopige leerlijn, op basis van de taken
en beschikbare steun in de huidige spellen. Dit is geen vastgestelde landelijke
norm of beoordeling van een individuele leerling.

| Niveau | Didactische uitdaging | Huidige voorbeelden |
| --- | --- | --- |
| 1 | Een genoemde plek herkennen en aanwijzen | Provincieklikspel, Zoek het Land |
| 2 | Zelf een naam ophalen en schrijven, of hoofdstad en land koppelen | Provincies schrijven, landen schrijven, Zoek de Hoofdstad |
| 3 | Meerdere kennisstappen combineren of kaartvaardigheden toepassen | Hoofdsteden schrijven, rasterspellen, De Atlascode |

Bij vergelijkbare inhoud geeft herkennen meer antwoordsteun dan zelf een naam
produceren. Hints, aantal antwoordmogelijkheden, kaartcomplexiteit en vereiste
voorkennis kunnen die onderlinge moeilijkheid veranderen. Schrijffouten zijn
bovendien een andere uitdaging dan ontbrekende topografische kennis.

Bij rekenen bepalen bewerkingen, getalbereik en benodigde tussenstappen het
inhoudelijke niveau. Daarom krijgen de instelbare spellen geen vast sterrenaantal.
Tijdsdruk, sturen en springen tellen apart als spelbelasting; een moeilijk te
besturen spel hoort daardoor niet automatisch bij een hogere schoolgroep.

## Accounts installeren op de server

1. Gebruik PHP 8 met PDO MySQL, een MySQL-database en werkende PHP `mail()`.
2. De eerste account-aanvraag maakt automatisch ontbrekende tabellen en de huidige
   score- en beveiligingsindexen aan. Bestaande gebruikers en scores blijven bewaard.
   Handmatig SQL importeren is niet nodig. De database uit `DB_NAME` moet al bestaan.
   De app schrijft uitsluitend in deze database en maakt geen databases of gebruikers
   aan. Open na deployment de startpagina: de accountcontrole initialiseert de
   database ook zonder inlogcookie. Bij verbindings- of rechtenproblemen verschijnt
   een accountfout; de app wijkt nooit uit naar een andere database.
3. Stel de GitHub Actions secrets `db_host`, `db_name`, `db_user`, `db_pass` en
   `otp_pepper` in. Gebruik voor `otp_pepper` een willekeurig geheim van minimaal
   32 tekens dat je bij volgende deployments behoudt. Optioneel: `mail_from`
   (standaard `inlog@leercraft.nl`, moet bij de hosting toegestaan zijn).
   De workflow genereert en uploadt `api/config.php` automatisch en ruimt het
   tijdelijke bestand daarna op. De waarden komen niet in de repository of logs.
   Ontbrekende verplichte secrets stoppen de deployment voordat de upload begint.
   Voor lokaal gebruik kun je `api/config.example.php` kopieren en zelf invullen.
4. Controleer de volledige route: code aanvragen, ontvangen, inloggen,
   provincieklikspel afronden, startpagina openen, uitloggen en opnieuw inloggen.
   Controleer ook een onjuiste/verlopen code en herhaald opslaan van hetzelfde spel.

## Beveiliging en deployment

- Voeg `STRATO_SFTP_KNOWN_HOSTS` toe als GitHub secret: de volledige known_hosts-regel
  voor de SFTP-server (bij een afwijkende poort inclusief `[host]:poort`). Controleer
  de sleutel/fingerprint via STRATO of een al vertrouwde verbinding voordat je hem
  opslaat. Een onbevestigde `ssh-keyscan`-uitkomst is geen identiteitscontrole.
- De huidige migraties worden automatisch toegepast; CREATE-, ALTER- en INDEX-rechten
  zijn nodig zolang het schema nog niet compleet is. Gelijktijdige initialisaties
  worden met een databaselock geserialiseerd. Bij fouten wordt geen data verwijderd;
  een volgende aanvraag probeert de ontbrekende onderdelen opnieuw aan te maken.
- De Apache `.htaccess`-bestanden moeten actief zijn. Controleer na deployment dat
  `/api/config.php`, `/api/schema.mysql.sql`, `/data/visitor-count.json` en
  `/api/lib/auth.php` een 403/404 opleveren, terwijl de spellen en API werken.
  Bij een andere webserver zijn gelijkwaardige toegangsregels nodig.
- Alleen de nieuwste OTP werkt, maximaal 5 verificatiepogingen. Aanvragen zijn
  begrensd op 3 per e-mailadres en 20 per direct IP-adres per 15 minuten. Achter
  een proxy kan dat IP gedeeld zijn; stem dit dan af met de hostingprovider.
- De deployment verwijdert geen oude bestanden op de server. Verwijder eventuele
  eerder geuploade backups, lokale databases of ontwikkelbestanden handmatig.
- Dit is een broncodecontrole, geen afgeronde penetratietest. De echte mailroute,
  PHP/MySQL, serverconfiguratie en gelijktijdige verzoeken moeten live of in een
  aparte testomgeving worden geverifieerd. PHP is in deze lokale omgeving niet aanwezig.

De Python-server `play.py` voert geen PHP uit. Voor accounts is een PHP-server
nodig. Voor lokaal HTTP moet `COOKIE_SECURE=false` worden ingesteld in de lokale
configuratie. Zet nooit productiegeheimen in de repository.

## Punten en voortgang

De bezoekersteller staat in `DB_NAME`, tabel `site_counters`, rij `visitors`.
Bij de eerste migratie wordt 2892 overgenomen, of een hogere stand uit het oude
serverbestand `data/visitor-count.json`. Een bestaande databasestand wordt nooit
door een deployment of schema-update gereset. Het oude bestand wordt daarna niet
meer bijgewerkt en niet meer geupload. De tabel wordt automatisch aangemaakt.
De teller telt eenmaal per browsersessie via sessionStorage; het is geen betrouwbare
meting van unieke personen en is gescheiden van het aantal geregistreerde accounts.

- Een afgerond provincieklikspel bewaart het resultaat van 12 vragen.
- Elk goed provincieantwoord levert 10 punten/XP op; maximaal 120 per spel.
- RekenCraft geeft 10 punten per goede poort en 50 finishbonus. Een goede poort
  geeft genoeg rekenkracht om de volgende Creeper-groep te verslaan. De punten
  worden bij het voltooien van een level opgeslagen, niet bij een verloren level.
  Level 1 heeft 4 poorten (maximaal 90 punten); vanaf level 4 zijn dat 7 poorten
  (maximaal 120 punten). De resterende rekenkracht levert geen extra accountpunten op.
- RekenCraft bewaart in de bestaande `scores`-tabel ook het level, de goede poorten
  en gekozen rekeninstellingen in `meta`. Een databasewijziging is hiervoor niet nodig.
- Getallenzee geeft 10 punten per overleefde ronde op een juiste antwoordtegel
  en 50 punten als je als eerste de finish haalt. Op de veilige oever of brug
  blijven staan telt niet als goed antwoord. Alleen gewonnen races worden
  opgeslagen; gasten verdienen oefenpunten zonder databaseopslag. De uitslag
  blijft staan zodat opnieuw opslaan bij verbindingsproblemen mogelijk is.
- Het startmenu heeft bewerkingskeuzes, getalbereik-presets (5, 10, 20) en een schuif
  voor 3 t/m 20. Dit bereik geldt voor de poortgetallen, niet voor het eindantwoord.
  De oude geheime levelcodes zijn verwijderd. Andere sommen kiezen begint een nieuw
  avontuur; de knop Volgende level speelt door met dezelfde instellingen.
- Het accountoverzicht toont het totaal, aantal afgeronde spellen en beste score.
- Elke 100 XP begint een volgend level. De balk toont de voortgang binnen dat level.
- Gasten kunnen oefenen. Inloggen voor of tijdens een level maakt opslaan mogelijk.
  Een voltooid gastlevel wordt niet achteraf aan een nieuw account gekoppeld.
  Een onderbroken spel wordt niet hervat of opgeslagen.
- Een unieke spel-ID voorkomt dubbel tellen wanneer opslaan opnieuw wordt geprobeerd.
- Mislukte RekenCraft-resultaten blijven tijdens dezelfde geopende pagina klaarstaan
  voor opnieuw opslaan, ook als je alvast een volgend level start. De resultaten
  worden uitsluitend bij het account waarmee het level gespeeld is opgeslagen.
- Scores worden door de browser aangeleverd en door de API op bereik gecontroleerd.
  Dit is geschikt voor persoonlijke oefenvoortgang; voor een competitief klassement
  moet de server ook de vragen en antwoorden controleren.

Nieuwe spellen kunnen later de gedeelde `assets/account.js` gebruiken. Voeg hun
spelcode en validatie toe aan de score-API voordat ze resultaten gaan versturen.

## Database-initialisatie testen

GitHub Actions controleert de PHP-syntax en voert `tests/database-bootstrap.php`
uit tegen een tijdelijke MariaDB 11.8-service voordat de deployment begint.
De CI-service maakt vooraf een aparte testdatabase en testgebruiker aan, zonder
productiecredentials. De app maakt zelf geen database aan.
De test controleert tabellen, herhaalde initialisatie, schema-upgrades,
ontbrekende tabellen en behoud van bestaande resultaten. Lokaal is hiervoor
PHP met PDO MySQL en een aparte testsserver nodig.
