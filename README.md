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

Designvorschau, kein aktiver Shop. Preise sind offen und als „Preis folgt“ gekennzeichnet. Es werden keine Bestellungen oder Zahlungen verarbeitet. Die Auswahl wird lokal im Browser gespeichert. Vor einem öffentlichen Shopstart müssen verbindliche Produktdaten, Preise und Rechtstexte ergänzt werden. Frühere Website-Stände bleiben in der Git-Historie erhalten.
