# Entscheidungen und offener Komfortpunkt

Die genehmigte Erweiterung ist auf Branch `codex/market-events` lokal erhalten. Prüfbericht: [events-verification.md](events-verification.md). Vollständige Prüfprotokolle und Ausführungsledger liegen lokal unter `.artifacts/verification/events-2026-10-08/`; Zugangsdaten und reale Marktdaten sind dort nicht enthalten.

Entscheidungen in Ausführungsreihenfolge:

1. Wegen des bereits bestätigten Windows-Eigentümerfehlers beim Worktree wurde der bestehende Projektordner mit einem eigenen Featurebranch benutzt. Folge bei falscher Annahme: unversionierte Dateien sind nicht räumlich isoliert; `prompt.txt` blieb unangetastet.
2. PowerShell/Node führten die Aufgabenbuchhaltung statt der auf diesen Windows-Pfaden fehlgeschlagenen POSIX-Helfer. Folge: Commitbereiche und Abschlüsse wurden explizit geprüft.
3. Kompatible Aufrufe mit bisherigen Getränke-/Zeitargumenten bleiben erlaubt; ältere Konfigurationsbefehle können neue Felder aus bestehenden Einstellungen ableiten. Folge: diese zusätzliche Schnittstelle muss weiter geprüft werden.
4. Erfolgreiche Controller-Ticks liefern nach fünf Sekunden ebenfalls Zustandsnachrichten, zusätzlich zum nativen WebSocket-Heartbeat. Folge: gelegentlich zusätzliche identische Nachrichten; keine zusätzliche Preisrunde.
5. Nach tatsächlich beobachtetem OneDrive-`EPERM` werden kurze Sperren beim atomaren Ersetzen begrenzt erneut versucht. Folge: ein dauerhaft blockierter Dateiersatz kann seine Fehlermeldung bis zu 620 ms später liefern.
6. Nur eindeutig über PID/Startzeit identifizierte eigene Serverprozesse wurden beendet, nachdem PTY-Strg+C wirkungslos blieb und PowerShell `Stop-Process` intern scheiterte. Gespeicherte Marktdaten blieben erhalten. Folge: eine noch unbestätigte Eingabe während des Serverwechsels könnte erneut nötig sein.
7. Ursprünglich wurde Simulationstempo nur vor dem Start gewählt. Diese Entscheidung wurde am 09.10.2026 durch die ausdrückliche Nutzeranweisung ersetzt: ein jederzeit bedienbarer Regler von 1× bis 120×, auch im laufenden oder pausierten Versuch und während eines Crashs. Einblendungen behalten 1×; Zeit, Preise und Pause bleiben beim Wechsel erhalten.

Der Schlussreview stufte einen fehlenden expliziten Getränkenamen in bearbeiteten Nachrichten als klein ein. Er wurde wegen der Auswirkungen auf die Gäste auf wichtig hochgestuft und mit den beiden bestätigten wichtigen Befunden in einem einzigen RED→GREEN-Durchgang behoben. Es wurde kein zweiter Reviewer beauftragt.

Zurückgestellt bleibt genau ein kleiner Befund: Queue-Einträge zeigen geplante Minuten seit Start und eine Verschiebungsmarkierung; ein eigener laufender Countdown bzw. wirksamer absoluter Zeitpunkt pro Special fehlt. Geplante Reihenfolge, erwartete Preise, Direktstart und einmaliger Verbrauch funktionieren.
