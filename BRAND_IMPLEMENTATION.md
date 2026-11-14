# The First Edition · Website, 14 November 2026

Der Neuaufbau folgt dem bereitgestellten aktualisierten Markenplan. Deep Navy (#19283E) und Warm Cream (#F2EBDD) tragen die Gestaltung; Rich Brown (#73543F), Champagne Gold (#C4AA82) und Bordeaux (#762E3B) ergänzen sie. Die vorhandenen lizenzierten, selbst gehosteten Schriften Cormorant Garamond und Manrope erfüllen die Serif-/Sans-Richtung; der Plan legt keine verbindlichen Fontnamen fest.

Die CR-Monogramme unter assets/brand/cr-navy.png und cr-cream.png wurden unverändert mit Transparenz aus der aktualisierten visuellen PDF-Sektion extrahiert. Kein EST.-Jahr. Slogan: Designed to Feel Exceptional.

Startseite und Interaktionslogik wurden neu aufgebaut. Produkt-, Checkout-, Rechts- und Adminseiten folgen der gemeinsamen Markenwelt. Bestehende Produktkennungen, Fotogalerie, Größenwahl, sessionbasierte Auswahl, optionale dauerhafte Speicherung, Appwrite-Anbindung und Checkout-Freigaben bleiben erhalten. Auf Wunsch des Betreibers wurden sämtliche 3D-Ansichten, 360°-Bedienelemente und Renderposter durch die vorhandenen Studiofotos ersetzt. Modelldateien werden nicht mehr ausgeliefert.

Der Vorbestellungsstart Winter 2027/28 wird ausschließlich als Planung bezeichnet. Bestehende Preiswerte bleiben auf Produkt-/Preisübersichtsseiten als Vorschau erhalten; sie sind kein finales Preisversprechen. Materialien, Größen, Herkunft und Lieferdaten werden nicht erfunden. Die Site bleibt mit dem bisherigen privaten Zugriff und den bestehenden Bestell-/Giveaway-Sperren veröffentlicht.

## Bildnachweis

assets/brand/editorial-courtyard.webp ist ein mit dem integrierten ImageGen erzeugtes Stimmungsbild; es zeigt keine verbindlichen C&R-Produkte. Finaler Prompt: ruhiger italienischer Palazzo-Innenhof, warme cremefarbene Steinarchitektur, natürliches Nachmittagslicht, ein Paar in neutralem Navy/Creme rechts, großzügiger architektonischer Raum; fotorealistische Editorial-Fotografie, keine Logos, Texte oder behaupteten Markenprodukte. Originalformat 1672 × 941, als WebP für die Website gespeichert. Alle Produktfotos stammen aus dem vorhandenen Repository. Verfügbar sind zehn Studiofotos; für die fünf fehlenden Farbaufnahmen erscheint „Foto folgt“. Es werden weder andersfarbige Fotos noch gerenderte Produktansichten eingesetzt.

## Build und Veröffentlichung

Frontend-Quellen liegen im Repository-Stamm. `node scripts/build-worker.mjs` baut einen eigenständigen Worker unter .worker-output/dist; `node scripts/stage-worker.mjs` kopiert ausschließlich das generierte Deployment nach dist für den Sites-Paketworkflow. dist ist ignoriert. Originalfoto-Routen und serverseitige Zahlungsprüfung bleiben erhalten; die GLB-Auslieferung und der 3D-Viewer entfallen. Nicht mehr verwendete alte Markenbilder/Intro-Skripte bleiben in der Historie und im Repository, werden aber nicht mehr ausgeliefert.
