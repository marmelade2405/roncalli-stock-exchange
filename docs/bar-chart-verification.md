# Preislisten- und Chartprüfung · 09.10.2026

Der Nutzer hat den kurzen Entwurf am 09.10.2026 freigegeben: höhere Charts links vom Preis, Min/Average/Max, Average als Zielpreis normaler Runden, Wasser dauerhaft gratis und neue Preisliste mit 26 preisändernden Specials.

Vor Umsetzung rot: fünf Preislisten-/Average-/Wasserfälle und die feste Chartskala. Der Browserfall für höhere Charts schlug mit einer gemessenen Höhe von 40 statt mindestens 80 Pixeln fehl.

Nach Umsetzung:

- Typprüfung und Produktionsbuild erfolgreich.
- 134 Logik-/Server-/Clienttests bestanden.
- 47 Browserfälle bestanden, einschließlich bestehender Regressionen, Simulationsregler und neuem fünfstündigem Ablauf mit allen 26 Specials.
- Die neue Liste ist separat von der historischen Acht-Getränke-Regression getestet. Historische Fixtures bleiben ausdrücklich als Kompatibilitätsfälle erhalten.
- Je Getränk 5.000 deterministische normale Runden geprüft: alle Kurse innerhalb der gelieferten Grenzen, beobachteter Durchschnitt weniger als drei Cent vom Zielpreis entfernt.
- Wasser blieb während der Generalprobe immer 0 €, mit einem einzigen Startpunkt im Verlauf.
- Übersicht und Laufliste mit 14 Getränken bei 1920×1080 als Bilder gespeichert und tatsächlich angesehen. Charts sind 96 Pixel hoch und stehen links vom Preis. Graue Min/Max- und goldene Average-Linien verwenden dieselbe Skala wie die echte Kurve.

Ein frischer Reviewer prüfte den abgeschlossenen Umbau lesend. Zwei wichtige Befunde wurden in einem Korrekturdurchgang reproduziert und behoben:

- `historical_schema_two_fixed_price_with_specials_loads_unchanged`: ältere Schema-2-Festpreise mit ihren damals zulässigen zwei Meldungen bleiben unverändert lesbar. Neue geschützte Gratiswasser-Konfigurationen haben weiterhin keine Specials.
- `admin_can_restore_variable_price_after_setting_equal_bounds`: beim Zurückwechseln auf variable Grenzen erzeugt der Editor fehlende Nachrichtenpaare, sodass die Konfiguration wieder gespeichert werden kann.

Beide Fälle wurden vor der Korrektur rot beobachtet. Danach bestehen 135 Logik-/Server-/Clienttests und der vollständige Lauf mit 48 Browserfällen; Typprüfung und Build ebenfalls erfolgreich. Keine separaten kleineren Reviewbefunde. Die bewusst unterstützte Entfernung/Neuanlage von Katalogeinträgen wurde als bestehende Adminfunktion beibehalten.

Protokolle liegen unter `.artifacts/verification/2026-10-09-chart-prices/`.

Der bisherige lokale Marktstand wurde vor der Übernahme unverändert als `market.json.before-bar-list-2026-10-09T07-10-24.313Z.json` neben der Marktdatei gesichert. Danach wurden die bestätigte Preisliste und der neue Nachrichtensatz übernommen; allgemeine Parameter und Gästeansicht blieben erhalten. Der kompilierte Server wurde neu gestartet. Öffentlicher Zustand und authentifizierte Adminantwort bestätigen 14 Getränke, 26 Specials, Wasser 0 € und Phase Vorbereitung. Das vorhandene Admin-Passwort funktioniert weiterhin; die Prüfsitzung wurde abgemeldet.
