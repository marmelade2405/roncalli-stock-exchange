# Passende Kategorienüberschrift und Werkseinstellungen · 12.10.2026

Die kategorisierte Laufliste bemisst alle Überschriften anhand von „Wein · Longdrinks · Bier“. Die lange Überschrift füllt die verfügbare Textbreite mit einem kleinen Rand. Die gleiche Schriftgröße gilt für Shots und Alkoholfrei. Die Berechnung reagiert auf veränderte Spaltenbreiten; der Überschriftenbereich wächst in der Höhe mit. Getränkenamen sind etwas größer, mit Umbruch und Anpassung an die Kartenhöhe.

Werkseinstellungen wählen jetzt automatisch die Laufliste. Der zurückgesetzte Markt bleibt in Vorbereitung mit sichtbaren Startpreisen; die Laufliste bewegt sich bereits. „Abend neu starten“ behält weiterhin die ausgewählte Ansicht.

TypeScript und Produktionsbuild erfolgreich, 209 Unit-Tests in 44 Dateien erfolgreich. Zwölf betroffene Browsertests erfolgreich, darunter die tatsächliche Gäste-Laufliste nach Werkseinstellungen; der finale Typografie-/Spaltentest wurde nach der Feinjustierung erneut erfolgreich ausgeführt. Die lokale Prüfung bei 1920, 1280 und 1000 Pixel Breite bestätigte eine Überschriftenbreite von mindestens 97 % des verfügbaren Textbereichs ohne Überlauf.

Lokaler Server aktualisiert; Sicherung `data/market.json.before-heading-fit-1791810703515.bak`. Zum Übernahmezeitpunkt war der reale Markt bereits zurückgesetzt und zeigte noch die Übersicht. Die Laufliste wurde dort ausgewählt, ohne erneut zurückzusetzen. Preise, Vorschauen, Vorgaben, Historien, Specials und Timer blieben erhalten. Screenshot: `.artifacts/previews/full-width-category-heading-live.png`.
