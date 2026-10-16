# Preisverteilung im Admin · 09.10.2026

Unter Einstellungen zeigt eine Linienvorschau die angenäherte Verteilung normaler Preisrunden für das ausgewählte Getränk. Sie verwendet dieselbe `randomPrice`-Berechnung wie der Markt, einen separaten deterministischen Zufallsgenerator, 2.000 Einlaufrunden und 200.000 ausgewertete Runden. Min/Max, Average, Rückführung, Rundung und Schwankung fließen ein; Crashs und Specials bleiben außen vor.

Die sieben Parameterfelder direkt am Diagramm sind mit der Getränketabelle verbunden. Ungespeicherte Änderungen aktualisieren die Vorschau nach 180 ms; sie führen keine Marktaktion aus. Gespeicherte Konfigurationen ohne Average behalten ihre tatsächliche Zufallswanderung. Leere Listen und ungültige Eingaben erhalten keine veraltete Diagrammanzeige. Preisgruppen sind auf 200 begrenzt; größere Gruppen werden beschriftet. Gleich lange Runden erlauben die Interpretation als angenäherte Zeitanteile, nicht als Umsatzanteile.

## Nachweise

- TypeScript und Produktionsbuild erfolgreich.
- Alle 167 Logik-/Servertests erfolgreich. Der erste vollständige Sandbox-Lauf scheiterte an Vitest-Temporärdateien (ENOENT); der vollständige Lauf außerhalb der Sandbox war erfolgreich.
- 34 betroffene Admin-Browsertests erfolgreich: Speichern, Entwürfe, Reset, Navigation, Verteilung und Preisparameter.
- Neue Verteilungstests prüfen Bierhäufigkeiten, deterministische Konzentration, fehlende Rückführung, Wasser, Rundung/Begrenzung, ungültige Entwürfe und breite Preisbereiche.
- Browserprüfungen belegen synchrone Tabelle-/Diagrammfelder, unveränderte Serverpreise und Konfiguration beim Editieren, Fehleranzeigen, alte Konfigurationen, vollständig geleerte Entwürfe und Bedienbarkeit bei 375/1440 Pixel Breite.
- Unabhängige Codeprüfung abgeschlossen; beide Befunde zu alten Konfigurationen und leeren Entwürfen behoben und durch Browsertests abgesichert.
- Lesender Check auf `localhost:3000` bestätigte Linienvorschau, Biermittelwert 1,80 € und Wasser 0,00 €. Die vollständige Marktdatei war vor und nach dem Check identisch. Ein Backendneustart oder eine Marktübernahme war für diese Vorschau nicht nötig.
