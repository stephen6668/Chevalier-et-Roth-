# Chevalier et Roth

Neue responsive Designvorschau in Elfenbein, Gold und Bordeaux. Die Website enthält einen animierten Produktbanner, Scroll- und Textanimationen, drei Farbkonzepte, eine Produktsuche und eine lokale Produktauswahl.

## Vorschau und Entwicklung

Die Website besteht aus statischem HTML, CSS und JavaScript und benötigt keinen Build und keine Abhängigkeiten. Lokal die Website über einen HTTP-Server starten:

```sh
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen. Für GitHub Pages den Branch `main` und das Stammverzeichnis `/ (root)` auswählen, sofern Pages noch nicht eingerichtet ist.

## Dateien

- `index.html`: Startseite, Kollektion und Dialoge
- `styles.css`: Responsive Gestaltung und Animationen; `prefers-reduced-motion` wird berücksichtigt
- `app.js`: Farb- und Größenauswahl, Suche, Kollektionfilter und lokale Produktauswahl
- `assets/`: Optimierte Bilder der neuen Designvorschau

Die vorhandenen Produktbilder und `Chevalier_Roth_Halfzip_Bordeaux_Gold_Details.glb` wurden beibehalten. Die alten Website- und Commerce-Skripte wurden entfernt. Frühere Versionen bleiben über die Git-Historie abrufbar.

## Status

Designvorschau, kein aktiver Shop. Produkte, Abbildungen und Preise sind vorläufig. Es werden keine Bestellungen oder Zahlungen verarbeitet. Die Auswahl wird lokal im Browser gespeichert. Die Produktdarstellung verwendet aktuell freigestellte Konzeptbilder. Die interaktive 3D-Integration folgt mit der finalen Modellauswahl. Vor einem öffentlichen Shopstart müssen Produktdaten, Rechtstexte und Commerce-Funktionen vervollständigt werden.
