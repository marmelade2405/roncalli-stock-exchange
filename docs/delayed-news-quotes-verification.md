# Verzögerte Kursankündigung — 2026-10-12

Der Breaking-News-Einspieler zeigt keine Getränkedaten. Erst im anschließenden Nachrichtenfenster erscheinen Getränkename nach 600 ms, Änderung nach 1.200 ms und neuer Preis nach 1.800 ms, jeweils mit einer 400-ms-Einblendung. Bei sehr kurzen Nachrichtenfenstern werden diese Zeiten proportional verkürzt. Die Ankündigung bleibt bis zur bisherigen Preisfreigabe sichtbar; Preise, Gesamtdauer und Ton bleiben unverändert.

Die Nachricht hält den Platz für die Ankündigung bereits vor deren Erscheinen frei. Die Textanpassung berücksichtigt den Wechsel zwischen Video und Nachrichtenlayout. Pause und reduzierte Bewegung werden berücksichtigt. Auch die transparente Videoschlussfläche zeigt noch keine Getränkedaten; alte Datenpakete ohne Kursankündigung verwenden die bisherige Meldungsansicht.

Verifikation: TypeScript und Produktionsbuild erfolgreich, 236 Unit-Tests und 11 betroffene Browserfälle bestanden. Nach der letzten Anpassung des schmalen Layouts wurden die drei Kursankündigungsfälle erneut erfolgreich geprüft. Verzögerung, Pause, Preisfreigabe, fehlende Kursdaten und schmale Darstellung sind abgedeckt. Die unabhängige Prüfung ergab keine offenen Befunde.

Screenshots: `.artifacts/previews/news-quote-announcement.png` und `.artifacts/previews/news-quote-announcement-narrow.png`. Die laufende Anwendung liefert das neue Display-Bundle aus. Kein Serverneustart, keine Zustandsänderung und kein ausgelöstes Live-Special waren erforderlich.
