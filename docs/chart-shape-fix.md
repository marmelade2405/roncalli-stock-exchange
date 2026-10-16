# Chartzacken korrigiert · 09.10.2026

Die Zeitachse hatte simulierte Crashs zehn Sekunden nach normalen Runden neben 20-Minuten-Abständen nahezu auf dieselbe horizontale Position gelegt. In einem 90-Pixel-Verlauf lagen zwei betroffene Punkte bei x=71,52 und x=72,12. Dadurch entstanden nadelförmige Spitzen.

Die letzten Preisstände erhalten jetzt gleiche horizontale Abstände. Kubische Segmente mit null Tangente an Wendepunkten und harmonisch gemittelten Tangenten bei fortgesetzter Richtung runden die Verbindung ab. Die Steuerpunkte bleiben innerhalb der jeweiligen Endpreise; die Kurve erzeugt keine zusätzlichen Extremwerte. Alle tatsächlichen Preisstände werden weiterhin getroffen. Tatsächliche Zeitpunkte bleiben in der Diagrammbeschreibung erhalten; Daten, Preise und gespeicherte Historie wurden nicht geändert.

TypeScript und Produktionsbuild erfolgreich. Alle 192 Logik-/Servertests und neun betroffene Edge-Browsertests erfolgreich. Regressionen prüfen ungleiche Crash-/Normalintervalle, Steuerpunktgrenzen, unveränderte Eingaben sowie flache und einzelne Preise. Unabhängige Codeprüfung ohne offene Befunde. Der lesende Check auf localhost:3000 bestätigte die aktualisierten Linien und eine unveränderte vollständige Marktdatei; Backendneustart war nicht erforderlich.
