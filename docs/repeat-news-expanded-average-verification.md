# Wiederholbare Breaking News und erweiterter Average-Regler

Stand: 16.10.2026.

Breaking News bleiben in derselben Liste sichtbar und lassen sich nach der Veröffentlichung erneut auslösen. Die Vorschau zeigt immer die nächste tatsächliche Wirkung; verwendete Meldungen bekommen „Erneut auslösen“. Ein laufender Einspieler bleibt gegen parallele Starts geschützt. Am Min-/Max-Preis bleibt eine Meldung ohne weitere Bewegung gesperrt. Je Nachricht wird der letzte Veröffentlichungszeitpunkt gespeichert; es entstehen keine doppelten Queue-Einträge. Ein neuer Einspieler derselben Nachricht erhält frische Video-/Textanzeige.

Der globale Average-Regler erlaubt ganze Werte von −90 bis +1000 %. Wirksamer Average = Standard-Average × (1 + Regler / 100). Min und Max skalieren mit demselben Faktor; Preisgrenzen werden auf die gültigen Preisstufen gerundet. Wasser bleibt 0 €. Bier bei +1000 %: Average 24,20 €, Min 12,10 €, Max 60,50 €. Bei −90 %: Average 0,22 €, Min 0,10 €, Max 0,60 €.

Die Standardwerte werden nicht verändert; Zurückstellen auf 0 % kehrt zur ursprünglichen Basis zurück. Aktuelle Verkaufspreise, Historie und laufende Übergänge bleiben erhalten. Künftige Vorschauen, Specials, Crash-/Erholungspreise, manuelle Preise, Preisverteilung und Gästereferenzen verwenden die skalierten Grenzen. Vorgaben außerhalb der neuen Grenzen werden angepasst. Historische Grenzen bleiben zur Validierung früher veröffentlichter Werte gespeichert.

## Verifikation

- 294 Domain-/Servertests in 55 Dateien bestanden.
- 28 lokale Edge-Browserprüfungen bestanden: wiederholte Meldungen nach Neuladen, keine Doppelstarts, beide Regler-Endpunkte, Speicherung, mitskalierende Grenzen, gültige manuelle Preise außerhalb der bisherigen Standardgrenzen sowie Verteilungsvorschau und Wasserpreis.
- `npm run typecheck` und `npm run build`: erfolgreich.
- Bestehende lokale Marktdatei mit der neuen Validierung erfolgreich gelesen; nicht zurückgesetzt oder verändert.
- Render bleibt beendet. Die Änderungen benötigen keinen neuen kostenpflichtigen Hostingdienst.
