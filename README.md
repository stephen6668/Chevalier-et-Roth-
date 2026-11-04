# Chevalier & Roth — Collection Signature

Responsive Designvorschau in Elfenbein, Gold und Bordeaux. Die Kollektion zeigt einen langärmligen Body mit V-Ausschnitt, einen Half-Zip und eine weite Hose — jeweils in Bordeaux, Schwarz, Grau, Beige und Navyblau mit den hochgeladenen 3D-Farbmodellen.

## Lokal starten

```sh
python3 -m http.server 8080
```

`http://localhost:8080` öffnen. Kein Build und keine Installation nötig. Für GitHub Pages den Branch `main` und das Stammverzeichnis auswählen.

## Produktansichten

Die 15 GLB-Farbvarianten unter `assets/models/` lassen sich im Banner und in den Produktkarten drehen. Der lokal gebündelte, unter Apache-2.0 lizenzierte `@google/model-viewer` übernimmt die Darstellung. Im Banner bleiben alle drei Produkte als feste 3D-Ansichten sichtbar. Links-/Rechtspfeile sowie die seitlichen Produktvorschauen wechseln das aktive Stück mit einem Übergang in den Vordergrund; Produktdaten und Produktauswahl folgen der Auswahl. Nur das aktive Modell lässt sich drehen oder automatisch rotieren. Pause, Bildansicht und Rücksetzen bleiben verfügbar. `prefers-reduced-motion` wird berücksichtigt. Freigestellte Produktbilder dienen als Poster und als Rückfallansicht, falls 3D auf dem Gerät nicht verfügbar ist.

Die 3D-Ansichten verwenden die vom Nutzer hochgeladenen GLB-Modelle:

- `body_bordeaux_CR.glb` → `assets/models/body-bordeaux-studio.glb`
- `halfzip_mit_CR_optimiert.glb` → `assets/models/halfzip-bordeaux-studio.glb`
- `hose_mit_CR_optimiert.glb` → `assets/models/trousers-bordeaux-studio.glb`

Die gelieferten Silhouetten, UVs, Stofftexturen und CR-Decals bleiben erhalten. Für das Web wurden die Netze mit begrenzter geometrischer Abweichung vereinfacht, Texturen optimiert, die Vorderansicht ausgerichtet und die Größe normalisiert. Stoffmaterialien erhalten weichere Normalen, dezenten Faserglanz und eine ruhigere Schattierung; bei der Hose wurde der metallische Glanz reduziert. Der lokal gebündelte Meshopt-Decoder lädt die komprimierten Geometrien ohne externe Dienste. Die drei Bordeaux-Modelle sind zusammen etwa 10 MB statt der ursprünglichen 59 MB groß. Die übrigen Farbvarianten verwenden dieselbe geprüfte Geometrie und die jeweiligen Farbtexturen aus den neuen Uploads. Es sind Kollektionsvisualisierungen, keine Zusicherung verbindlicher Produktionsmaße.

## Farben

Für jedes Produkt sind fünf echte Modellvarianten hinterlegt. Die Auswahl im Banner lädt nur das jeweilige Produkt in der gewählten Farbe; die anderen beiden Produkte behalten ihre Auswahl. Farben werden auch bei Produktwechsel, Suche und in der lokalen Produktauswahl berücksichtigt. Unterschiedliche Farben derselben Größe bleiben getrennte Positionen. Vorherige Auswahlstände werden nach Bordeaux migriert.

Die Quelldateien `*_schwarz.glb`, `*_beige.glb` und `*_navy.glb` liefern die gleichnamigen Varianten. Die `*_weiss.glb` benannten Dateien enthalten bereits neutrale Texturen und werden wie mit dem Nutzer abgestimmt für Grau verwendet. Die CR-Decals bleiben erhalten. Neue Vorschaubilder wurden direkt aus den passenden 3D-Modellen gerendert, damit auch während des Ladens die richtige Farbe erscheint.

## Dateien

- `index.html`, `styles.css`: responsive Gestaltung, Logo und Animationen
- `catalog.js`: Produktnamen, Beschreibungen, Bild- und Modellpfade
- `app.js`: Produktauswahl, 3D-Steuerung, Filter, Suche und lokale Auswahl
- `assets/products/`: farbgetreue Produktvorschaubilder
- `assets/models/`: 15 optimierte 3D-Farbmodelle
- `viewer-setup.js`: lokale Decoder-Konfiguration
- `vendor/`: 3D-Viewer, Meshopt-Decoder und Lizenzen

Das Repository enthält die aktuelle Website mit dem neuen Logo, der Salonkulisse und den drei Produkten in je fünf Farben. Die früheren Entwurfsmodelle und unbenutzte Medien wurden ersetzt. Die Originaluploads bleiben unverändert als Quelldateien im Repository. Die Website lädt ausschließlich die optimierten Varianten.

## Status

Kollektionsvorschau, kein aktiver Verkauf. Die Auswahl bleibt lokal im Browser; Warteliste und Giveaway werden ausschließlich nach erfolgreicher Appwrite-Bestätigung als gespeichert angezeigt. Bestehende Produktpreise aus Appwrite werden mit der bisherigen Konfiguration (EUR, 17 % MwSt., Datenbankpreise netto) vorläufig angezeigt. Ohne gepflegten Preis bleibt „Preis folgt“ sichtbar. Es werden keine neuen Bestellungen oder Zahlungen ausgelöst. Bestehende Bestellungen können im Adminbereich gelesen werden. Vor einem öffentlichen Start müssen verbindliche Produktdaten, Veranstalter- und Kontaktdaten, Datenschutzhinweise und Giveaway-Bedingungen ergänzt werden. Frühere Website-Stände bleiben in der Git-Historie erhalten.

## Produktseiten und Bilder

`product.html?product=body|halfzip|trousers&color=bordeaux|black|gray|beige|navy&size=S|M|L|XL` öffnet die passende Produktdetailseite. Banner, Produktkarten, Suchergebnisse und Positionen der lokalen Auswahl verlinken mit ihrer aktuellen Farbe und Größe darauf. Die fünf Farbauswahlen in den Produktkarten aktualisieren die zugehörigen 3D-Ansichten, ohne das vordere Bannerprodukt zu wechseln.

Die Detailseite enthält Bildergalerie, vergrößerbare Ansicht, kurze Beschreibung, Größenwahl und ein echtes Appwrite-Wartelistenformular. Farbe und Größe bleiben im URL-Link erhalten. Die separate 360°-Ansicht lädt das ausgewählte GLB-Modell erst beim Öffnen und bietet Drehen, Pause und Zurücksetzen. Ein passendes Produktbild überbrückt das Laden und bleibt bei fehlender 3D-Unterstützung verfügbar. Die ausgewählte Variante wird an die bestehende Warteliste oder die lokale Auswahl übergeben.

`gallery.js` ordnet sämtliche 15 Farbvarianten den korrekten Bildern zu. Die sechs bestätigten Studio-PNGs aus dem Repository wurden für die Auslieferung in `assets/gallery/` als WebP gespeichert: Body in Bordeaux und Beige, Hose in Bordeaux, Schwarz, Grau und Beige. Die Originaluploads bleiben unverändert. Alle Varianten besitzen zusätzlich ihre farblich passenden, aus den gelieferten 3D-Modellen gerenderten Produktansichten unter `assets/products/`; für andere Farben wird kein andersfarbiges Studiofoto angezeigt.

## Appwrite-Konfiguration

Die öffentlichen Verbindungskennungen wurden aus der Git-Historie und den aktuellen Appwrite-Screenshots wiederhergestellt. `site-config.js` enthält den Endpoint `https://fra.cloud.appwrite.io/v1`, Projekt `6ac779cc001f0d093856`, Datenbank `6ac7d6740035408079f7`, Warteliste `6ac7d6e1002f38269b6a`, Admin-Team `6ac7d7fc0029522fc7bf` sowie die tatsächlichen Tabellen-IDs:

- `cr_products`: `6ac7d6740035408079f7`
- `cr_codes`: `6aca7bdc002c0883da74`
- `cr_orders`: `6aca7cf00026558bc07f`
- First Collection Giveaway: `cr_giveaway`

Tabellenname und Tabellen-ID sind getrennte Angaben. Dass die Produkt- und Datenbank-ID identisch sind, wurde durch eine erfolgreiche echte Produktabfrage geprüft; die Produkttabelle enthält aktuell keine Einträge. Codes und Bestellungen beantworten Gastabfragen mit einer Lesesperre. Das ist kein Nachweis einer erfolgreichen Admin-Anmeldung oder eines Schreibzugriffs; diese erfordern eine berechtigte Appwrite-Sitzung.

Appwrite muss jeden verwendeten Hostnamen unter **Overview → Platforms → Add platform → Web** zulassen. Für die aktuelle Site ist das `chevalier-et-roth-maison.politeoffer3.chatgpt.site`, ohne Protokoll oder Pfad. Diese Domain wurde inzwischen freigegeben und im echten Verbindungstest akzeptiert. Bestehende Plattformen beibehalten; für GitHub Pages `stephen6668.github.io` und für lokale Entwicklung `localhost` beziehungsweise `127.0.0.1` ebenfalls freigeben.

`admin.html` verwendet vorhandene E-Mail-/Passwortkonten und prüft eine bestätigte Mitgliedschaft im bestehenden Admin-Team. Der Adminbereich lädt Warteliste, Produkte, Codes, Bestellungen und Giveaway direkt aus Appwrite. Produkt- und Codeänderungen sowie Teilnehmerstatus werden dort gespeichert; es gibt keine Demo-Daten, automatischen Datenimporte oder lokalen Erfolgs-Fallbacks. Codes sind nur für Admins lesbar und verwaltbar. Eine zukünftige Einlösung muss serverseitig geprüft werden; Stripe bleibt deaktiviert.

Die alten Produktkennungen bleiben erhalten: `p1` = Half-Zip, `p2` = Hose, `p3` = Body. Warteliste und Giveaway schreiben diese IDs, während Bild- und 3D-Dateien weiterhin aus dem neuen lokalen Katalog kommen. Im Banner ausgewählte Farbe und Größe sowie Varianten aus der lokalen Auswahl werden in das Wartelistenformular übernommen. Die bisherigen Giveaway-Termine (Teilnahmeschluss 2. Januar 2027, 00:00 Uhr Luxemburger Zeit) bleiben erhalten.

Erforderliche Berechtigungen im vorhandenen Projekt:

- Warteliste und `cr_giveaway`: Zeilensicherheit aktiv, `Any` darf erstellen; Admin-Team darf lesen/aktualisieren/löschen. Kein öffentliches Lesen personenbezogener Daten.
- `cr_products`: öffentliches Lesen, Schreiben nur für das Admin-Team.
- `cr_codes`: ausschließlich Admin-Team; kein öffentliches Lesen.
- `cr_orders`: Admin-Team darf lesen; Schreiben bleibt beim bisherigen Bestell-/Webhooksystem.

Die Website enthält keine geheimen API-Schlüssel. Sitzungen und Datenrechte werden von Appwrite durchgesetzt. Die Browserprüfungen verwenden isolierte Testantworten; es werden dabei keine echten Teilnehmer, Codes oder Bestellungen angelegt. Die ursprünglichen Tabellen und ihr Datenbestand werden nicht gelöscht oder automatisch überschrieben.


## Stripe-Testcheckout

Der gehostete Checkout ist ausschließlich im Testmodus verfügbar. Die bestätigten Endpreise inklusive Mehrwertsteuer betragen Half-Zip 110 €, Body 90 € und Hose 100 €. Für den Test wird kein Versandbetrag ergänzt. `dist/store-prices.js` zeigt diese Preise an; allein der serverseitige Katalog `STRIPE_PRICE_CATALOG` bestimmt die an Stripe übergebenen Beträge. Spätere Preisänderungen müssen in beiden Konfigurationen zusammen angepasst werden. Appwrite-Produktpreise sind keine Autorität für diesen Stripe-Testkatalog.

`checkout.html` übernimmt eine einzelne Variante aus einer Produktseite oder die lokale Auswahl mit mehreren Positionen. Der Server validiert Produkt, Farbe, Größe und Stückzahl, berechnet die Preise selbst und erstellt eine Stripe-Checkout-Session mit einem Warenkorb-bezogenen Idempotenzschlüssel. Der Rückkehrlink zeigt eine bestätigte Testzahlung nur nach einer erneuten serverseitigen Abfrage bei Stripe. Ein URL-Parameter allein bestätigt keine Zahlung. Testzahlungen erzeugen keinen Versand und derzeit keinen automatischen Datensatz in `cr_orders`; ein produktiver Fulfillment-/Webhookpfad benötigt eine separate authentifizierte Appwrite-Serveranbindung.

Runtime-Werte werden in Sites gespeichert: `STRIPE_SECRET_KEY` als Secret und `STRIPE_PRICE_CATALOG` als serverseitiger JSON-Katalog. Im Repository befinden sich keine Schlüssel. Live-Schlüssel werden vom Test-Server abgewiesen.

Die aktuelle vom Hosting zurückgegebene Adresse lautet `https://chevalier-et-roth-maison.backesst17.chatgpt.site`. Für Warteliste und Giveaway muss dieser Hostname in Appwrite als Web-Plattform zugelassen sein. Ist das Plattformlimit erreicht, kann die frühere Preview-Plattform bearbeitet und ihr Hostname ersetzt werden; die GitHub-Plattform bleibt erhalten.

## Server-Build

Die bestehenden HTML-/CSS-/JS-Dateien bleiben als Frontend-Quellen unter `dist/` erhalten; im GitHub-Spiegel liegen sie wie bisher im Stammverzeichnis. Der Build erkennt beide Layouts. `node scripts/build-worker.mjs` erzeugt unter `.worker-output/dist/` genau einen eigenständigen Worker und das Hosting-Manifest. HTML, Skripte, Lizenzen und Rasterbilder werden eingebettet. Die 15 großen GLB-Dateien werden über einen auf einen bestehenden GitHub-Commit festgelegten Dateipfad gestreamt. Der Proxy akzeptiert ausschließlich diese bekannten Modelle und reicht keine Cookies oder Anmeldedaten weiter.

Die Deployment-Datei enthält `.openai/hosting.json`, `dist/.openai/hosting.json` und `dist/server/index.js`. Die Source-Konfiguration besitzt keine `static`-Deklaration mehr. Projekt-ID und privater Zugriff bleiben erhalten. Die ursprünglichen PNG- und GLB-Uploads bleiben unverändert im GitHub-Repository. Kann der Hosting-Server eine Modelldatei nicht abrufen, leitet die Modellroute auf dieselbe unveränderliche, öffentlich per CORS lesbare GitHub-Datei um. Zielhost und Dateipfad sind fest hinterlegt. Externe Modelle erhalten keine Website-Cookies oder Zahlungszugangsdaten.


## Footer, Rechtsinformationen und Speicher-Einstellungen

Alle Seiten verwenden denselben Footer mit Impressum, Datenschutz, Cookies/Speicher, Nutzungs- und Shopinformationen, Widerruf, Versand/Rückgabe, Teilnahmehinweisen und Barrierefreiheit. Die Angaben in `legal-config.js` stammen vom Betreiber: Luxemburg, Chevalier & Roth SARL-S, Ansprechpartner Stephen Baxken, Telefon +352 621 484 034. Geschäftsanschrift, geschäftliche E-Mail, bestätigte Vertretung, RCS-/Umsatzsteuer- und weitere Registerangaben sind noch offen. Die Rechtsseiten zeigen diese Lücken ausdrücklich und geben keine Freigabe oder Garantie für einen öffentlichen Verkaufsstart. Der Zugriff bleibt privat, Stripe bleibt im Testmodus.

`privacy.js` speichert die Produktauswahl standardmäßig im Sitzungsspeicher. Eine dauerhafte Merkliste verwendet `localStorage` erst nach ausdrücklicher Freigabe. Die Entscheidung (`cr-privacy-v1`) wird für 180 Tage berücksichtigt; danach wird beim nächsten Besuch erneut gefragt. Über den Footer können die Einstellungen jederzeit geändert werden. Beim Widerruf wird die aktuelle Auswahl in den Sitzungsspeicher übernommen und ausschließlich die dauerhaften Merkliste-Schlüssel entfernt; Anmeldungen werden nicht gelöscht. Es werden keine Analyse- oder Marketing-Werkzeuge eingebunden und deshalb auch keine solchen Schein-Kategorien angeboten. Blockierter Browserspeicher wird sichtbar gemeldet.

Die gewählten Schriftfamilien werden unter `assets/fonts/` selbst ausgeliefert; es gibt keine Google-Fonts-Verbindung mehr. Die zugehörigen OFL-Lizenzen sind enthalten. Die Datenschutzinformationen dokumentieren auch Appwrite, den gehosteten Stripe-Testcheckout, die technische Bereitstellung und die mögliche öffentliche GitHub-Auslieferung der 3D-Modelle.

Das Giveaway bleibt `giveawayReady:false`. Oberfläche und Browser-API nehmen bis zur vollständigen Freigabe der Teilnahmebedingungen keine neuen Teilnahmen entgegen. Bestehende Einträge bleiben erhalten und im Adminbereich lesbar. Die Warteliste bleibt für die private Testvorschau angeschlossen. Vor einer öffentlichen Verwendung mit echten Daten sind vollständige Betreiberangaben, Aufbewahrungs-/Löschkonzept, Anbietervereinbarungen und ein belastbarer serverseitiger Einwilligungsnachweis zu vervollständigen.

Geprüfte Grundlagen: CNPD-Cookie-Leitlinien unter https://cnpd.public.lu/fr/dossiers-thematiques/cookies0/cookies/principes-applicables.html und die Informationen nach DSGVO Art. 13 unter https://cnpd.public.lu/fr/legislation/droit-europ/union-europeenne/rgpd/chapitre-3.html . Es wird kein überholter Link zur seit 2025 eingestellten EU-ODR-Plattform verwendet.


## Deutsch, Englisch und Französisch

Die Sprachauswahl steht oben auf jeder Seite und unten im gemeinsamen Footer. `i18n.js` überträgt vorhandene Oberflächentexte und dynamische Meldungen über `translations-store.js` und `translations-legal.js`; Produktkennungen, Farbcodes, Formularwerte und Backend-Payloads bleiben unverändert. Die ausdrücklich gewählte Sprache wird unter `cr-language-v1` für 180 Tage gemerkt und als `lang=de|en|fr` in internen Seitenlinks übernommen. Ein gültiger URL-Parameter hat Vorrang vor der gespeicherten Präferenz. Ohne Auswahl ist Deutsch aktiv.

Produktgalerie, Farb- und Größenwahl, Warteliste, Cookie-Dialoge, Rechtsinformationen, Adminoberfläche und Checkout verwenden die gewählte Sprache. Der Stripe-Testcheckout erhält die Sprache serverseitig und behält sie bei der Rückkehr bei. Der Footer ist zusätzlich im HTML hinterlegt, damit seine Links auch vor der Skriptausführung sichtbar sind.


## Logo-Intro und Textbewegung

Die Startseite zeigt bei einem frischen Aufruf oder Neuladen eine kurze Logo-Animation in Elfenbein und Gold. `intro.js`/`intro.css` verwenden das vorhandene CR-Monogramm, einen überspringbaren nativen Dialog und einen zeitlich begrenzten Übergang zur Kollektion. Die Animation wartet weder auf 3D-Dateien noch auf API-Antworten und speichert keine zusätzliche Browser-Präferenz. Sprungmarken, die Warenkorbrückkehr, interne Navigation und die Einstellung für reduzierte Bewegung umgehen das Intro.

`motion.js`/`motion.css` lassen ausgewählte Überschriften und Texte versetzt von links und rechts erscheinen. Der Banner startet nach dem Intro; weitere Texte werden beim Scrollen einmalig eingeblendet. Texte bleiben unverändert für die Übersetzung erreichbar. Ohne JavaScript, ohne IntersectionObserver, bei Tastaturfokus und bei reduzierter Bewegung bleiben Inhalte zugänglich.

Die Social-Links führen auf Instagram zu `chevalierandroth` und auf TikTok zu `chevalier.roth`. Es werden ausschließlich Links geöffnet, keine Social-Widgets oder Tracking-Skripte eingebunden.


## Originale Studio-PNGs und spätere Uploads

Die Produktseiten laden die originalen Studio-PNGs aus dem Stammverzeichnis von GitHub `main`. Die Dateinamen sind für alle 15 Produkt-/Farbkombinationen vorab hinterlegt: Präfix `body`, `halfzip` oder `hose`, danach `_mannequin_studio.png` für Bordeaux bzw. `_black_studio.png`, `_gray_studio.png`, `_beige_studio.png` oder `_navy_studio.png`. Groß-/Kleinschreibung beachten.

Bereits geprüft sind `body_mannequin_studio.png`, `body_beige_studio.png`, `hose_mannequin_studio.png`, `hose_black_studio.png`, `hose_gray_studio.png` und `hose_beige_studio.png`. Die Fotogalerie zeigt bei verfügbarem PNG diese Originalaufnahme; eine zusätzliche gerenderte Vorschau wird dort nicht als zweites Foto angehängt. Wartelistenübersicht, verwandte Produkte und Checkout folgen der Aufnahme. Fehlt ein PNG noch, bleibt die passende Farbvariante als klar bezeichnete 3D-Vorschau verfügbar.

`studio-photos.json` dokumentiert die 15 erlaubten Dateinamen und die sechs bereits geprüften Originaldateien. Der Worker liefert ausschließlich diese festen Bildpfade über `/assets/gallery/` aus; neue Uploads unter dem vorgesehenen Namen funktionieren ohne erneute Veröffentlichung. Bilder können bis zu fünf Minuten zwischengespeichert werden; fehlende Bilder werden vom Website-Proxy nicht zwischengespeichert. Die großen PNG-Dateien werden nicht in den Worker eingebettet. Die 3D-Modelle behalten ihren bisherigen unveränderlichen Dateistand.
