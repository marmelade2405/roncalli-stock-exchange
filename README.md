# Stock Market Exchange

Die Getränkebörse für euren Barabend: eine separate Steueroberfläche und zwei synchronisierte Gästeanzeigen im Börsenstil.

## Lokal starten

Benötigt werden Node.js 24 oder neuer und ein aktueller Browser. Node läuft auf einem zentralen Rechner; die anderen Geräte benötigen nur den Browser.

Im Projektordner in PowerShell:

```powershell
npm.cmd ci
```

Bei der Ersteinrichtung `.env.example` nach `.env` kopieren, sofern noch keine `.env` vorhanden ist. `ADMIN_PASSWORD` mit mindestens acht Zeichen und `SESSION_SECRET` mit mindestens 32 zufälligen Zeichen ausfüllen. Die `.env` bleibt lokal und wird nicht in Git gespeichert.

```powershell
npm.cmd run build
npm.cmd start
```

- Steuerung: [http://localhost:3000/admin](http://localhost:3000/admin)
- Gäste: [http://localhost:3000/display](http://localhost:3000/display)

Die Steuerung benötigt das Passwort aus `.env`. Bei Verwendung anderer Geräte `localhost` durch die lokale IPv4-Adresse des Serverrechners ersetzen, beispielsweise `http://192.168.1.20:3000/admin`. Alle Geräte müssen den Server im Netzwerk erreichen können.

## Ablauf

Vor dem Start Getränke, Startpreise, Grenzen und Schwankungen anpassen. Die beiden getrennten Tabellen zeigen gespeicherte Zufallsvorschläge für normale Runde und nächsten Crash. Manuelle Vorgaben beim Verlassen des Felds speichern; „Gespeichert“ bestätigt die Übernahme.

Der Markt startet mit den Startpreisen und einem 30-Minuten-Timer. Normale Runden verwenden die gespeicherten Vorschläge beziehungsweise einmalige manuelle Vorgaben. Die Gäste sehen in den letzten zehn Sekunden eine preisfreie Wechselanimation.

Ein manuell ausgelöster Crash unterbricht den normalen Timer. Nach zehn Sekunden Animation gelten die Crashpreise fünf Minuten. Sie werden mit doppelter Schwankungsbreite und −10 Prozent Tendenz berechnet, sofern keine manuellen Crashpreise vorgegeben sind. Anschließend werden neue Erholungspreise mit +10 Prozent Tendenz berechnet; danach läuft ein neuer vollständiger 30-Minuten-Timer. Vorgaben werden erst nach ihrer jeweiligen Verwendung geleert.

Die Darstellungswahl „Übersicht“ oder „Laufliste“ gilt für beide Gästebildschirme. „Vollbild“ in der Gästeansicht blendet die Browserumgebung aus. Bei duplizierten physischen Bildschirmen reicht ein Browserfenster; zwei Anzeigecomputer öffnen dieselbe Gästeadresse.

[Ausführliche Anleitung für den Abend](docs/operator-guide.md)

## Speicherung und Wiederanlauf

Der Marktstand liegt in `data/market.json`. Preise, Vorschauen, Vorgaben und Zeitpunkte bleiben nach einem Neustart erhalten. Eine verpasste Runde wird einmal nachgeholt; die Anwendung erzeugt keine Kette rückwirkender Zufallsrunden. Der Servercomputer muss während des Abends eingeschaltet bleiben.

Für eine neue Probe im Vorbereitungsmodus den Server beenden und die bisherige Marktdatei als Sicherung umbenennen. Ohne `data/market.json` legt die Anwendung einen neuen Markt mit Dummywerten an. Angepasste Getränkeparameter sind in der bisherigen Datei gesichert und müssen im neuen Markt erneut eingetragen werden.

## Prüfungen

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Auf Windows nutzen die Browsertests den installierten Microsoft Edge. Auf anderen Systemen den Playwright-Chromiumbrowser mit `npx playwright install chromium` installieren. Der Testserver läuft ausschließlich lokal auf den Ports 4173 und 4174 und verwendet einen eigenen Testmarkt; eure reale Marktdatei und `.env` werden nicht verwendet.

## Internetbetrieb

Der Server kann auch auf einem Internetserver laufen. Dafür werden HTTPS mit WebSocket-Weiterleitung, ein beschreibbarer dauerhafter Speicherort für die Marktdatei sowie dieselben Umgebungsvariablen benötigt. `PUBLIC_ORIGIN` auf die vollständige HTTPS-Adresse ohne abschließenden Schrägstrich setzen. Der Backendprozess lauscht standardmäßig auf Port 3000. Pro Marktdatei genau eine Serverinstanz betreiben. Eine externe Veröffentlichung ist nicht Bestandteil der lokalen Einrichtung.
