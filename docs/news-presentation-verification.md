# Breaking News: Prüfung vom 9. Oktober 2026

Historischer Prüfstand der ursprünglichen Zeitplanung. Die aktuelle Version verwendet ausschließlich manuell ausgelöste News; siehe [Roncalli-Nachrichten](roncalli-news.md) und die aktualisierte Anleitung.

Die Nachrichten zeigen standardmäßig fünf Sekunden Einspieler und 15 Sekunden ruhende Meldung. Währenddessen sind Preise und Charts verborgen. Bei Veröffentlichung erscheinen ein Nachrichtenlaufband und eine Markierung des Getränks in beiden Gästeansichten. Der automatische Takt ergibt sich aus Abenddauer und Anzahl der Specials: 26 Meldungen in fünf Stunden entsprechen ungefähr 11:32 Minuten. Kleine Zufallsvariationen und Schutzabstände zu normalen Runden bleiben erhalten.

## Nachweise

- Typprüfung und Produktionsbuild erfolgreich.
- 141 Logik-/Servertests bestanden, darunter Legacy-Konfiguration, Veröffentlichungsgrenze und gleichmäßige Verteilung von 16 bzw. 26 Specials.
- 53 Edge-Browsertests bestanden. Sie prüfen zwei synchronisierte Anzeigen, vollständige Abendproben, Einspieler/Lesedauer/Veröffentlichung, Laufband und Hervorhebung, Neuladen und Reset, Bewegung reduzieren sowie Simulation mit Tempowechsel und Pause.
- Screenshots bei 1920 × 1080 für Einspieler, Lesemeldung und Laufband visuell geprüft.
- Read-only-Codeprüfung abgeschlossen. Ein dabei gefundener Planungsfehler bei langen Preisrunden wurde mit einem zunächst fehlschlagenden Reset-Test reproduziert und korrigiert: rückwärts berechnete Zeitgrenzen reservieren Platz für spätere Meldungen. Die Gegenprüfung bestand 1.006 verschiedene Reset-Zufallsabläufe.
- Lokaler Server unter Port 3000 mit neuer Version gestartet; Anmeldung, 14 Getränke, Wasser 0 €, News-Einstellungen 5/20 Sekunden und Admin-Takt 11:32 bestätigt.

Die bestehende Marktdatei wurde vor der Übernahme gesichert. Preise, Vorschauen, Verlauf und manuelle Vorgaben bleiben erhalten; im vorbereiteten Markt wurden lediglich Nachrichtendauer und zukünftige Special-Zeitpunkte aktualisiert. Zugangsdaten bleiben in der lokalen `.env`.

Ausführungsprotokolle und Screenshots liegen lokal im ignorierten Ordner `.artifacts/verification/2026-10-09-news-presentation/` bzw. `.artifacts/previews/`. Der erste Abschlusslauf nach dem App-Neustart konnte temporäre Sandbox-Testmodule nicht laden; der folgende vollständige Lauf außerhalb dieser Sandbox bestand alle 141 Tests.
