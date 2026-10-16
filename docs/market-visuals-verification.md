# Marktvisualisierung: Prüfung vom 9. Oktober 2026

Die News zeigen „RONCALLI STOCK MARKET EXCHANGE“ im unteren Introband. Banner, Schlagzeile und Begründung sind größer; lange Meldungen werden auch auf kurzen Bildschirmen eingepasst. Demo-Kurven verwenden deterministische, zusammenhängende Trends um den Average statt regelmäßiger Vorzeichenwechsel.

Die Laufliste zeigt ab 1.000 Pixel Bildschirmbreite zwei parallele Spalten. Die Getränke werden vollständig aufgeteilt, auch bei ungerader Anzahl. Schmale Geräte verwenden eine Spalte mit allen Getränken. Das Standardtempo beträgt drei Sekunden je Zeile. Beide Ansichten markieren den aktuellen Chartendpunkt mit einem blinkenden Punkt; reduzierte Bewegung deaktiviert das Blinken.

Der Crash-Einspieler zeigt roten Alarmrahmen, fallende Pfeile, eine einbrechende Kurslinie und einen kurzen Bildschirmstoß. Die Bewegung folgt dem gemeinsamen Marktclock-Fortschritt, sodass beide Anzeigen synchron bleiben und Pausen die Bewegung anhalten. Bei reduzierter Bewegung bleiben Rahmen und Pfeile ruhig; Countdown und Kurslinienfortschritt bleiben ablesbar. Veröffentlichungszeit und das Verbergen der Preise bleiben unverändert.

Die Admin-Beschriftungen unterscheiden den berechneten Mittelwert der wirksamen nächsten Preise von der konfigurierten Erholungstendenz. Die Rechenlogik bleibt unverändert.

## Nachweise

- Typprüfung und Produktionsbuild erfolgreich.
- 149 Logik-/Servertests bestanden.
- Gesamtlauf mit 64 Edge-Browsertests bestanden; anschließend fünf gezielte Nachtests nach der Korrektur des statischen Crash-Rahmens bestanden.
- Geprüft wurden zwei synchronisierte Lauflisten, alle Getränke beim Wechsel der Bildschirmbreite, blinkende Endpunkte, reduzierte Bewegung, größere Nachrichten, lange Texte bei 720 Pixel Höhe, Crash-Preisfreiheit und Admin-Beschriftungen.
- Screenshots von zweispaltiger Laufliste, News, langer Meldung und Crash visuell geprüft.
- Read-only-Codeprüfung abgeschlossen. Die dort gefundene leichte Deckkraftänderung im reduzierten Crash-Modus wurde zunächst reproduziert und auf einen konstanten Wert umgestellt.
- Tatsächlicher Server unter Port 3000 geprüft: Anmeldung, Mittelwertbeschriftung, drei Sekunden Lauflisten-Tempo, Endpunkte und Wasser bei 0 €.

Der vorhandene Marktstand wurde vor der Übernahme gesichert. Preise, Verlauf, Vorgaben, Timer, Reihenfolge und verbrauchte Nachrichten wurden erhalten. Nur das Lauflisten-Tempo wurde auf drei Sekunden gesetzt. Lokale Nachweise liegen in `.artifacts/verification/2026-10-09-market-visuals/`.
