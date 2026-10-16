# Gruppierte Laufspalten und Simulation bei 1× · 12.10.2026

Neue Märkte, Werkseinstellungen und alte Dateien ohne Spaltenwahl verwenden drei Spalten. Die gruppierte Laufliste zeigt links Wein/Aperitifs, Longdrinks und Bier, mittig Shots und rechts alkoholfreie Getränke einschließlich Wasser. Im Standardkatalog sind dies 7 / 7 / 6 Getränke. Die bestehende Reihenfolge innerhalb der Gruppen bleibt erhalten. Eigene unbekannte Kategorien bleiben links sichtbar; leere Gruppen werden bei kleinen Katalogen weggelassen. Zwei Spalten bleiben auswählbar und verteilen den Katalog gleichmäßig. Schmale Geräte zeigen eine Spalte.

Eine neu aktivierte Simulation startet bei 1×, sowohl über die Oberfläche als auch über die API ohne explizites Tempo. Ein bereits gewähltes Simulationstempo bleibt bei normalen Updates erhalten. Der Regler ist weiterhin jederzeit von 1× bis 500× einstellbar.

TypeScript und Build erfolgreich; 207 Unit-Tests in 44 Dateien erfolgreich. Alle 15 betroffenen Browser-Testfälle erfolgreich geprüft, darunter Gruppenüberschriften, 1×-Start, Zwei-Spalten-Umschaltung, gleiche Chartbreiten, Nulländerungen, kleine Kataloge, Geschwindigkeit bei Lauf/Pause/Crash und die drei Chartmodi. Unabhängiger Review ohne offene Befunde.

Lokaler Server aktualisiert und die gewünschten drei Spalten sowie 1× im bestehenden Markt aktiviert. Sicherung: `data/market.json.before-grouped-ticker-1791807956585.bak`. Aktuelle Preise, Vorgaben, Vorschauen, echte und simulierte Historie, Specials und Timer blieben erhalten. Die Browserprüfung bestätigte die Gruppen 7 / 7 / 6, Wasser rechts und Rum bei den Shots. Die zuvor laufende Simulation wurde fortgesetzt. Screenshot: `.artifacts/previews/grouped-ticker-live.png`.
