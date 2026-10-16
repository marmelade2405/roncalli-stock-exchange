# Fixierte Admin-Aktionen und Kategorien

Die fünf Kategorie-Reiter und die kompakte Zeile mit Countdown, Crash auslösen, Einspieler überspringen und Crash abbrechen bilden einen gemeinsamen Sticky-Bereich. Beim Scrollen durch Schlagzeilen, Kurse und Einstellungen bleiben beide Zeilen oben sichtbar. Die globalen Regler und die Tonsteuerung stehen weiterhin oberhalb dieses Bereichs.

## Prüfung

- `npm run build`: erfolgreich.
- Drei lokale Edge-Prüfungen bei 1440 × 900, 390 × 844 und 375 × 667: Aktionsleiste und Kategorien bleiben bei langem Inhalt oben sichtbar; keine horizontale Seitenüberbreite; letzte Nachrichten-Eingabe zwischen Kopf und Speicherleiste erreichbar; Kategorien bleiben bedienbar.
- Sieben bestehende Browserprüfungen aus `average-only-sound.spec.ts` und `event-controls.spec.ts`: erfolgreich, einschließlich Crash-/Skip-Knöpfen, Lautstärke und fixierter Speicherleiste auf Handygröße.
- Screenshots der Desktop- und Handyansicht visuell geprüft.

Nur HTML/CSS geändert. Kein Serverneustart und keine Änderung laufender Marktdaten erforderlich. Admin-Seite neu laden.
