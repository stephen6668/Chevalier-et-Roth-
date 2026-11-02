# Chevalier & Roth — L’Édition Bordeaux

Responsive Designvorschau in Elfenbein, Gold und Bordeaux. Die Kollektion zeigt einen langärmligen Body mit V-Ausschnitt, einen Half-Zip und eine weite Hose — alle in Bordeaux mit goldenen Details, nach den bereitgestellten Produktfotos.

## Lokal starten

```sh
python3 -m http.server 8080
```

`http://localhost:8080` öffnen. Kein Build und keine Installation nötig. Für GitHub Pages den Branch `main` und das Stammverzeichnis auswählen.

## Produktansichten

Die drei echten GLB-Modelle unter `assets/models/` lassen sich im Banner und in den Produktkarten drehen. Der lokal gebündelte, unter Apache-2.0 lizenzierte `@google/model-viewer` übernimmt die Darstellung. Der Banner bietet automatische Drehung mit Pause, manuelle Drehung und Rücksetzen. `prefers-reduced-motion` wird berücksichtigt. Freigestellte Produktbilder dienen als Poster und als Rückfallansicht, falls 3D auf dem Gerät nicht verfügbar ist.

Die Modelle sind räumliche **Designstudien nach den Fotos**, keine vermessenen Produktionsmodelle. Insbesondere die Rückseiten und Materialdetails sind gestalterische Annäherungen. Für eine exakte Produktionsdarstellung können die GLBs durch finale Originaldateien ersetzt werden.

## Dateien

- `index.html`, `styles.css`: responsive Gestaltung, Logo und Animationen
- `catalog.js`: Produktnamen, Beschreibungen, Bild- und Modellpfade
- `app.js`: Produktauswahl, 3D-Steuerung, Filter, Suche und lokale Auswahl
- `assets/products/`: Bordeaux-Produktbilder
- `assets/models/`: drei volumetrische 3D-Modelle
- `vendor/`: lokal gebündelter 3D-Viewer und Lizenz

Das Repository enthält die aktuelle Website mit dem neuen Logo, der Salonkulisse und den drei Bordeaux-Produkten. Alte Produktbilder, frühere Logo-Dateien, das ursprüngliche Half-Zip-Modell und unbenutzte Medien wurden aus dem aktuellen Stand entfernt.

## Status

Designvorschau, kein aktiver Shop. Preise sind offen und als „Preis folgt“ gekennzeichnet. Es werden keine Bestellungen oder Zahlungen verarbeitet. Die Auswahl wird lokal im Browser gespeichert. Vor einem öffentlichen Shopstart müssen verbindliche Produktdaten, Preise und Rechtstexte ergänzt werden. Frühere Website-Stände bleiben in der Git-Historie erhalten.
