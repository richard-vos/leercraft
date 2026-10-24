# LeerCraft

Educatieve browserspellen. Accounts en opgeslagen resultaten zijn voorlopig
beschikbaar op de startpagina en in het provincieklikspel.

## Accounts installeren op de server

1. Gebruik PHP 8 met PDO MySQL, een MySQL-database en werkende PHP `mail()`.
2. Voer `api/schema.mysql.sql` uit voor een nieuwe database. Heeft de database
   al de account- en scoretabellen? Voer dan eenmalig `api/migrate-scores.sql` uit.
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
- Voer bij een bestaande database ook `api/migrate-security.sql` eenmalig uit.
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
