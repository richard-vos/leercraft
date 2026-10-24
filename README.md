# LeerCraft

Educatieve browserspellen. Accounts en opgeslagen resultaten zijn voorlopig
beschikbaar op de startpagina en in het provincieklikspel.

## Speladressen

De homepage linkt naar nette adressen zoals `/spellen/provincie-klik/`,
`/spellen/provincie-schrijf/` en `/spellen/getallenzee/`. Elke spelmap heeft een
kleine PHP-startpagina die via een vaste lijst het bestaande HTML-bestand serveert.
Daarvoor is geen interne rewrite naar een HTML-bestand nodig. Oude speladressen en
`/index.html` verwijzen permanent door naar de nieuwe adressen. De slash aan
het eind is verplicht en wordt automatisch toegevoegd.

Deze routes vereisen PHP, de root-`.htaccess`, Apache 2.4 met `mod_rewrite` en hosting
op de root van het domein. De eenvoudige Python-server ondersteunt deze rewrites
niet; gebruik lokaal Apache om de nette speladressen te testen.

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
- Elk goed antwoord levert 10 punten/XP op; maximaal 120 per spel.
- Het accountoverzicht toont het totaal, aantal afgeronde spellen en beste score.
- Elke 100 XP begint een volgend level. De balk toont de voortgang binnen dat level.
- Gasten kunnen oefenen. Alleen spellen gestart met een ingelogd account worden
  opgeslagen. Een onderbroken spel wordt niet hervat of opgeslagen.
- Een unieke spel-ID voorkomt dubbel tellen wanneer opslaan opnieuw wordt geprobeerd.
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
