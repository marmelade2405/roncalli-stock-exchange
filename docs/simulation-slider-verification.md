# Geschwindigkeitsregler · 09.10.2026

Nutzerauftrag: Geschwindigkeit jederzeit mit einem verschiebbaren Balken ändern. Der Admin erhält einen zugänglichen Range-Regler von 1× bis 120× in ganzen Schritten. Das zuletzt gewählte Tempo bleibt nach einem Neustart erhalten; die Simulation wird wie bisher beim Wiederanlauf pausiert.

Ein Tempowechsel verankert die Uhr neu am unveränderten aktuellen Marktzeitpunkt. Preise, Timer, Veröffentlichungen und eine bestehende Pause bleiben erhalten. In preisfreien Einblendungen gilt weiterhin 1×; nach deren Ende wird das neu gewählte Tempo aktiv. Die Moduswahl zwischen Livebetrieb und Generalprobe bleibt in der Vorbereitung.

Schnelle Eingaben werden zusammengefasst: Während eine Speicherung läuft, bleibt der zuletzt eingestellte Reglerwert sichtbar und wird anschließend übernommen. Antworten aus einem zurückgesetzten Lauf können die neue Reglerbedienung nicht verändern.

Vor der Umsetzung rot beobachtet:

- `simulation_tempo_changes_live_paused_crash_and_transition_without_time_jump`: beliebiges Tempo wurde vom HTTP-Vertrag abgewiesen.
- `arbitrary_simulation_speed_survives_storage`: Speicherung abweichender Geschwindigkeiten wurde abgewiesen.
- `arbitrary_slider_rate_projects_market_time`: Browseruhr akzeptierte nur vier Raten.
- `speed_slider_is_editable_while_running_and_paused`: Regler fehlte.

Nach Umsetzung: alle vier Fälle erfolgreich; Typprüfung und Build erfolgreich. Gesamte Logik-/Server-/Client-Suite: 127 Tests erfolgreich. Vollständiger Browserlauf: 44 Fälle erfolgreich einschließlich Fünf-Stunden-Generalprobe. Die Controls-Browserdatei enthält 10 erfolgreiche Fälle, einschließlich Bedienung mit Home/End/Pfeiltasten und mehrfacher schneller Eingaben. Produktionsserver auf Port 3000 mit bestehendem Marktstand neu gestartet.

Die anschließend freigegebene Chart-/Preisliste-/Average-Anpassung ist in [bar-chart-verification.md](bar-chart-verification.md) dokumentiert.
