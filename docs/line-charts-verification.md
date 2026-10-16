# Liniencharts · 09.10.2026

Übersicht und Laufliste verbinden die historischen Preise wieder als Linien. Die große adaptive Charthöhe, Min-/Average-/Max-Referenzen, 15 Datenpunkte und die gespeicherte Parameter-Simulation mit fünf Crashs bleiben erhalten. Tatsächliche Zeitabstände bestimmen die horizontale Anordnung; bei identischen Zeitstempeln werden die Punkte verteilt. Einzelne und konstante Preise bleiben als waagerechte Linie sichtbar.

- TypeScript und Produktionsbuild erfolgreich.
- Alle 189 Logik-/Servertests erfolgreich; überholte Balkengeometrie-Tests entfernt.
- 13 betroffene Edge-Browsertests erfolgreich: Linien in beiden Ansichten, Historie/Synchronität, große Charts, kurze Bildschirme und bestehende Steuerung.
- Gezielte Sichtprüfung von Übersicht und eingelaufener Zwei-Spalten-Laufliste erfolgreich.
- Unabhängige Codeprüfung ohne offene Befunde.
- Der lesende Check auf localhost:3000 bestätigte 20 Liniencharts und keine Balken. Die komplette Marktdatei blieb identisch; Backendneustart und Marktübernahme waren nicht erforderlich.
