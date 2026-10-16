# Fallende News behalten günstigere Preise — 2026-10-12

Fallende Breaking News mit einem festen Zielpreis können den aktuellen Getränkepreis nicht erhöhen. Ist der aktuelle Preis bereits niedriger als der Zielpreis, bleibt er unverändert; Vorschau und Ankündigung zeigen eine Änderung von null. Benes Bier-Special senkt beispielsweise 1,80 € auf 1,50 €, behält aber 1,10 € bei. Fallende News ohne Festpreis hatten diesen Schutz bereits.

Die Prüfung des konfigurierten Zielpreises auf Grenzen und Rundung bleibt erhalten. Veröffentlichung und einmaliger Verbrauch der Meldung finden weiterhin statt. Unveränderte Getränkepreise erzeugen keine zusätzlichen Historienpunkte. Andere Getränke und vorbereitete Preisrunden werden nicht verändert.

Verifikation: Der Regressionstest scheiterte zunächst am bisherigen Anstieg von 1,10 € auf 1,50 €. Nach der Änderung bestanden alle 236 Tests, TypeScript, Produktionsbuild sowie sechs Browserfälle für manuelle Meldungen und Kursankündigung. Die Browserprüfung umfasst Admin-Vorschau, zwei Gästeanzeigen, unveränderte Kursankündigung und Wiederherstellung nach Neustart. Die vollständigen Tests wurden nach temporären Dateizugriffsfehlern der Sandbox außerhalb der Sandbox erfolgreich wiederholt.

Der lokale Server wurde mit gesichertem Zustand aktualisiert. Preise, Historien, Vorschauen, Overrides, Zeitplan, Phase und Einstellungen wurden nach dem Neustart verglichen und blieben erhalten. Die zuvor laufende Simulation wurde fortgesetzt. Kein Live-Special wurde ausgelöst.
