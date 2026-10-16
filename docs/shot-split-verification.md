# Einzelne Shot-Sorten · 09.10.2026

Der Sammelposten „Shots“ wurde durch Berentzen, Pfeffi, Tequila, Jägermeister, Ouzo, Rum und Erdbeerlimes ersetzt. Jede Sorte hat einen eigenen Kurs, Zufallsvorschlag, Verlauf und zwei manuell auslösbare Nachrichten. Rum bleibt unabhängig von Rum Cola. Die Standardliste enthält 20 Getränke einschließlich Wasser und 38 Specials; elf Meldungen beziehen sich auf Roncalli.

Die Sorten übernehmen zunächst die bisherigen Shot-Parameter: 0,40–3,00 €, Average und Startpreis 1,00 €. Die Übersicht verwendet bei 20 Getränken fünf Spalten und vier Zeilen.

## Prüfung

- TypeScript und Produktionsbuild erfolgreich.
- 160 Logiktests und 70 Edge-Browsertests erfolgreich.
- Unabhängige Shot-Preise und einzelne Special-Wirkungen geprüft; Ouzo-News verändert keine anderen Shot-Kurse.
- Darstellung aller 20 Getränke bei 1920 × 1080 visuell geprüft. Bestehende Tests decken auch kurze Bildschirme, Laufliste, Simulation, Crash, News und gestaffelte Einblendung ab.
- Unabhängige Codeprüfung ohne offene Befunde. Gespeicherte Märkte in Vorbereitung, normaler Runde, Crash und verschiedenen Übergängen einschließlich alter Shot-Specials validiert.

## Übernahme des lokalen Markts

Vor dem Schreiben wurde die vollständige bisherige Marktdatei gesichert: `data/market.json.before-shot-split-1791551606545.bak`. Die explizite Übernahme mit `splitShotMarket` erhält alle übrigen Kurse und deren Verläufe, Termine, Gästeansicht und bereits verbrauchten Meldungen. Alte Shot-Vorgaben werden auf die sieben Sorten übertragen, ihre Zufallsvorschauen getrennt neu berechnet. Neue Sorten starten ihren eigenen tatsächlichen Verlauf beim übernommenen aktuellen Shot-Kurs; der alte Sammelverlauf bleibt in der Sicherung.

Ein bereits verbrauchtes altes Shot-Special wird auf Berentzen (steigend) bzw. Pfeffi (fallend) übertragen. Ein laufender alter Shot-Special-Übergang veröffentlicht seine eingefrorene Wirkung nur für die entsprechende Sorte. Die Übernahme wird nicht automatisch bei jedem Serverstart ausgeführt und ist bei bereits aufgeteilter Liste wirkungslos.

Der lokale Server wurde mit dem neuen Build auf Port 3000 gestartet. Der anschließende lesende Admin-/Gästecheck bestätigte 20 Getränke, 38 Meldungen, fünf weiterhin erledigte und 33 offene Specials. Die bestehende Simulation bleibt nach dem Neustart pausiert und kann unter „Steuerung“ fortgesetzt werden. Zugangsdaten wurden nicht verändert.
