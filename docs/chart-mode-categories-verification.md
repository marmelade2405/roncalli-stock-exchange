# Balken-Schalter und Barteam-Kategorien · 12.10.2026

Unter Gästeansicht aktiviert die Admin-Checkbox „Rot/grüne Balkencharts“ sofort die gespeicherte Balkendarstellung für beide Gästebildschirme. Ohne Haken erscheinen die neutralen Linien. Beide Varianten verwenden die automatische Skalierung der sichtbaren Historie. Preise, Vorschauen und Timer werden beim Umschalten nicht verändert. Alte Marktdateien ohne Diagrammwahl bleiben kompatibel und zeigen Linien.

Die Barteam-Preisliste gruppiert alle 20 Getränke in Shots, Bier, Longdrinks, Alkoholfrei sowie Wein & Aperitifs. Wasser gehört zu Alkoholfrei und bleibt kostenlos. Eigene Kategorien bleiben erhalten. Die Ansicht verwendet zwei Spalten auf breiten Bildschirmen und eine scrollbare Folge auf schmalen Geräten.

## Prüfung

- TypeScript und Produktionsbuild erfolgreich.
- Gesamte Unit-Suite: 199 Tests in 42 Dateien erfolgreich.
- Betroffene Edge-Browsertests: 20 erfolgreich. Geprüft wurden unter anderem beide synchronisierten Gästeanzeigen, gespeicherte Diagrammwahl nach Neuladen, Balken in der Laufliste, unveränderte Preise und Vorschauen sowie vollständige Kategorien auf Desktop und Handy.
- Unabhängiger Code-Review ohne offene Befunde.
- Lokaler Server mit neuer Version gestartet. Browserprüfung der echten Admin-Checkbox und kategorisierten Barteam-Liste erfolgreich; alle 20 Preise entsprechen dem veröffentlichten Marktstand.
- Marktdatei vor dem Neustart unverändert gesichert: `data/market.json.before-chart-mode-1791789526746.bak`. Preise, Vorschauen, Vorgaben, Historie, Specials, Timer und Konfiguration wurden nach dem Neustart auf Erhalt geprüft. Die anschließende Browserprüfung änderte die Marktdatei nicht.

Screenshots liegen lokal unter `.artifacts/previews/staff-menu-categories.png`, `.artifacts/previews/enabled-bars-ticker.png`, `.artifacts/previews/staff-categories-live.png` und `.artifacts/previews/chart-mode-live-admin.png`.
