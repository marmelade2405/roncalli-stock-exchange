# Transparenter News-Übergang — 2026-10-12

„We interrupt this party“ ist entfernt. Die grüne Schlussfläche lag im ausgewählten Originalvideo. Die Anzeige verwendet jetzt eine lokale VP9-WebM-Version mit Alpha-Kanal; grüne Flächen geben die kommende Nachricht darunter frei. Video und Intro-Hintergrund verdecken diese Transparenz nicht. Im letzten Abschnitt gibt es nur den zur kommenden Nachricht gehörenden Countdown; Überspringen bleibt bedienbar.

Bei der Prüfung fiel außerdem fehlende Byte-Range-Unterstützung auf: Der Browser blieb beim Springen auf Videoposition 0. MP4, WebM und M4A erhalten jetzt korrekte 206-Teilantworten, Content-Range und Accept-Ranges; außerhalb der Datei liegende Bereiche antworten mit 416.

Verifikation: TypeScript und Build erfolgreich, 224 Unit-Tests und 14 betroffene Browserfälle bestanden. Der Regressionstest beobachtete zunächst einen vollständig undurchsichtigen Schlussframe. Nach der Korrektur ist dieser transparent und die kommende Nachricht sichtbar. Pause, Überspringen, reduzierte Bewegung, Textgröße und Crash-Video wurden ebenfalls geprüft. Unabhängige Prüfung ohne offene Befunde.

Der laufende Server wurde aktualisiert. Die Live-Prüfung konnte zu Sekunde 8,5 springen und ermittelte 0 % undurchsichtige Pixel am Schlussframe. Marktstand, Preisvorschauen, Historie, Queue, Zeitparameter und vorbereitete Ereignisse blieben erhalten; die bisher laufende Simulation wurde fortgesetzt. Backup: `data/market.json.before-transparent-news-20261012182309.bak`. Es wurde kein Special zur Live-Prüfung ausgelöst.

Screenshot: `.artifacts/previews/news-transparent-handoff.png`.
