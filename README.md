# Aktueller Spielstand

Der Viewer enthält jetzt die spielbare Quest bei Livia. Upload, Bedienung, Umfang und aktueller Prüfstand stehen in [Spielprobe-START.md](../Spielprobe-START.md). Die nachfolgende Dokumentation beschreibt die frühere Viewer-Grundlage.

# Forum Romanum – Rundgang

## Aktuelle Oberflächen und weichere Schatten

Der Viewer verwendet jetzt eine beim Laden in zwei Richtungen vorgefilterte VSM-Schattenkarte (weiterhin 2048², acht Filterproben, Radius 3). Damit entfällt das grobe Muster der zuvor weit auseinanderliegenden PCF-Abtastpunkte. Die Karte bleibt zwischengespeichert. VSM benötigt zusätzliche Filterpuffer und zwei einmalige Filterdurchläufe, reduziert dafür die Schattenabfragen während des Rundgangs. Sehr dünne oder überlappende Formen können bei dieser Technik etwas Licht durchlassen; die echte iPad-Bildrate und Schattenwirkung sind noch nicht gemessen.

`js/surface-details.js` ergänzt prozedurale Oberflächen in Weltkoordinaten: versetzte Bodenplatten von ungefähr 1,75 × 1,2 Modelleinh., kleine Farb- und Rauheitsunterschiede, zurückhaltende Marmoradern sowie kurze Haarrisse an etwa 3,5 % der Plattenecken. Auf senkrechten Steinflächen sind die Fugen schwächer; Ziegel und Terrakotta haben eigene, dezente Raster. Metall, Wasser und Holz erhalten diese Steinmuster nicht. Bildschirmableitungen glätten dünne Linien und blenden feine Details in der Entfernung aus. Keine zusätzlichen Bilddownloads, Meshes oder UV-Daten sind dafür nötig; die Shaderberechnung kostet etwas zusätzliche Rechenzeit. Die Bildrate auf iPads ist noch nicht überprüft.

Diese letzte Materialüberarbeitung betrifft den Web-Viewer. Die separate Blender-Datei enthält weiterhin die zuvor erstellte Cartoon-Geometrie und die einfarbigen Basismaterialien. Nachfolgende Abschnitte dokumentieren die früheren Arbeitsschritte.

## Aktuelle Fassung: stilisiertes Forum

Das Standardmodell in `assets/models/forum-romanum.glb` ist jetzt die in Blender bearbeitete Cartoon-Fassung. Die separate Arbeitsdatei liegt in `../03-blender/ForumRomanum-cartoon.blend`, der eigenständige Export in `../04-web-modelle/forum-romanum-cartoon.glb`. Das ursprüngliche Modell ist außerhalb des Web-Ordners erhalten.

Die Bearbeitung verbindet ruhige, einfarbige Materialien (Elfenbein, Kalkstein, Terrakotta, Bronze und Akzente) mit abgerundeten Architekturdetails. 609 der 1.129 gemeinsam verwendeten Meshes wurden mit geometrischen Rundungen versehen, neun organische Ornament-Meshes leicht geglättet. Koplanare Unterteilungen wurden bereinigt. Positionen, Säulenstellungen, Grundriss und Hauptsilhouetten stammen unverändert aus dem Ausgangsmodell; Rundungen liegen innerhalb der bestehenden Formen. Fototexturen sind entfernt, damit die Wirkung durch Formen, Materialfarben und Licht entsteht. Nur auf Texturen vorhandene Inschriften und Reliefdarstellungen sind dadurch vereinfacht bzw. entfallen.

Export: 11.689.824 Bytes, 16 Materialien, keine Bildtexturen, GPU-Instanzen. Der GLB-Reimport ergibt 9.446 Mesh-Objekte und 2.247.250 Dreiecke. Die Gesamtabmessungen stimmen mit dem Ausgangsmodell überein. Das ist eine stilistische Überarbeitung der vorhandenen Architektur und keine neue historische Rekonstruktion.

Die Lichtabschattung wurde in Blender für die neue Geometrie neu gebacken. Auch die Navigation wurde neu erzeugt (17.211 vom Start erreichbare Rasterzellen). Himmel und Fernkulisse verwenden die passende warme Cartoon-Palette. Blender-Ansichten in `../berichte/cartoon-overview.png` und `../berichte/cartoon-walk.png` wurden visuell geprüft. Diese Bilder sind Cycles-Renderings; das Echtzeitlicht im Viewer kann davon abweichen. Eine visuelle Prüfung der neuen Fassung auf einem echten iPad steht noch aus.

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

Geprüft: Syntax, sechs automatisierte Tests, Startposition und Erreichbarkeit von 17.458 Rasterzellen, lokale HTTP-Auslieferung und statischer Build. Eine echte iPad-/Safari-Prüfung von Darstellung, zwei gleichzeitigen Daumen und Bildrate steht noch aus. Die Renderauflösung ist auf 1,5-fache Pixeldichte begrenzt und sinkt bei langsamen Startframes auf 1. Kantenglättung ist aktiviert.

## Licht und Umgebung

Das Himmelslicht ist deutlich zurückgenommen. Warme gerichtete Sonne und weich gefilterte Gebäudeschatten modellieren Säulen, Arkaden und Fassaden. Die 2048²-Schattenkarte wird einmal nach dem Laden berechnet und bleibt beim Rundgang unverändert; Änderungen an Geometrie oder Sonne erfordern eine erneute Schattenberechnung.

`assets/lighting` enthält eine in Blender gegen die gesamte Originalgeometrie vorberechnete Himmelslicht-Abschattung: 128 × 22 × 81 Messpunkte, 24 Strahlen je Punkt, insgesamt 228.096 Bytes plus Metadaten. Das ist ein räumliches Ambient-Occlusion-Bake, kein vollständiger UV-basierter Lichtatlas oder Path-Tracing-Bake. Zwischenwerte werden weich interpoliert. Es verdunkelt indirektes Licht in geschützten Bereichen, ohne die Originaltexturen oder Instanzen zu verändern. Die 1,5-Einheiten-Abtastung ist für größere Strukturen gedacht; feinere Kontaktschatten kommen aus der Schattenkarte. Erzeugung: `../scripts/bake-occlusion.py` in Blender.

Exponentieller Nebel mit Dichte 0,0032 mischt bei 100 Einheiten Entfernung etwa 9,7 % Hintergrundfarbe bei, bei 200 Einheiten etwa 33,6 %. Ein verlaufender Himmel und niedrige Hügel bilden den Horizont.

Die deterministische Low-Poly-Fernkulisse umfasst 940 Hauskörper mit Hofanordnungen, Putzfarben und Ziegeldächern (16.920 Architekturdreiecke, zusätzlich Gelände und Himmel). Sie wird in wenigen zusammengefassten Meshes erzeugt und ist nicht begehbar. Sie ist eine atmosphärisch plausible Ergänzung, keine wissenschaftliche Rekonstruktion konkreter Nachbarviertel. Die Navigationskarte bleibt unverändert. Die Fernkulisse empfängt Schatten, wirft selbst aber keine zusätzlichen Schatten.

Nach Änderungen die Seite vollständig neu laden. Es wurde nichts auf einen externen Server übertragen; das lokale ZIP enthält alle neuen Lichtdaten.

