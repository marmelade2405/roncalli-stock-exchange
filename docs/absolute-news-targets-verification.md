# Absolute Breaking-News-Zielpreise — 2026-10-12

Breaking News verwenden keinen prozentualen Grundimpuls mehr. Ohne Festpreis wird die Grenze des oberen beziehungsweise unteren Zehntels der Min-/Max-Spanne auf das zulässige Preisraster gerundet. Ein bereits stärker ausgeprägtes Extrem bleibt erhalten. Admins können über „Zielpreis €“ einen festen Kurs setzen; ein leeres Feld aktiviert das automatische Ziel. Benes Bierkurs bleibt 1,50 €.

Die angezeigte Prozentänderung beschreibt nur das Ergebnis. Crash-Trend, Erholung und Rückführung wurden nicht geändert. Während einer laufenden Nachricht zeigen Admin-Vorschau und Veröffentlichung denselben zuvor vorbereiteten Kurs.

## Prüfung

- TypeScript und Produktionsbuild erfolgreich.
- 213 Unit-Tests in 44 Dateien bestanden, einschließlich alter Prozentmetadaten, Preisraster und bereits vorbereiteter Nachrichten.
- Alle 26 betroffenen Browserfälle erfolgreich geprüft. Beim ersten Lauf wurde eine veraltete Erwartung für das Entfernen von Benes Festpreis entdeckt: Der neue automatische Bierkurs ist 1,40 €. Nach Korrektur bestanden alle drei Fälle der Nachrichtensuite erneut.
- Unabhängige Codeprüfung ohne offene Befunde.
- Laufender Server aktualisiert; Admin-Anmeldung, entfernte Prozentfelder, 38 Euro-Zielpreisfelder und Festpreis 1,50 € geprüft.

Vor der Migration wurde `data/market.json.before-absolute-news-1791817393658.bak` erstellt. Die 38 alten Prozentfelder wurden entfernt. Preise, vorherige Preise, Vorschauen, Overrides, Historien, Timer, Nachrichtenfortschritt, Getränkekonfiguration und Parameter blieben erhalten. Die zuvor laufende Simulation wurde mit ihrer bisherigen Geschwindigkeit fortgesetzt. Es wurde keine Nachricht zur Prüfung ausgelöst.

Screenshot: `.artifacts/previews/absolute-news-live-settings.png`.
