# Töne und Fußleiste: Prüfung vom 9. Oktober 2026

Die Gästeansicht verwendet kurze lokal erzeugte WebAudio-Signale für normale Preiswechsel, Veröffentlichungen, Breaking News, Crash, Erholung und neue sichtbare Preiszeilen. Ton muss über einen Klick aktiviert werden; standardmäßig ist er aus. Die Lautstärke beträgt zunächst 25 % und ist einstellbar. Auswahl und Lautstärke werden lokal gespeichert. Wiederholte Snapshots, Neuladen und erneutes Aktivieren spielen alte Ereignisse nicht nach. Laufende Töne werden bei Stummschaltung, Lautstärkeänderung, Reset, Pause oder Verbindungsverlust gestoppt. Während neuer Einblendungen werden verdeckte Preiszeilen nicht mit Pop-Tönen begleitet.

Die unterste Informationsleiste mit Uhr und Legende ist entfernt. Tonsteuerung und Vollbild stehen oben; das Breaking-News-Laufband bleibt erhalten. Die Karten passen ihre Schrift- und Charthöhen an den verfügbaren Platz an, damit auf kurzen Bildschirmen keine Überlappungen entstehen.

## Nachweise

- Typprüfung und Produktionsbuild erfolgreich; 158 Logik-/Servertests bestanden.
- Gesamtlauf mit 68 Edge-Browsertests bestanden. Nach den letzten Ton- und Layoutkorrekturen bestanden sechs gezielte Tests für native Audioaktivierung, Stummschaltung, Karten bei 900/720 Pixel Höhe und bestehende Barpreise.
- Der Audiotest verwendet die native AudioContext-/OscillatorNode-Ausgabe und prüft tatsächliche Tonscheduling-Aufrufe; keine Audiodateien oder externen Dienste werden benötigt.
- Read-only-Codeprüfung abgeschlossen. Ein dabei gefundener Ton für verdeckte Preiszeilen wurde zunächst reproduziert und anschließend unterdrückt.
- Screenshots auf 900/720 Pixel Höhe und am tatsächlichen Server visuell geprüft.
- Unter localhost:3000 sind Fußleiste entfernt und Ton aktivierbar/stummschaltbar; der Marktstand blieb unverändert. Ein Serverneustart war für diese Änderungen nicht nötig.

Lokale Protokolle stehen unter `.artifacts/verification/2026-10-09-sounds-footer/`.
