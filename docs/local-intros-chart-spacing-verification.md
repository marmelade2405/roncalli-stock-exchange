# Lokale Video-Intros und breitere Charts — 2026-10-12

Die beiden vom Nutzer ausgewählten YouTube-Clips liegen als lokale H.264-Videos mit separatem Originalton im Projekt. Gästebildschirme spielen das Bild stumm ab; der Originalton läuft ausschließlich über die Admin-Tonsteuerung mit deren Lautstärkeregler. Breaking News verwenden standardmäßig zehn Sekunden Intro und zwanzig Sekunden Lesemeldung. Der Börsencrash erhält einen eigenen Parameter „Crash-Einspieler“, standardmäßig fünfzehn Sekunden. Normale Preisrunden und Erholung behalten ihre bisherigen zehn Sekunden.

Alle 38 Meldungen wurden individuell länger und dramatischer formuliert. Die elf Roncalli-Bezüge, beide EZB-Meldungen, Preisrichtungen und Benes Festpreis 1,50 € bleiben erhalten. Bereits angepasste Texte werden beim Übernehmen der neuen Standardtexte erhalten.

Der Abstand zwischen Chart und Änderungsangaben beträgt auf breiten Displays sechs statt zehn Pixel. Bei 1920 Pixeln Bildschirmbreite wächst der Chart in der dreispaltigen Laufliste von etwa 238 auf 257 Pixel; zweispaltig von 466 auf 483 Pixel. Die Übersicht erhält vier zusätzliche Pixel Chartbreite. Eine Browsermessung und Screenshots bestätigen dies.

## Verifikation

- TypeScript und Produktionsbuild erfolgreich; 223 Unit-Tests in 45 Dateien bestanden.
- Alle 25 betroffenen Browserfälle erfolgreich geprüft. Drei neue Crash-Fälle benötigten eine Korrektur ihrer Admin-Sitzung im Testaufbau; danach bestanden sie. Nach der finalen Standbildkorrektur bestanden alle acht neuen Medien-/Textfit-Fälle erneut.
- Echtes Video und PCM-Audio geprüft: Laden, Originalton, Lautstärke, Pause/Resume mit Restzeit, Abbruch, Überspringen, Intro-Ende, Gästebildschirm ohne Ton und Fehler beim Laden.
- Lange Meldungen auf 1280×720 bleiben innerhalb der Anzeige und verändern ihre Größe nicht zwischen Animationsframes. Unzoomte Messung und Cache beheben die im Review nachgewiesene Rückkopplung.
- Reduzierte Bewegung hält ein Standbild; die Synchronisierung sucht dann keine späteren Videoframes.
- Legacy-Array-API und Schema-1-Migration behalten ihre bisherigen Crashzeiten. Ein frisch angelegter Produktionsserver verwendet die neue vorbereitete Konfiguration mit fünfzehn Sekunden.
- Unabhängige Reviews durchgeführt; gefundene Textfit- und Standbildprobleme behoben.

Der laufende Server wurde aktualisiert. Backup: `data/market.json.before-original-news-1791820633686.bak`. Alle 38 unveränderten Standardtextpaare wurden übernommen; Newsdauer beträgt 30 Sekunden, Intro 10 Sekunden, Crashintro 15 Sekunden. Preise, vorherige Preise, Vorschauen, Overrides, Historien, Getränkekonfiguration, Queue und verbrauchte Specials blieben erhalten. Keine Nachricht und kein Crash wurden zur Live-Prüfung ausgelöst.

Screenshots: `.artifacts/previews/news-original-video.png`, `news-dramatic-message.png`, `crash-original-video.png`, `news-stable-short-screen.png` und die `chart-spacing-*.png`-Ansichten. Quellen und lokale Medien sind unter `src/client/public/media/README.md` dokumentiert.
