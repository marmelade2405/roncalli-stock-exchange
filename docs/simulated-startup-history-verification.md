# Zwei Blockspalten und simulierte Starthistorie · 09.10.2026

Die Laufliste behält die einzelnen Getränkeblöcke und verwendet auf breiten Anzeigen wieder zwei Spalten. Echtzeittempo, feine 1–3-Sekunden-Regelung und leerer Einlauf nach Veröffentlichung bleiben erhalten. Charts nutzen mehr Blockhöhe, auch in der adaptiven Übersicht. Der Hinweis „Satire · Fiktive Börsenmeldung“ wurde aus dem Nachrichtenfenster entfernt.

## Starthistorie

Die alte clientseitige Sinus-/Momentum-Demo wurde entfernt. `simulateStartupHistory` verwendet dieselben normalen Zufallsrunden, Crashvorschläge und prozentgleichen Erholungen wie der Markt. Ein unabhängiger, aus den Parametern abgeleiteter Zufallsgenerator erzeugt reproduzierbare Werte, ohne den Zufallsstrom der echten Vorschauen zu verändern. Die Vorgeschichte enthält fünf Crashs und fünf passende Erholungen, mit normalen Runden dazwischen. Höhere Verlaufslängen ergänzen zusätzliche normale Runden; maximal 51 Punkte werden gespeichert. Wasser bleibt durchgehend 0 €.

Die simulierte Vorgeschichte wird getrennt von tatsächlich veröffentlichten Preisen gespeichert. Sie füllt nur fehlende Plätze im Diagramm; echte Änderungen ersetzen sie schrittweise. Bei den üblichen 15 Datenpunkten enthält der anfängliche Verlauf fünf Crashs plus den tatsächlichen Ausgangspreis als letzten Anker. Aktuelle Preise, tatsächliche Delta-Werte, Vorschauen, Overrides und der echte Marktverlauf werden nicht durch die Simulation verändert. Neue Konfigurationen und neue Abende erzeugen die passende Vorgeschichte neu. Alte Dateien ohne dieses optionale Feld bleiben lesbar.

## Prüfung und Übernahme

- TypeScript und Produktionsbuild erfolgreich.
- Alle 192 Logik-/Servertests und alle 81 Edge-Browsertests erfolgreich.
- Tests prüfen fünf Crashs/Erholungen mit tatsächlich konfigurierten Prozenten, Wiederholbarkeit, Einfluss der Parameter, Rundung/Grenzen, Wasser und Isolation der echten Historie.
- Zwei Anzeigen und Neuladen zeigen dieselben gespeicherten Werte. Echte Änderungen ersetzen die simulierten Punkte; Blockspalten, höhere Charts und entfernte Nachrichtennotiz sind geprüft.
- Altdatei-Migration verankert die Simulation vor der frühesten tatsächlichen Preisaufzeichnung; dies ist durch einen Regressionstest abgesichert.
- Unabhängige Codeprüfung ohne offene Befunde. Eine überlagernde Höhenregel wurde korrigiert. Sichtprüfung bei 1920×1080 sowie bestehende Prüfungen kurzer Bildschirme erfolgreich.
- Der ursprüngliche lokale Marktstand wurde als `data/market.json.before-simulated-startup-history-1791560784601.bak` gesichert. Nur die neue Simulationshistorie und Revision wurden ergänzt. Preise, Vorschauen, Vorgaben, echte Historie, Zeitpunkte, News, Ansicht und Uhrenanker wurden unverändert verglichen.
- Der lokale Server läuft mit dem neuen Build auf Port 3000. Der lesende Check bestätigte fünf gespeicherte Crashs und fünf Erholungen je Getränk sowie kostenloses Wasser. Die vollständige Marktdatei blieb während des Checks unverändert.
