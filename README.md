# Forum Romanum – Rundgang

Statischer First-Person-Viewer, ohne Laufzeit-Abhängigkeiten von externen CDNs. Three.js 0.180.0 samt Lizenz liegt in `vendor`. Das GLB nutzt GPU-Instanzen.

## Benutzen

- Linker Stick: vorwärts/rückwärts und seitwärts relativ zur Blickrichtung. Die radiale Auslenkung steuert die Geschwindigkeit bis 4,5 Modelleinh./Sekunde, mit kleiner Totzone im Zentrum.
- Rechter Stick: horizontal und vertikal umsehen. Beide Sticks funktionieren gleichzeitig über getrennte Pointer-IDs; beim Loslassen, Touch-Abbruch und App-Wechsel werden die Eingaben zurückgesetzt.
- Zum Start: zurück auf den Forumsplatz. Die Augenhöhe beträgt 1,7 Modelleinh.
- Computer: WASD; Pfeile oder Ziehen mit der Maus zum Umschauen.

## Statisch hosten

Den **Inhalt von `dist`** vollständig auf einen HTTPS-Webserver kopieren, einschließlich `assets`, `vendor`, `js` und `css`. Keine Serverlogik und kein Node.js auf dem Hosting erforderlich. Relative URLs erlauben Unterverzeichnisse. JS als JavaScript, JSON als application/json und GLB möglichst als model/gltf-binary ausliefern. Die Datei nicht per Doppelklick als file:// öffnen.

Lokal mit installiertem Node.js: `npm run dev`. Adresse: http://localhost:4173. Im selben WLAN ist der Server über die lokale IP dieses Computers und Port 4173 erreichbar, sofern die Firewall dies bereits erlaubt. An der Firewall wurde nichts verändert.

`npm run build` erstellt die statische Ausgabe. Vendorte Bibliotheken sind bereits enthalten. Falls das benachbarte `../node_modules/three` vorhanden ist, aktualisiert der Build daraus die lokalen Dateien. `npm test` prüft die Bewegungsmathematik und Navigation.

## Modell und Navigation

Die Geometrie wird unverändert dargestellt. Eine vorberechnete Bodenkarte in `assets/navigation.json` vermeidet teure Modell-Raycasts auf dem iPad. Sie hat ein Raster von 0,65 Modelleinh., unterstützt Stufen bis 0,65 und prüft Hindernisse zwischen Nachbarzellen. Die Karte wird mit dem benachbarten Blender-Skript `../scripts/navigation.py` erstellt.

Dies ist eine einfache Navigation für die bodennahen Wege, keine vollständige physikalische Kollision: schmale Details können zwischen Rasterpunkten liegen; übereinanderliegende Etagen und höhere Plattformen sind nicht als getrennte Ebenen erschlossen. Die Kamerahöhe folgt geglättet dem Boden. Die Schritthöhe und Augenhöhe beruhen auf Modellkoordinaten, nicht auf einer historisch verifizierten Maßstabsangabe.

Geprüft: Syntax, drei automatisierte Tests, Startposition und Erreichbarkeit von 17.458 Rasterzellen, lokale HTTP-Auslieferung und statischer Build. Eine echte iPad-/Safari-Prüfung von Darstellung, zwei gleichzeitigen Daumen und Bildrate steht noch aus. Die Renderauflösung ist auf 1,5-fache Pixeldichte begrenzt und sinkt bei langsamen Startframes auf 1. Dynamische Schatten sind aus.
