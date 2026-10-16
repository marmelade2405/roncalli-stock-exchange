# Lauflisten-Reihenfolge und Preisgrenzen · 12.10.2026

Die Laufliste zeigt Chart links, Änderung mittig sowie Getränk und Preis rechts. Text und Preis sind rechtsbündig. Zwei Spalten, verfügbare Charthöhe, Echtzeitbewegung und Neustart von unten nach einer Preisrunde bleiben erhalten.

Die Namensspalte verwendet nur die benötigte Breite, begrenzt auf 190 Pixel bei großen Anzeigen. Lange Namen umbrechen; der übrige Platz geht an den Chart. Der Abstand zwischen den Bereichen beträgt 10 Pixel, bei kleineren Geräten 8 bzw. 6 Pixel. Produktionsbuild und visuelle Prüfung bei Full HD, 720p und Handybreite bestätigen die kompakte Anordnung ohne horizontalen Überlauf.

Die Chart-Beschriftung verwendet die konfigurierten Grenzen als „Min“ und „Max“ und den Zielpreis als „Avg“. Bei Rum Cola sind dies 1,20 €, 6,00 € und 2,00 €. „Hoch“ bezeichnete vorher das sichtbare Maximum und konnte deshalb dem Average entsprechen. Es werden keine historischen Preise verändert. Die automatische Skala folgt weiterhin den wirklichen Verlaufsextremen. Offscreen-Referenzen erhalten einen Pfeil und keine fälschlich positionierte Linie; Wasser bleibt „Fix 0,00“.

Prüfung: TypeScript und Build erfolgreich; sechs Chart-Unit-Tests erfolgreich. Von 15 betroffenen Browsertests bestanden zunächst 14. Der bestehende Tempo-Test erhielt direkt nach Anmeldung noch den Ausgangswert des Reglers; die gezielte Wiederholung bestand. Der geänderte Regressionstest für Rum Cola scheiterte vor der Umsetzung an „Hoch / Avg 2,00“ und bestand danach mit „Max ↑ 6,00“ und „Avg 2,00“.

Zusätzliche Prüfung der Chartgrenzen bei 1920×1080, 1280×720 und 390×844: alle Diagramme innerhalb ihrer Karten, kein horizontaler Seitenüberlauf. Aktueller lokaler Server im Browser geprüft. Die Änderungen betreffen ausschließlich die Gästeanzeige; bestehende Konfiguration und Preise bleiben erhalten.
