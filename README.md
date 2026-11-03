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

## Appwrite wieder verbinden

Die ursprünglichen öffentlichen Verbindungskennungen wurden aus der Git-Historie wiederhergestellt. `site-config.js` enthält den Endpoint `https://fra.cloud.appwrite.io/v1`, Projekt `6ac779cc001f0d093856`, Datenbank `6ac7d6740035408079f7`, Warteliste `6ac7d6e1002f38269b6a`, Admin-Team `6ac7d7fc0029522fc7bf` und die Tabellen `cr_products`, `cr_codes`, `cr_orders`, `cr_giveaway` (First Collection Giveaway).

Appwrite muss jeden verwendeten Hostnamen unter **Overview → Platforms → Add platform → Web** zulassen. Für die aktuelle Site ist das `chevalier-et-roth-maison.politeoffer3.chatgpt.site`, ohne Protokoll oder Pfad. Bestehende Plattformen beibehalten; für GitHub Pages `stephen6668.github.io` und für lokale Entwicklung `localhost` beziehungsweise `127.0.0.1` ebenfalls freigeben. Der erste echte Test der neuen Site-Domain wurde von Appwrite mit `403 general_unknown_origin` abgewiesen. Das Freigeben des Hostnamens muss im bestehenden Appwrite-Projekt erfolgen; Code allein kann diese Projekteinstellung nicht ändern.

`admin.html` verwendet vorhandene E-Mail-/Passwortkonten und prüft eine bestätigte Mitgliedschaft im bestehenden Admin-Team. Der Adminbereich lädt Warteliste, Produkte, Codes, Bestellungen und Giveaway direkt aus Appwrite. Produkt- und Codeänderungen sowie Teilnehmerstatus werden dort gespeichert; es gibt keine Demo-Daten, automatischen Datenimporte oder lokalen Erfolgs-Fallbacks. Codes sind nur für Admins lesbar und verwaltbar. Eine zukünftige Einlösung muss serverseitig geprüft werden; Stripe bleibt deaktiviert.

Die alten Produktkennungen bleiben erhalten: `p1` = Half-Zip, `p2` = Hose, `p3` = Body. Warteliste und Giveaway schreiben diese IDs, während Bild- und 3D-Dateien weiterhin aus dem neuen lokalen Katalog kommen. Im Banner ausgewählte Farbe und Größe sowie Varianten aus der lokalen Auswahl werden in das Wartelistenformular übernommen. Die bisherigen Giveaway-Termine (Teilnahmeschluss 2. Januar 2027, 00:00 Uhr Luxemburger Zeit) bleiben erhalten.

Erforderliche Berechtigungen im vorhandenen Projekt:

- Warteliste und `cr_giveaway`: Zeilensicherheit aktiv, `Any` darf erstellen; Admin-Team darf lesen/aktualisieren/löschen. Kein öffentliches Lesen personenbezogener Daten.
- `cr_products`: öffentliches Lesen, Schreiben nur für das Admin-Team.
- `cr_codes`: ausschließlich Admin-Team; kein öffentliches Lesen.
- `cr_orders`: Admin-Team darf lesen; Schreiben bleibt beim bisherigen Bestell-/Webhooksystem.

Die Website enthält keine geheimen API-Schlüssel. Sitzungen und Datenrechte werden von Appwrite durchgesetzt. Die Browserprüfungen verwenden isolierte Testantworten; es werden dabei keine echten Teilnehmer, Codes oder Bestellungen angelegt. Die ursprünglichen Tabellen und ihr Datenbestand werden nicht gelöscht oder automatisch überschrieben.
