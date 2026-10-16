# Crash und Anzeige · Prüfprotokoll 09.10.2026

Umgesetzt: Gleichungen in der Admin-Verteilung, konfigurierbare gemeinsame Crash-Range 5–15 % mit gleicher positiver Erholung, Meldungstexte mit konkretem Prozentsatz und ohne Schlusspunkt, authentifizierter Simulation-Countdown-Sprung, Gäste-Titel Roncalli Stock Exchange, rote/grüne Änderungsbalken, Live-Lauflistenregler, feste Speicherleiste, Ton ausschließlich im Admin und Entfernung der sichtbaren Chart-Zählzeile.

## Nachweise

- TypeScript und Produktionsbuild erfolgreich.
- Alle 187 Logik-/Servertests erfolgreich.
- Alle 77 Edge-Browsertests im abschließenden Gesamtlauf erfolgreich.
- Neue Domainprüfungen belegen inklusive Crash-Grenzen, Speicherung des Prozentsatzes, identische Erholung nach Neuladen, Overrides, Legacy-Fallback, einmaliges Überspringen mit erhaltener Pause, Live-/News-Sperre, unveränderte Preise/Vorschauen beim Tempowechsel und zeitbezogene Balkengeometrie.
- HTTP-Prüfung bestätigt: Sitzungsauskunft enthält nur den Anmeldestatus, unangemeldete Änderungsbefehle bleiben 401, Live-Sprung bleibt gesperrt und ungültiges Tempo wird abgewiesen.
- Browserprüfungen belegen synchronen Crash/Erholung mit 13 %, beide Countdown-Klicks, Formel, Live-Regler, Entwurfsspeicherung, reine Admin-Tonausgabe und mobile Speicherleiste ohne verdeckte letzte Eingabe.
- Sichtprüfung: 1920×1080 Gästeanzeige und Admin, 390×844 letzte News-Eingabe mit fester Speicherleiste, unverzerrte rote/grüne Balken und keine sichtbare Demo-/Änderungszählzeile.
- Unabhängige Codeprüfung ohne offene Befunde. Gefundene Fälle zum stale Lauflistentempo, falschen Legacy-Crash-Metadaten und pauschalem Statusprozentsatz behoben und durch Regressionen abgesichert. Die mobile Leiste berücksichtigt Scroll-Abstände.

## Lokale Übernahme

Die alte Marktdatei wurde vollständig als `data/market.json.before-event-controls-1791557072133.bak` gesichert. Die Parameter erhielten die Range 5–15 %, die zukünftige Crashvorschau einen gespeicherten Draw (hier 7 %) und die Revision wurde erhöht. Aktuelle Preise, manuelle Vorgaben, beide Verläufe, Nachrichtenschedule, Timer, eingefrorene Übergänge, normale und Erholungsvorschau, Gästeansicht und Marktuhr wurden unverändert verglichen.

Der lokale Server wurde auf Port 3000 mit dem neuen Build gestartet. Der lesende Check bestätigte Titel, Änderungsbalken, fehlende Gäste-Tonsteuerung und Chart-Zählzeile, Admin-Gleichung, feste Speicherleiste und Crash-Range. Die komplette Marktdatei war vor und nach diesem Check identisch. Zugangsdaten wurden nicht geändert.

[Bedienung der neuen Funktionen](market-controls-guide.md).
