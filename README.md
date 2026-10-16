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

Der Markt startet mit den Startpreisen und einem 20-Minuten-Timer. Normale Runden verwenden die gespeicherten Vorschläge beziehungsweise einmalige manuelle Vorgaben. Die Gäste sehen in den letzten zehn Sekunden eine preisfreie Wechselanimation. Übersicht und Laufliste zeigen die letzten zehn tatsächlichen Änderungen je Getränk als zeitbezogenen Verlauf.

Ein manuell ausgelöster Crash unterbricht den normalen Timer. Nach zehn Sekunden Animation gelten die Crashpreise fünf Minuten. Sie werden mit doppelter Schwankungsbreite und −10 Prozent Tendenz berechnet, sofern keine manuellen Crashpreise vorgegeben sind. Anschließend erscheinen gespeicherte Erholungspreise mit +10 Prozent Tendenz; danach läuft ein neuer vollständiger 20-Minuten-Timer. „Crash abbrechen“ leitet die Erholung vorzeitig ein; während der Einleitung beendet es den Crash ohne Veröffentlichung. Vorgaben werden erst nach ihrer jeweiligen Verwendung geleert.

26 satirische Breaking News sind zufällig über den fünfstündigen Abend verteilt: je kostenpflichtigem Getränk einmal steigende und einmal fallende Kurse. Die Admin-Queue zeigt Zeitpunkt und tatsächlichen erwarteten Preis einschließlich Rundung/Preisgrenzen. Pfeile oder Ziehen ändern die Reihenfolge, „Jetzt auslösen“ zieht eine Meldung vor. Die Einblendung verbirgt alle Preise; anschließend verändert sich nur das betreffende Getränk. Der normale Timer bleibt bestehen. „Jetzt setzen“ in der aktuellen Preiszelle korrigiert einen einzelnen Kurs sofort und lässt die nächste manuelle Vorgabe bestehen.

Alle Zeiten, Trends, Preisgrenzen, Schwankungen und Nachrichtentexte sind vor dem Start einstellbar. Mit der Simulation lässt sich derselbe Markt vor dem Abend proben, pausieren und zum nächsten Ereignis springen. Der Geschwindigkeitsregler erlaubt jederzeit ganze Werte von 1× bis 120×, auch während des Laufs, bei Pause, Crash oder Einblendung. Zeit und Preise springen dabei nicht; eine Pause bleibt erhalten und Einblendungen laufen weiterhin mit 1×. Danach „Abend neu starten“ wählen: Einstellungen bleiben, Preise/Verlauf/Vorgaben/Ereignisse werden zurückgesetzt und der Markt ist wieder im Livebetrieb bereit. „Werkseinstellungen“ setzt zusätzlich die Konfiguration zurück.

Die Darstellungswahl „Übersicht“ oder „Laufliste“ gilt für beide Gästebildschirme. „Vollbild“ in der Gästeansicht blendet die Browserumgebung aus. Bei duplizierten physischen Bildschirmen reicht ein Browserfenster; zwei Anzeigecomputer öffnen dieselbe Gästeadresse.

[Aktuelle Preisliste und Average-Logik](docs/bar-price-list.md). Wasser bleibt dauerhaft 0 €. Charts zeigen Minimum, Average und Maximum links vom aktuellen Kurs.

[Ausführliche Anleitung für den Abend](docs/operator-guide.md)

## Speicherung und Wiederanlauf

Der Marktstand liegt in `data/market.json`. Preise, Vorschauen, Vorgaben und Zeitpunkte bleiben nach einem Neustart erhalten. Eine verpasste Runde wird einmal nachgeholt; die Anwendung erzeugt keine Kette rückwirkender Zufallsrunden. Der Servercomputer muss während des Abends eingeschaltet bleiben.

Bei einem Neustart wird eine Simulation am gespeicherten Stand pausiert. Der Livebetrieb holt höchstens einen abgelaufenen Übergang nach. Alte Marktdateien im Schema 1 werden automatisch migriert; eine unveränderte Sicherung entsteht als `data/market.json.v1-backup` (gegebenenfalls nummeriert). Für neue Abende oder Proben die Reset-Aktionen in der Admin-Oberfläche verwenden.

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
