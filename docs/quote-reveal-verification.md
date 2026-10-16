# Preiseinblendung: Prüfung vom 9. Oktober 2026

Die Preisschilder zeigen nur einen größeren Getränkenamen. Rote bzw. grüne Blinkpunkte stehen über den Preisen, nicht im Chart. Die SVG-Diagramme berechnen ihre Geometrie in der tatsächlichen Pixelgröße und verwenden ein unverzerrtes Seitenverhältnis. ResizeObserver aktualisieren die Geometrie bei Größenänderungen und werden beim Neuaufbau getrennt.

Der Verlauf verwendet standardmäßig 15 Datenpunkte einschließlich Ausgangspunkt; Demo-Punkte ergänzen fehlende echte Änderungen mit stärkeren, begrenzten Schwankungen. Wasser bleibt 0 €. Nach normaler Runde, Crash und Erholung erscheinen Kurse und Charts im einstellbaren Abstand von standardmäßig 0,5 Sekunden. Euro- und Prozentwerte werden animiert. Der Server speichert einen echten Veröffentlichungszeitstempel, sodass zwei Anzeigen und Neuladen denselben Ablauf verwenden. Specials und Sofortkorrekturen zeigen nur ihren betroffenen Kurs direkt. Mehrere Korrekturen unterbrechen die Sequenz der anderen Getränke nicht.

Neue, mit Runden-/Crashdauer unvereinbare Abstände werden beim Speichern abgewiesen. Alte Konfigurationen ohne diesen Parameter bleiben gültig und verwenden nötigenfalls einen kürzeren Abstand. Beschleunigte Simulationen zeigen die mehrteilige Einblendung bei 1× und kehren anschließend zum gewählten Tempo zurück; der Live-Timer bleibt unverändert. „Zum nächsten Ereignis“ kann die Präsentation bewusst überspringen.

Der News-Lauftext ist größer. Eine grüne Markt-LED kennzeichnet frische, gültige Live-Kurse.

## Nachweise

- Typprüfung und Produktionsbuild erfolgreich.
- 154 Logik-/Servertests und 67 Edge-Browsertests bestanden.
- Geprüft: halbe Sekunden als Parameter, zwei synchronisierte Anzeigen, Neuladen während der Sequenz, mehrere Sofortkorrekturen, 15 Punkte, unverzerrte Charts, größere Schrift, grüne Markt-LED, Simulationstempo und Legacy-Konfigurationen.
- Read-only-Codeprüfung abgeschlossen. Zwei dabei gefundene Randfälle wurden zunächst reproduziert und korrigiert: Sofortkorrekturen bleiben auf ihr Getränk beschränkt; die Sequenz muss vor dem nächsten Wechsel fertig sein. Beide Korrekturen wurden unabhängig bestätigt.
- Screenshots von Übersicht, Laufliste und News-Laufband visuell geprüft.
- Tatsächlicher Server unter Port 3000 geprüft; Abstand 0,5 Sekunden und Gesamtanzahl 15 bestätigt.

Marktstand und Datei wurden vor der Übernahme gesichert. Preise, Vorgaben, Verlauf, Timer und Nachrichtenreihenfolge wurden erhalten. Die laufende Simulation wurde entsprechend dem bestehenden Neustartverhalten pausiert. Protokolle liegen in `.artifacts/verification/2026-10-09-quote-reveal/`. Die vorübergehend wegen eines Nutzungslimits ausgefallene automatische Freigabeprüfung war vor den abschließenden Prüfungen und der Übernahme wieder verfügbar.
