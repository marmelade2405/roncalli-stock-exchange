# Asymmetrische Normalpreise · 09.10.2026

Normale Runden mit gespeichertem Average erhalten größere gewöhnliche Ausschläge auf der Seite mit mehr Platz zur Preisgrenze. Hinzu kommen seltene vollständige Min-/Max-Spitzen. Die normale Rückführung bleibt erhalten; Crash, Erholung, Specials und feste Wasserpreise verwenden ihre bisherigen Regeln.

## Berechnung

Nach der Rückführung liegt der Mittelpunkt zwischen den erlaubten Grenzen. Gewöhnliche Breiten sind `2 × Schwankungsbasis × Abstand Average–Grenze / gesamte Range`, zusätzlich begrenzt auf den vorhandenen Platz vom Mittelpunkt aus. Der größere Ausschlag ist seltener: Die Chance einer Richtung entspricht der gegenüberliegenden Breite geteilt durch beide Breiten. Die unabhängige zufällige Größe ist gleichverteilt. Damit ist die erwartete gewöhnliche Abweichung null.

Die gemeinsame Spitzenchance ist `25 % × min(1, Schwankungsbasis / max(Preisschritt, kleinerer Average–Grenze-Abstand))`. Die Chance des Maximums ist diese Spitzenchance mal `Abstand Mittelpunkt–Min / Range`; für das Minimum entsprechend der Abstand zum Maximum. Dadurch ist auch die erwartete Spitzenabweichung null.

Normale Kurse mit positiver Rückführung werden auf die benachbarten Preisschritte mit einer Wahrscheinlichkeit proportional zum Restbetrag gerundet. So bleibt der erwartete Preis beim Runden erhalten. Dies verhindert, dass geringe Rückführung durch grobe Rundung verschwindet und ein Extremkurs festhängt. Ohne Rückführung bleibt die gewöhnliche Bewegung eine begrenzte Zufallswanderung; Konfigurationen ohne Average behalten ebenfalls ihre bisherige Berechnung. Die Preview nennt diese Sonderfälle ausdrücklich.

Eine Spitze gilt für die eingestellte normale Preisrunde; es gibt keinen zusätzlichen kurzen Sondertimer. Eine folgende normale Runde zieht den Kurs wieder zum Average. Das Maximum ist zufällig erreichbar, nicht für jeden einzelnen Abend garantiert.

## Nachweise

- TypeScript und Produktionsbuild erfolgreich; alle 176 Logik-/Servertests erfolgreich.
- Alle 73 Browsertests vor der abschließenden Rundungskorrektur erfolgreich. Nach dieser Korrektur neun betroffene Browserprüfungen erneut erfolgreich, einschließlich Verteilung, Preisparameter, vollständigem Abend und Shot-Special.
- Neue Regressionen prüfen schwache Rückführung mit Schwankung kleiner als der Preisschritt, grobe Rundung, beide Extrempreise, asymmetrische gewöhnliche Bewegungen, alle kostenpflichtigen Standardgetränke, Nullschwankung, fehlende Rückführung und Zufallswertvalidierung.
- Unabhängige Codeprüfung abgeschlossen. Befund zum Festhängen am Maximum durch Rundung behoben und durch Regressionen abgesichert; anschließend keine offenen Befunde.
- Fünf Millionen normale Bier-Runden: Mittelwert 1,7999809 €, Maximum 5,00 € in 3,20184 %, Minimum 1,10 € in 14,64564 % der Runden.

## Lokale Übernahme

Der vollständige alte Marktstand wurde vor dem Schreiben als `data/market.json.before-asymmetric-prices-1791555017027.bak` gesichert. Nur die normale Zufallsvorschau wurde für die neue Logik neu erzeugt und die Revision erhöht. Aktuelle Preise, frühere Preise, Vorgaben, Verlauf, News-Warteschlange, Termine, Gästeansicht und Marktuhr wurden unverändert verglichen. Ein festgeschriebener normaler Übergang wird nicht neu gewürfelt.

Der lokale Server wurde mit dem neuen Build neu gestartet. Der lesende Check bestätigte die neue Linienvorschau, Biermittelwert 1,80 € und Wasser 0,00 €. Die Marktdatei war vor und nach dem Check identisch.
