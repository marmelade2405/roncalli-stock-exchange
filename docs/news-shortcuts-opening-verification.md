# Breaking-News-Sprung und Begrüßung — 2026-10-12

In der Simulation überspringt ein Klick auf den Countdown auch Breaking-News-Einspieler und Nachricht. Das funktioniert im Admin sowie auf einem Display mit bestehender Admin-Anmeldung. Der vorbereitete Preis wird einmal veröffentlicht und die Meldung in die Leiste übernommen. Normale Rundendeadline, Simulationsgeschwindigkeit und Pause bleiben erhalten. Im Livebetrieb und für Gäste ohne Admin-Anmeldung ist die Funktion gesperrt.

Vor der ersten ausgelösten Nachricht läuft die Begrüßung in der Breaking-News-Leiste: „Roncalli AG geht an die Börse. Getränkepreise ab sofort handelbar. Die Roncalli AG wünscht viel Spaß!“ Sie verursacht keine Preisänderung. Ein Reset stellt sie wieder her; spätere normale Preisrunden lassen sie nicht erneut erscheinen. Der Text „Investieren Sie bereits heute in einen geilen Abend!“ steht dauerhaft unter dem Display-Titel.

## Verifikation

- TypeScript und Produktionsbuild erfolgreich.
- 215 Unit-Tests in 44 Dateien bestanden. Der erste isolierte Gesamtlauf scheiterte beim Lesen temporärer Vitest-Dateien; außerhalb der Isolation bestand die vollständige Suite.
- 15 betroffene Browserfälle bestanden, einschließlich Nachrichtensprung, pausierter Simulation, regulären Crash-Sprüngen, Live-Sperre, Startmeldung, Reset, Verbindungsausfall und synchroner Veröffentlichung.
- Nach visueller Zentrierung des News-Countdowns bestanden die drei neuen Browserfälle erneut.
- Screenshots geprüft: `.artifacts/previews/opening-news-display.png` und `.artifacts/previews/news-simulation-skip.png`.
- Unabhängige Codeprüfung ohne offene Befunde.
- Laufender Server aktualisiert und überprüft. Marktstand erhalten; zuvor laufende Simulation mit bisheriger Geschwindigkeit fortgesetzt. Backup: `data/market.json.before-news-shortcuts-20261012171521.bak`.
