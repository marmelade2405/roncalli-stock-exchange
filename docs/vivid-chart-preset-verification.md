# Dritte Chartdarstellung und lebendiger Standardsatz · 12.10.2026

Im Admin ersetzt „Chartdarstellung“ den Balken-Schalter und bietet Linie, Balken ohne Abstand sowie Balken mit Abstand. Kleine Lücken sind auf drei Pixel bzw. 18 % der jeweiligen Balkenspalte begrenzt, sodass kleine Charts lesbar bleiben. Die Auswahl wird gespeichert, gilt für beide Gästeansichten und verändert keine Kurse oder Timer.

Der Standardverlauf enthält 20 Datenpunkte einschließlich des aktuellen Ausgangspunkts. Die simulierte Vorgeschichte verwendet weiterhin fünf Crashs mit Erholungen und die echte Preisberechnung. Echte Kursänderungen ersetzen simulierte Punkte schrittweise.

Die Standardschwankungsbasis ist verdoppelt, die Rückführung zum Average von 75 % auf 50 % gesenkt. Preisgrenzen, Zielpreise und Wasser bei 0 € bleiben unverändert. Beispiel Bier: Basis 1,00 €; gewöhnliche Breiten am Zielpreis ungefähr −0,36 € / +1,64 €. In 200.000 normalen Runden steigt die Standardabweichung von etwa 0,68 € auf 0,92 €; der simulierte Mittelwert liegt bei 1,79 € gegenüber dem Ziel 1,80 €. Rund 4,4 % der Runden erreichen 5,00 €. Einzelne Abende einschließlich Specials haben weiterhin keinen garantierten exakten Mittelwert.

TypeScript und Produktionsbuild erfolgreich. Gesamte Unit-Suite: 202 Tests in 42 Dateien erfolgreich. 19 betroffene Browser-Testfälle geprüft, darunter drei Modi auf zwei Anzeigen, sichtbare Balkenlücken, gespeicherte Auswahl, 20 Punkte, Ersatz durch echte Historie sowie Verteilungs- und Adminparameter. Zwei Erwartungen an den früheren Standardsatz wurden aktualisiert; der anschließende Nachlauf der sieben zugehörigen Testfälle war erfolgreich.

Die Übernahme in den bestehenden lokalen Markt sichert die ursprüngliche Datei, aktualisiert passende Standardwerte und die Punktzahl und simuliert die Starthistorie neu. Aktuelle Kurse, echte Historie, Vorgaben, laufende Übergänge, Timer, Specials und Darstellungswahl bleiben erhalten. Bereits abweichende Schwankungswerte bleiben bestehen. Die nächste normale Vorschau wird mit dem neuen Profil berechnet, sofern gerade kein Übergang läuft.

Lokale Übernahme abgeschlossen. Sicherung: `data/market.json.before-vivid-preset-1791802022587.bak`. Alle 19 kostenpflichtigen Getränke verwendeten den bisherigen Standardsatz und wurden angepasst. Die anschließende Browser- und Dateiprüfung bestätigte die drei Optionen, 20 Punkte, erhaltene reale Preise/Verläufe/Vorgaben/Timer und Bier-Basis 1,00 € bei 50 % Rückführung. Die zuvor laufende Simulation wurde nach dem Serverneustart fortgesetzt. Unabhängiger Code-Review ohne offene Befunde.
