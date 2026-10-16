# Gleich breite Charts und drei Spalten · 12.10.2026

Balken mit Abstand sind der Standard für neue Märkte, Werkseinstellungen und alte Dateien ohne Diagrammwahl. Eine ausdrücklich gespeicherte andere Diagrammwahl bleibt erhalten.

Im Admin unter Gästeansicht wählt „Laufliste: Spalten“ zwei oder drei Spalten. Die Auswahl wirkt sofort auf beide Anzeigen und bleibt bei Konfiguration, Neuladen und Abend-Neustart erhalten. Werkseinstellungen wählen zwei Spalten. Schmale Geräte zeigen eine Spalte. Die Aufteilung bleibt auch für kleine, nicht durch drei teilbare Getränkelisten vollständig und ohne leere Spalten.

Die Karten verwenden feste Breiten für Änderung und Name/Preis. Alle Chartflächen und ihre eigentlichen Zeichenbereiche sind gleich breit; Referenzbeschriftungen erhalten einen gemeinsam bemessenen Rand. Namen umbrechen. Die Schriftgrößen passen sich in drei Spalten stärker an, damit Euro- und Prozentbeträge auch bei 1000 Pixel Bildschirmbreite auf jeweils einer Zeile bleiben.

Limo und Rum hatten im geprüften Markt seit dem Start keine echte Preisänderung, daher war der echte Vorgängerkurs leer. Die Laufliste zeigt in diesem Fall ausdrücklich ±0,00 € und ±0,0 % statt „—“. Die simulierte Vorgeschichte wird nicht als echter Vorgängerkurs ausgegeben; Preise und Historie werden dafür nicht verändert. Unverändertes kostenloses Wasser zeigt ebenfalls 0,0 %.

Die Übersicht verwendet inzwischen dieselbe Anfangsanzeige. Der Screenshot mit Strichen bei unveränderten Getränken entstand dort vor der ersten tatsächlichen Änderung. Der ergänzte bestehende Browser-Regressionstest reproduzierte den Strich zunächst und bestand nach der Korrektur; Produktionsbuild und fünf betroffene Browsertests waren erfolgreich. Die Änderung betrifft nur die Gästeanzeige und benötigt keinen Serverneustart.

TypeScript, Produktionsbuild und 204 Unit-Tests in 43 Dateien erfolgreich. Betroffene Browserprüfungen decken Chartmodi, Preis-Einblendungen, zwei/drei Spalten, gleiche äußere/innere Chartbreiten, Nulländerungen, Speicherung, kleine Getränkelisten, schmale Displays sowie Rücksetzung ab. Der abschließende Spaltentest mit 1000/1280 Pixel Breite und vier Getränken bestand. Im unabhängigen Review festgestellte Umbrüche bei kleinen Schriftbereichen wurden korrigiert und nachgeprüft.

Lokaler Server aktualisiert; Sicherung `data/market.json.before-ticker-layout-1791806416665.bak`. Preise, Vorschauen, Vorgaben, Historien, Specials und Timer blieben erhalten. Browserprüfung der tatsächlichen Anzeige und neuen Admin-Auswahl erfolgreich. Die zuvor laufende Simulation wurde fortgesetzt. Screenshots liegen unter `.artifacts/previews/ticker-equal-charts-2.png`, `ticker-equal-charts-3.png` und `ticker-layout-live.png`.
