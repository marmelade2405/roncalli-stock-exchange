# Anzeige und Navigation: Prüfung vom 9. Oktober 2026

Die Simulation unterstützt 1× bis 500×. Nachrichten und Preiswechsel laufen weiterhin bei 1×; Pausen und Änderungen des gewählten Tempos bleiben erhalten.

Die Gästecharts ergänzen anfangs zehn gestrichelte Demo-Punkte um den Average innerhalb der Preisgrenzen. Gleicher Marktstand ergibt auf beiden Anzeigen und nach Neuladen denselben Verlauf. Mit jeder echten Änderung fällt der älteste Demo-Punkt weg. Wasser bleibt bei 0 € ohne erfundene Schwankungen. Die Demo bleibt ausschließlich in der Darstellung; gespeicherte Historie, echte Preise und Vorschauen werden nicht verändert.

Die News-Schriftbänder fliegen während der letzten 0,7 Sekunden des Einspielers auseinander. Lichtstreifen und Überblendung geben die Nachricht frei; nach fünf Sekunden steht sie vollständig für die restlichen 15 Sekunden. Bewegung reduzieren verwendet weiterhin statische Szenen. Die Limo-Meldung heißt jetzt „Roncalli-Küchenfonds stoppt die Eiswürfel-Lieferung“.

Fünf Admin-Reiter zeigen jeweils einen Block. Entwürfe bleiben beim Wechsel erhalten; der ausgewählte Reiter wird lokal gemerkt. Marktstatus, Countdown und Start-/Crashaktionen stehen gemeinsam darüber. Ungespeicherte Einstellungen sperren den Marktstart unmittelbar.

## Nachweise

- Typprüfung und Produktionsbuild erfolgreich.
- 148 Logik-/Servertests bestanden, einschließlich Demo-Ersatz, festen Preisen und 500× mit korrekt begrenzter Übergangszeit.
- Gesamtlauf mit 59 Edge-Browsertests bestanden. Anschließend bestanden fünf gezielte Nachtests für die unmittelbare Start-Sperre, erhaltene Entwürfe, Reiter, synchronisierte Demo-Charts und News-Übergang bei 500×.
- Screenshots der Startcharts, News-Überblendung sowie Admin-Reiter auf Laptop und Handy visuell geprüft.
- Read-only-Codeprüfung ohne offene Befunde; unabhängige Prüfung von 896 Demo-Konfigurationen und der Zustandsfolge 500× → News 1× → Pause 0× → Fortsetzen 1× → Veröffentlichung 500×.
- Tatsächlicher Server unter Port 3000 geprüft: Anmeldung, fünf Reiter, Reglermaximum 500, Charts, kostenloses Wasser und umbenannte Meldung.

Der laufende Live-Markt wurde vor der Übernahme gesichert. Preise, Verlauf, Vorgaben, Timer, Reihenfolge und offene/erledigte Meldungen wurden erhalten. Lokale Protokolle liegen unter `.artifacts/verification/2026-10-09-display-navigation/`.
