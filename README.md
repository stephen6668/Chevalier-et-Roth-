# Chevalier & Roth — L’Édition Bordeaux

Responsive Designvorschau in Elfenbein, Gold und Bordeaux. Die Kollektion zeigt einen langärmligen Body mit V-Ausschnitt, einen Half-Zip und eine weite Hose — alle in Bordeaux mit goldenen Details, nach den bereitgestellten Produktfotos.

## Lokal starten

```sh
python3 -m http.server 8080
```

`http://localhost:8080` öffnen. Kein Build und keine Installation nötig. Für GitHub Pages den Branch `main` und das Stammverzeichnis auswählen.

## Produktansichten

Die drei echten GLB-Modelle unter `assets/models/` lassen sich im Banner und in den Produktkarten drehen. Der lokal gebündelte, unter Apache-2.0 lizenzierte `@google/model-viewer` übernimmt die Darstellung. Im Banner bleiben alle drei Produkte als feste 3D-Ansichten sichtbar. Links-/Rechtspfeile sowie die seitlichen Produktvorschauen wechseln das aktive Stück mit einem Übergang in den Vordergrund; Produktdaten und Produktauswahl folgen der Auswahl. Nur das aktive Modell lässt sich drehen oder automatisch rotieren. Pause, Bildansicht und Rücksetzen bleiben verfügbar. `prefers-reduced-motion` wird berücksichtigt. Freigestellte Produktbilder dienen als Poster und als Rückfallansicht, falls 3D auf dem Gerät nicht verfügbar ist.

Die 3D-Ansichten verwenden die vom Nutzer hochgeladenen GLB-Modelle:

- `body_bordeaux_CR.glb` → `assets/models/body-bordeaux-studio.glb`
- `halfzip_mit_CR_optimiert.glb` → `assets/models/halfzip-bordeaux-studio.glb`
- `hose_mit_CR_optimiert.glb` → `assets/models/trousers-bordeaux-studio.glb`

Die gelieferten Silhouetten, UVs, Stofftexturen und CR-Decals bleiben erhalten. Für das Web wurden die Netze mit begrenzter geometrischer Abweichung vereinfacht, Texturen optimiert, die Vorderansicht ausgerichtet und die Größe normalisiert. Stoffmaterialien erhalten weichere Normalen, dezenten Faserglanz und eine ruhigere Schattierung; bei der Hose wurde der metallische Glanz reduziert. Der lokal gebündelte Meshopt-Decoder lädt die komprimierten Geometrien ohne externe Dienste. Die drei Modelle sind zusammen etwa 10 MB statt der ursprünglichen 59 MB groß. Es sind Kollektionsvisualisierungen, keine Zusicherung verbindlicher Produktionsmaße.

## Dateien

- `index.html`, `styles.css`: responsive Gestaltung, Logo und Animationen
- `catalog.js`: Produktnamen, Beschreibungen, Bild- und Modellpfade
- `app.js`: Produktauswahl, 3D-Steuerung, Filter, Suche und lokale Auswahl
- `assets/products/`: Bordeaux-Produktbilder
- `assets/models/`: drei volumetrische 3D-Modelle
- `viewer-setup.js`: lokale Decoder-Konfiguration
- `vendor/`: 3D-Viewer, Meshopt-Decoder und Lizenzen

Das Repository enthält die aktuelle Website mit dem neuen Logo, der Salonkulisse und den drei Bordeaux-Produkten. Die früheren Entwurfsmodelle und unbenutzte Medien wurden ersetzt. Die drei Originaluploads bleiben unverändert als Quelldateien im Repository. Die Website lädt ausschließlich die optimierten Varianten.

## Status

Designvorschau, kein aktiver Shop. Preise sind offen und als „Preis folgt“ gekennzeichnet. Es werden keine Bestellungen oder Zahlungen verarbeitet. Die Auswahl wird lokal im Browser gespeichert. Vor einem öffentlichen Shopstart müssen verbindliche Produktdaten, Preise und Rechtstexte ergänzt werden. Frühere Website-Stände bleiben in der Git-Historie erhalten.
