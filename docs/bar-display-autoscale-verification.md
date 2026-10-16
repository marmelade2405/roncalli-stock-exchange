# Barteam-Preise, Chartskala und manuelle Nachrichten · 09.10.2026

Die Barteam-Seite unter `/bar-display` zeigt ausschließlich große Getränkenamen und tatsächlich gültige Preise. Sie ist über den Admin-Link „Barteam-Preise“ erreichbar. Bestehende Preise bleiben während bestätigter Gäste-Einspieler sichtbar; alle neuen Kurse erscheinen gemeinsam bei Veröffentlichung. Bei fehlender Verbindung, veralteten Paketen oder überschrittenem Preisstand werden Beträge ausgeblendet und ein Wartehinweis gezeigt. Die Seite nutzt denselben öffentlichen Echtzeitkanal wie die Gäste, ohne Vorschauen oder Steuerbefehle.

Die Gästecharts skalieren vertikal auf das sichtbare Tief/Hoch, jeweils mit 10 % Rand. Konstante Kurse erhalten eine endliche, zentrierte Skala. Die Beschriftung nennt das tatsächliche Hoch/Tief der Historie. Ein Average außerhalb der sichtbaren Skala wird als Richtungsannotation gezeigt, nicht als falsch positionierte Linie. Gleiche Referenzwerte werden zusammengefasst; der seitliche Platz wird anhand der tatsächlichen Textbreite berechnet, damit auch „Tief / Avg“ vollständig lesbar bleibt. Glatte hellgraue Kurven und die gespeicherte Starthistorie bleiben erhalten.

Nachrichtensortierung ist aus Oberfläche und Live-API entfernt: keine Pfeile, kein Ziehen, kein Reorder-Befehl oder Reorder-Helfer. Der gespeicherte Nachrichtenkatalog und erledigte Meldungen bleiben erhalten; jede offene Meldung kann direkt manuell ausgelöst werden.

## Prüfung

- TypeScript und Produktionsbuild erfolgreich.
- Alle 194 Logik-/Servertests erfolgreich.
- Vollständiger Lauf mit 83 Edge-Browsertests erfolgreich; nach der Korrektur des gemessenen Beschriftungsrands zusätzlich 19 betroffene Browsertests erfolgreich.
- Neue Prüfungen belegen sofortige Preisveröffentlichung im Barteam-Display, gültige Altpreise während Einspielern, Sofortkorrekturen, kostenloses Wasser, Smartphone-Layout und Verstecken/Wiederherstellen bei stiller Verbindung.
- Der entfernte API-Befehl wird mit 400 abgewiesen und verändert weder offene noch erledigte Nachrichten. Manuelle Auslösung funktioniert weiterhin.
- Chartprüfung belegt die sichtbare Range 1,80–1,90 € trotz erlaubter Biergrenze 5,00 € und vollständig lesbare Beschriftungen bei 1440/1280 Pixeln.
- Unabhängige Codeprüfung ohne offene Befunde. Gefundene abgeschnittene kombinierte Beschriftung behoben und durch einen Bounding-Box-Test abgesichert.

## Lokaler Betrieb

Die komplette ursprüngliche Marktdatei wurde gesichert als `data/market.json.before-bar-display-1791572828157.bak`. Der Server wurde mit dem neuen Build neu gestartet; Preise, Vorschauen, Overrides, echte und simulierte Historie, Nachrichtenschedule, Katalog, Termine und Ansicht wurden unverändert verglichen. Eine Simulation bleibt beim Neustart entsprechend dem bestehenden Wiederanlaufverhalten pausiert.

Der lesende Check auf localhost:3000 bestätigte 20 Barteam-Preise, keine Charts/Bedienelemente auf dieser Seite, automatische Skala und ausschließlich Auslösebuttons für offene Schlagzeilen. Die komplette Marktdatei blieb während des Checks unverändert.
