# Laufliste und Balken · 09.10.2026

Die Gäste-Laufliste zeigt wieder eine einzelne Folge voller Getränkeblöcke. Der Admin-Regler erlaubt 1–3 Sekunden je Block in Schritten von 0,05 Sekunden. Die Bewegung verwendet einen gespeicherten Echtzeitanker und läuft unabhängig von Markt-Beschleunigung oder Simulationspause. Tempoänderungen erhalten die aktuelle Scrollposition. Nach einer Preisveröffentlichung beginnt die Liste leer am unteren Rand und fährt mit allen neuen Werten zusammen ein; gestaffelte Einzel-Pops und deren Töne entfallen für diese Ansicht. Die Übersicht behält ihre bisherige Einblendung.

Jeder Chart-Datenpunkt erhält einen gleich breiten Platz. Die roten/grünen Balken schließen ohne horizontalen Abstand aneinander an, auch bei ungleichen oder identischen Zeitstempeln. Die horizontale Anordnung bildet die Reihenfolge ab; tatsächliche Zeiten stehen weiter in der Diagrammbeschreibung. Min-/Average-/Max-Skala und 15 Datenpunkte bleiben erhalten.

## Nachweise

- TypeScript und Produktionsbuild erfolgreich.
- Alle 191 Logik-/Servertests und alle 80 Edge-Browsertests erfolgreich.
- Neue Tests belegen feine 1,95-Sekunden-Werte, Echtzeitoffset statt 500×-Marktzeit, unveränderte Bewegung bei Simulationspause, leeren Neustart nach Veröffentlichung und fehlende gestaffelte Quotes in der Laufliste.
- Tests belegen gleiche Balkenbreiten und exakte Nachbarschaft bei normalen, doppelten und unregelmäßigen Zeitpunkten in Übersicht und Laufliste.
- Bestehende Prüfungen für reduzierte Bewegung, alle Getränke, zwei synchronisierte Anzeigen, Einblendung in der Übersicht, Nachrichten, Crash und Admin-Steuerung bleiben erfolgreich.
- Unabhängige Codeprüfung ohne offene Befunde; Echtzeitanker, Schleifenübergang, Tempoänderung, Pause und Veröffentlichung geprüft.
- Sichtprüfung der einzelnen breiten Blöcke und angrenzenden Balken bei 1920×1080 erfolgreich.

## Lokale Übernahme

Die vollständige Marktdatei wurde gesichert als `data/market.json.before-ticker-rework-1791558784805.bak`. Das vorhandene Tempo von 2 Sekunden wurde beibehalten, ein neuer Echtzeitanker gesetzt und die Revision erhöht. Preise, Vorschauen, manuelle Vorgaben, Verläufe, Termine, eingefrorene Übergänge, Nachrichten und Gästeansicht wurden unverändert verglichen. Eine ggf. laufende gestaffelte Präsentationspause für die Laufliste wird beendet. Simulationen bleiben nach dem Serverneustart entsprechend dem bestehenden Wiederanlaufverhalten pausiert; die Laufliste bewegt sich trotzdem weiter.

Der lokale Server läuft mit dem neuen Build auf Port 3000. Der lesende Check bestätigte den Reglerbereich 1–3 Sekunden mit Schritt 0,05, angrenzende Balken und gespeicherten Echtzeitanker. Die vollständige Marktdatei blieb während dieses Checks unverändert.
