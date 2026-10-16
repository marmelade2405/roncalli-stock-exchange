# Originaltöne, 25-Sekunden-News und Crash-Texte — 2026-10-12

Es spielen nur noch die Originaltöne der beiden vom Nutzer ausgewählten Intro-Videos. Synthetische Töne bei Aktivierung, normalen Preisrunden, Kurs-Pops, Veröffentlichung und Erholung sind entfernt. Das nicht mehr benötigte Sound-Event-Modul und seine fünf bisherigen Tests wurden entfernt. Originalton, Lautstärke, Stummschaltung, Pause/Resume und Abbruch bleiben erhalten.

Breaking News dauern standardmäßig 25 Sekunden: zehn Sekunden Einspieler und fünfzehn Sekunden Nachricht. In der laufenden Konfiguration wurde der bisherige Standard von 30 auf 25 Sekunden übernommen.

Beim Crash fliegen Kennzeichnung, Überschrift und Beschreibung gestaffelt mit kurzen Slide-, Schärfe- und Federbewegungen ein. Die Szene blendet in den letzten 0,9 Sekunden weich aus, bevor die neuen Preise freigegeben werden. Die Animation verwendet die Marktzeit und hält bei Simulationspause an. Reduzierte Bewegung verzichtet auf Transformationen. Countdown, Abbruch und Überspringen bleiben bedienbar; normale Preisrunden und Erholung setzen die Szenen-Deckkraft wieder auf 1.

Verifikation: TypeScript und Build erfolgreich, alle 219 verbleibenden Unit-Tests bestanden. Sechs Audio-Browserfälle und acht Crash-/Steuerungsfälle bestanden. Neue Regressionen wurden zunächst gegen das vorherige Verhalten geprüft: Aktivierung erzeugte drei zusätzliche Töne; Crashtexte erschienen gleichzeitig. Die neuen Tests bestätigen stille Aktivierung, keine zusätzlichen Töne während Preisrunden/Erholung, gestaffelte Caption-Einblendung und Fade vor der Preisfreigabe. Unabhängige Prüfung ohne offene Befunde.

Die laufende Anwendung wurde aktualisiert und auf 25 Sekunden Gesamtdauer, zehn Sekunden Intro und stille Tonaktivierung geprüft. Preise, Historie, Vorschauen, Overrides, Queue und vorbereitete Preise blieben erhalten; die zuvor laufende Simulation wurde fortgesetzt. Backup: `data/market.json.before-sounds-duration-1791822990157.bak`.
