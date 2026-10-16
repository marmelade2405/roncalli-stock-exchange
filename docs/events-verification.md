# Abnahme der Erweiterung · 08.10.2026

Windows, Node.js 24.16.0 und Microsoft Edge. Alle Tests benutzen einen eigenen Markt und eigene Testzugangsdaten. Der echte Markt wurde für die Prüfungen nicht zurückgesetzt.

## Ausgeführte Prüfungen

- Typprüfung und Produktionsbuild: erfolgreich.
- Vor Schlussreview: 122 Logik-/Server-/Clienttests und 42 Browserfälle erfolgreich. Die endgültigen Zahlen nach den Review-Regressionsfällen stehen im folgenden Abschnitt.
- Die zusammenhängende Generalprobe simuliert mindestens fünf Marktstunden, veröffentlicht alle 16 Nachrichten jeweils genau einmal und verbindet zwei Gästeanzeigen.
- Die Generalprobe prüft Umsortieren, vorgezogene Nachricht, Sofortpreis mit erhaltener Normalvorgabe, Crash-Abbruch, Serverneustart während einer Nachricht mit pausierter Wiederaufnahme sowie Abendreset und folgenden echten 20-Minuten-Start.
- 1920×1080: Übersicht, Laufliste, Breaking News, Simulation, Crash und Erholung als Bilder unter `.artifacts/previews/events-*.png` gespeichert und tatsächlich angesehen.
- Admin: 1440×900, 768×1024 und 390×844 geprüft. Breite Preis-/Konfigurationstabellen lassen sich seitlich verschieben; Parameter und Nachrichteneditor passen sich der Breite an.

## Zuordnung zur genehmigten Ereignis-Spezifikation

| Kriterium | Nachweis |
| --- | --- |
| 1. 20-Minuten-Start; Special/Korrektur erhalten Termin | Domain-Markt-, News- und Displaytests; Generalprobe |
| 2. Vorgaben nur in eigener Runde verbrauchen | Domain-, Admin- und beide Abendabläufe |
| 3. Einzelkorrektur mit bestätigter Speicherung/Entwurfsschutz | Admin-Browserfälle und Domainkorrektur |
| 4. Verlauf/Änderungsbasis nur für geänderte Getränke | History- und Markt-Domaintests |
| 5. Zehn Änderungen, elf richtige Zeitpunkte | Charttests und `ten_changes_visible_in_both_modes` |
| 6. Lesbarkeit und Gerätebedienung | Angesehene sechs Gäste- und drei Adminbilder; Fontgröße ≥30 px bei 1080p |
| 7. 16 eindeutige Meldungen, zwei Richtungen je Getränk | Konfiguration/Katalogtests |
| 8–9. Reproduzierbarer verteilter Plan und begrenzte Wirkung | Schedule-/Specialtests einschließlich Zufallsextreme |
| 10. Preisfreie News, ein geänderter Kurs | Display-Browserfall und Domainveröffentlichung |
| 11–12. Reihenfolge/Direktstart, keine verlorenen Meldungen | Controls-Browserfälle, News- und Domaintests |
| 13–14. Crash/Erholung/Abbruch und neuer Timer | Domain-, Controls- und Abendtests |
| 15–16. Gemeinsame Uhr, Pause, Sprung, Wiederanlauf | Clock-, Simulation- und Zwei-Anzeigen-Tests |
| 17. Reset beider Arten, Einstellungen/Laufgrenzen | Domain-, Admin-, Controls-, Display- und Generalprobe |
| 18. Migration/Originalbackup und ungültiger Speicher | Market-Store-Tests |
| 19. Authentifizierung, Herkunft, Revision und öffentliche Daten | HTTP-/WS-/Snapshottests |
| 20. Verspätete Antworten/Nachrichten/Zeitmetadaten | Client-/Admin-/Displayregressionen |
| 21. Offline/Veraltung, reduzierte Bewegung | Displaymodel- und Browserfälle |
| 22. Vollständiger Abend und Betriebsanleitung | `events-evening.spec.ts`, README, Betreiberanleitung |

## Beobachteter Umgebungsfehler

Im OneDrive-Arbeitsordner schlug ein atomarer Dateiersatz sporadisch mit Windows `EPERM` fehl. Der Fehler wurde anschließend auch im unabhängigen Migrationstest mit dem konkreten Dateisystemfehler beobachtet. Kurze Sperren (`EPERM`, `EBUSY`, `EACCES`) werden nun höchstens fünfmal über insgesamt 620 ms erneut versucht. Das alte Ziel bleibt bis zum erfolgreichen Ersetzen erhalten; permanente andere Fehler werden sofort gemeldet und temporäre Dateien bereinigt. Zwei Regressionstests prüfen beide Garantien, der Wiederholungsfall wurde vor der Korrektur rot beobachtet.

## Produktionscheck

Der kompilierte Server läuft mit der vorhandenen lokalen `.env` auf Port 3000. `/health`, `/admin`, `/display` und `/api/state` liefern HTTP 200; `/__test/advance` liefert HTTP 404. Der bestehende reale Markt blieb im Livebetrieb mit acht Getränken erhalten. Die Tests haben seine Preise, Einstellungen und Zugangsdaten nicht verändert.

## Unabhängige Schlussprüfung

Ein frischer `gpt-6-astra`-Reviewer prüfte den Gesamtbranch `dc702c8..e8b052b` lesend, einschließlich aller fünf Prüfschwerpunkte des Plans. Zwei bestätigte wichtige Befunde und ein auf wichtig hochgestufter Darstellungsbefund wurden in genau einem Durchgang korrigiert:

- Ein exakt passender Special-Termin wurde von Planung und Auslösung unterschiedlich behandelt. In einer 120×-Simulation führte das zu einem ungültigen gespeicherten Uhrzustand und blockierten Folgekommandos. `exact_fit_special_boundary_keeps_simulation_durable_and_resettable` reproduziert den natürlich erzeugten Termin bei RNG `5/14`, prüft jeden Speicherzustand, vollständige Einblendung und danach einen erfolgreichen Reset.
- Ein beschädigter innerer Verlaufspunkt mit `price: null` wurde als zulässige leere Preisvorgabe behandelt. `interior_null_history_is_rejected_without_overwriting_original` prüft jetzt die Ablehnung und bytegleiche Erhaltung der beschädigten Datei. Verlaufspunkte benötigen ausdrücklich ganze Centwerte.
- Frei bearbeitete Meldungen identifizierten das betroffene Getränk nicht zuverlässig. Die Einblendung zeigt jetzt dessen aktuellen Namen separat. `generic_news_identifies_the_renamed_affected_drink` prüft einen generischen Text mit umbenanntem Getränk.

Alle drei Regressionen wurden vor der Korrektur rot beobachtet. Danach bestanden sämtliche **124 Logik-/Server-/Clienttests und 43 Browserfälle** einschließlich der vollständigen Generalprobe; Typprüfung und Produktionsbuild bestanden ebenfalls. Die aktualisierte Breaking-News-Einblendung mit separatem Getränkenamen wurde auf 1920×1080 erneut angesehen. Es gab keine zweite Reviewrunde.

Ein kleiner Befund bleibt offen: Die Admin-Queue zeigt geplante Minuten seit Marktstart und „verschoben“, aber keinen laufenden Countdown bzw. wirksamen absoluten Zeitpunkt. Reihenfolge, Direktstart und Preisvorschau funktionieren.

Der Reviewer stellte die Geschwindigkeitswahl während einer bereits laufenden Simulation als mehrdeutig zurück. Entscheidung: Tempo wird in der Vorbereitung gewählt; während des Laufs bleiben Pause/Fortsetzen und Ereignissprung verfügbar. Eine Tempoänderung benötigt einen Neustart der Generalprobe. Dies entspricht der beschriebenen Vorbereitung und der sichtbaren Bedienung.
