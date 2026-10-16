# Manuelle Roncalli-News: Prüfung vom 9. Oktober 2026

Alle Breaking News werden ausschließlich durch Admin-Befehle gestartet. Normale Preisrunden und Crash/Erholung bleiben zeitgesteuert; Simulation und Ereignissprünge starten keine Nachrichten. Alte gespeicherte Special-Zeitpunkte werden weiterhin eingelesen, aber nicht ausgeführt.

Die 26 Meldungen enthalten acht Roncalli-Insider und zwei EZB-Shot-Meldungen. Bene setzt Bier exakt auf 1,50 €, auch von einem niedrigeren Kurs aus. Hesham verwendet +50 % für Wein. Festpreise sind vor dem Marktstart bearbeitbar und werden auf Grenzen und Rundungsschritt geprüft. Einmalige Verwendung, Reihenfolge, manuelle Vorschauen sowie der 5+15-Sekunden-Einspieler mit anschließendem Laufband bleiben erhalten.

## Prüfung

- Typprüfung und Produktionsbuild erfolgreich.
- 144 Logik-/Servertests bestanden, einschließlich alter gespeicherter Zeitpunkte, manueller Simulation, Fixpreis 1,50 €, Wein +50 %, ungültiger Festpreise und Richtung nach Verlaufskürzung/Neuladen.
- 56 Edge-Browsertests bestanden. Eine fünfstündige Simulation ließ alle 26 Nachrichten unangetastet. Die manuelle Auslösung änderte auf beiden Anzeigen Bier von 1,10 € auf 1,50 €, Wein auf 4,50 € und Shots entsprechend den beiden EZB-Specials. Festpreis-Einstellungen, Einmalverbrauch, Neustart, Reset, Nachrichtenphasen und bestehende Bedienung wurden geprüft.
- Read-only-Codeprüfung abgeschlossen. Ein kleiner Richtungsfehler bei gekürztem Verlauf wurde zunächst reproduziert und durch die Speicherung der Veröffentlichungsrichtung behoben; alte abgeschlossene Slots ohne dieses optionale Feld bleiben kompatibel.
- Lokaler Server neu gestartet; Anmeldung, manueller Modus, 26 Meldungen, Roncalli-Texte, Bene-Zielpreis und Hesham-Wirkung in der tatsächlichen Oberfläche bestätigt. Admin-Screenshot visuell geprüft.

Vor der Übernahme entstand eine Sicherung der Marktdatei. Preise, Vorschauen, Vorgaben, Verlauf, offene/erledigte Nachrichten und Reihenfolge wurden erhalten. Der Markt bleibt in Vorbereitung. Protokolle liegen lokal in `.artifacts/verification/2026-10-09-roncalli-manual-news/`.
