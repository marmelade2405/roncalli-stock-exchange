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
- Barteam: [http://localhost:3000/bar-display](http://localhost:3000/bar-display)

Die Steuerung benötigt das Passwort aus `.env`. Bei Verwendung anderer Geräte `localhost` durch die lokale IPv4-Adresse des Serverrechners ersetzen, beispielsweise `http://192.168.1.20:3000/admin`. Alle Geräte müssen den Server im Netzwerk erreichen können.

## Ablauf

Vor dem Start Getränke, Startpreise, Grenzen und Schwankungen anpassen. Die beiden getrennten Tabellen zeigen gespeicherte Zufallsvorschläge für normale Runde und nächsten Crash. Manuelle Vorgaben beim Verlassen des Felds speichern; „Gespeichert“ bestätigt die Übernahme.

Der Markt startet mit den Startpreisen und einem 20-Minuten-Timer. Normale Runden verwenden die gespeicherten Vorschläge beziehungsweise einmalige manuelle Vorgaben. Die Gäste sehen in den letzten zehn Sekunden eine preisfreie Wechselanimation. Übersicht und Laufliste unterstützen Linien und zwei Balkenvarianten. Zum Start erzeugt die echte Preisberechnung eine gespeicherte Vorgeschichte mit fünf Crashs und passenden Erholungen. Simulierte Verläufe ergänzen den aktuellen Ausgangspreis. Echte Änderungen ersetzen sie schrittweise. Wasser bleibt flach bei 0 €.

Ein manuell ausgelöster Crash unterbricht den normalen Timer. Nach zehn Sekunden Animation gelten die Crashpreise fünf Minuten. Der gemeinsame Abwärtstrend wird mit der Crashvorschau zwischen standardmäßig 5 und 15 Prozent ausgewählt. Dazu kommen Zufallsausschläge mit standardmäßig doppelter normaler Breite und häufigeren Kursspitzen. Preisgrenzen begrenzen Ausschläge; der Prozentwert ist ein Trend, keine garantierte Änderung jedes Getränks. Manuelle Crashvorgaben ersetzen den jeweiligen Zufallspreis. Anschließend erscheinen gespeicherte Erholungspreise mit demselben Prozentsatz nach oben; danach läuft ein neuer vollständiger 20-Minuten-Timer. „Crash abbrechen“ leitet die Erholung vorzeitig ein; während der Einleitung beendet es den Crash ohne Veröffentlichung. Vorgaben werden erst nach ihrer jeweiligen Verwendung geleert.

38 satirische Breaking News werden ausschließlich manuell von den Admins ausgelöst. Elf Meldungen beziehen sich auf Roncalli; zwei EZB-Meldungen betreffen Berentzen bzw. Pfeffi. Berentzen, Pfeffi, Tequila, Jägermeister, Ouzo, Rum und Erdbeerlimes haben jeweils eigene Preise, Grenzen und zwei eigene Nachrichten. Die Admin-Queue zeigt die verfügbaren Meldungen und den tatsächlichen erwarteten Preis einschließlich Rundung/Preisgrenzen. Die gewünschte Meldung auswählen; „Jetzt auslösen“ startet die ausgewählte Meldung einmal. Benes RageCage-Special setzt Bier immer auf genau 1,50 €, auch von einem günstigeren Preis aus. Alle Specials ohne Festpreis setzen das Getränk in die obersten bzw. untersten 10 % seiner Min-/Max-Preisspanne. Die Preisstufen werden nach innen gerundet; Admin-Vorschau und veröffentlichter Kurs stimmen überein. Breaking News verwenden keinen Prozent-Grundimpuls mehr. Der automatische Euro-Zielkurs liegt direkt am passenden Rand des Extrembereichs; bereits stärkere Extreme bleiben erhalten. Unter Einstellungen kann stattdessen ein fester „Zielpreis €“ gesetzt werden. Heshams Besuch treibt Wein beispielsweise bei 1,70–6,00 € in den oberen Bereich ab 5,60 €. Nach einem fünfsekündigen Einspieler bleibt die Meldung 15 Sekunden groß stehen; währenddessen sind alle Preise verborgen. Danach erscheint der neue Getränkekurs, das Getränk wird hervorgehoben und die Meldung läuft unten im Nachrichtenband bis zum nächsten Special oder einer Preisrunde weiter. Der normale Timer bleibt bestehen. „Jetzt setzen“ in der aktuellen Preiszelle korrigiert einen einzelnen Kurs sofort und lässt die nächste manuelle Vorgabe bestehen.

Die Admin-Oberfläche hat fünf Reiter: Steuerung, Kurse, Crash, Breaking News und Einstellungen. Der gewählte Block bleibt beim Neuladen ausgewählt; Eingaben bleiben beim Wechsel erhalten. Marktstatus, Countdown und Marktaktionen stehen über den Reitern. Alle Zeiten, Trends, Preisgrenzen, Schwankungen und Nachrichtentexte sind vor dem Start einstellbar. Mit der Simulation lässt sich derselbe Markt vor dem Abend proben, pausieren und zum nächsten Ereignis springen. Die Simulation startet standardmäßig bei 1×. Der Geschwindigkeitsregler erlaubt jederzeit ganze Werte von 1× bis 500×, auch während des Laufs, bei Pause, Crash oder Einblendung. Zeit und Preise springen dabei nicht; eine Pause bleibt erhalten und Einblendungen laufen weiterhin mit 1×. Danach „Abend neu starten“ wählen: Einstellungen bleiben, Preise/Verlauf/Vorgaben/Ereignisse werden zurückgesetzt und der Markt ist wieder im Livebetrieb bereit. „Werkseinstellungen“ setzt zusätzlich die Konfiguration zurück und wählt automatisch die Laufliste.

Die Darstellungswahl „Übersicht“ oder „Laufliste“ gilt für beide Gästebildschirme. Im selben Admin-Bereich „Gästeansicht“ bietet „Chartdarstellung“ drei Möglichkeiten: hellgraue Linie, rot/grüne Balken ohne Abstand und rot/grüne Balken mit kleinen Lücken. Die Auswahl gilt sofort für beide Anzeigen; Balken mit Abstand sind der neue Standard. Die Auswahl wird gespeichert und bleibt beim Neustart eines Abends erhalten; Werkseinstellungen wählen Balken mit Abstand. „Vollbild“ in der Gästeansicht blendet die Browserumgebung aus. Bei duplizierten physischen Bildschirmen reicht ein Browserfenster; zwei Anzeigecomputer öffnen dieselbe Gästeadresse.

Die Laufliste zeigt auf breiten Bildschirmen standardmäßig drei Spalten (wahlweise zwei) mit einzelnen Getränkeblöcken und bewegt sich standardmäßig alle drei Sekunden um einen Block weiter. Der Regler neben „Laufliste“ ändert das Tempo jederzeit zwischen 1 und 4 Sekunden pro Block für beide Anzeigen. „Laufliste: Spalten“ wählt zwei oder drei Spalten, sofort und gespeichert für beide Displays. Alle Charts nutzen gleich breite Flächen und denselben Platz für Referenzbeschriftungen. Ohne bisherigen echten Vorgängerkurs zeigen Übersicht und Laufliste ausdrücklich 0,00 € und 0,0 %; simulierte Startpunkte zählen dabei nicht als echte Preisänderung. Die drei Spalten gruppieren Wein/Aperitifs, Longdrinks und Bier links, Shots mittig und alkoholfreie Getränke rechts. Die Kategorienüberschriften stehen mittig in dunkelblauen Kästen mit cyanfarbener Schrift und passen ihre Schriftgröße an die Spaltenbreite an; die lange linke Überschrift nutzt nahezu die gesamte Breite. Getränkenamen sind größer und dürfen umbrechen. Auf schmalen Geräten erscheinen alle Getränke in einer Spalte. Beide Ansichten zeigen Liniencharts sowie Blinkpunkte über den Preisen; mit reduzierter Bewegung bleiben die Punkte ruhig. simulierte Verläufe verwenden zusammenhängende Trends. Die News tragen „RONCALLI STOCK MARKET EXCHANGE“ und größere Texte; der Crash-Einspieler zeigt Alarmrahmen, fallende Pfeile und eine einbrechende Kurslinie.

Die Admin-Kennzahlen „Ø nächste Preisänderung“ und „Ø Crash-Preisänderung“ sind der gleichgewichtete Mittelwert der geplanten Prozentänderungen aller Getränke mit einem aktuellen Preis über 0 €. Gespeicherte manuelle Vorgaben fließen ein. „Zieltrend Erholung“ zeigt den konfigurierten Trend und ist kein berechneter Durchschnitt.

[Aktuelle Preisliste und Average-Logik](docs/bar-price-list.md). Wasser bleibt dauerhaft 0 €. Charts skalieren auf Hoch und Tief der sichtbaren Historie; der Average bleibt als Referenz erkennbar.

Unter „Einstellungen“ zeigt „Preisverteilung · normale Runden“ eine Linienvorschau für ein ausgewähltes Getränk. Average, Rückführung, Schwankung, Grenzen, Preisschritt und Startpreis lassen sich direkt über dem Diagramm bearbeiten; die Werte sind mit der Getränketabelle verbunden. Die Vorschau reagiert auf ungespeicherte Entwürfe, ohne den Markt zu ändern. Sie zeigt den tatsächlichen simulierten Mittelwert und die Häufigkeit je Preis. Crashs, Specials und Sofortkorrekturen sind nicht enthalten. Im laufenden Markt bleiben Parameter gesperrt; gespeicherte Verteilungen sind weiterhin auswählbar.

Normale Preisrunden verwenden automatisch unterschiedliche Ausschläge nach oben und unten, abhängig vom Abstand des Average zu Min/Max. Seltene, ausbalancierte Spitzen können beide Preisgrenzen erreichen. Die Schwankungsbasis steuert ihre Häufigkeit; die Rückführung hält den langfristigen Mittelwert ungefähr am Average. Für Bier liegen normale Runden mit den Standardwerten in der großen Simulation gelegentlich bei 5,00 €. Die Vorschau zeigt die neue Verteilung unmittelbar. Die Standard-Schwankungsbasis ist gegenüber dem stärkeren Profil halbiert; die Rückführung zum Average bleibt bei 50 %.

[Aktuelle Crash- und Anzeige-Steuerung](docs/market-controls-guide.md) · [Ausführliche Anleitung für den Abend](docs/operator-guide.md)

Kurze Börsen-Sounds begleiten Preiswechsel, neue Kurse, Breaking News, Crash und Erholung. Im Admin-Reiter „Steuerung“ „Ton aktivieren“ einmal anklicken; der Browser benötigt dafür eine Benutzeraktion. Lautstärke und Stummschaltung werden lokal gemerkt. Die Tonausgabe erfolgt auf dem gewählten Admin-Gerät. Die unterste Informationsleiste ist entfernt; Vollbild bleibt auf der Gästeanzeige oben; Tonsteuerung steht ausschließlich im Admin. Das Breaking-News-Laufband bleibt bestehen.

Die Preisschilder zeigen den Getränkenamen einmal und größer. Das Signalgrün ist kräftig und gesättigt. Grüne bzw. rote Blinkpunkte stehen über den Preisen; die Charts selbst blinken nicht. Die Diagramme verwenden unverzerrte Achsen und Schrift sowie standardmäßig 20 Datenpunkte einschließlich Ausgangspunkt. Die stärker schwankenden simulierte Vorgeschichtspunkte werden weiterhin mit echten Änderungen ersetzt. Wasser bleibt 0 €.

In der Übersicht steht der aktuelle Preis oben rechts neben dem Getränkenamen. Darunter füllt der Chart die verfügbare Kartenhöhe; Euro- und Prozentänderungen stehen größer daneben. Die Laufliste zeigt links den hohen Chart, mittig die Änderung und rechts den Namen mit dem Preis darunter. Auf schmalen Handys ist die Übersicht eine scrollbare Spalte. „Min“ und „Max“ im Chart bezeichnen die konfigurierten Preisgrenzen; „Avg“ bezeichnet den Zielpreis. Ein Pfeil markiert Referenzen außerhalb der automatisch skalierten sichtbaren Historie.

In der Übersicht erscheinen nach normaler Runde, Crash und Erholung Preise und Charts nacheinander. Die Laufliste startet stattdessen leer von unten mit allen neuen Werten gleichzeitig und läuft unabhängig vom Simulationstempo. Der Abstand beträgt standardmäßig 0,5 Sekunden und ist im Admin-Reiter „Einstellungen“ unter „Preis-Einblendung: Abstand“ änderbar. Euro- und Prozentangaben erhalten eine Einblendanimation. Specials und Sofortkorrekturen zeigen ihr einzelnes Getränk direkt; andere Einblendungen laufen weiter. In schnellen Simulationen wird die komplette Sequenz bei 1× gezeigt, bevor die Beschleunigung wieder einsetzt. Der Live-Timer bleibt unverändert. Die News-Laufleiste ist größer, und eine grüne LED hebt den Markt bei gültigen Live-Kursen hervor.

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

Die Barteam-Ansicht zeigt ausschließlich Getränkenamen und aktuelle Preise, gruppiert in Shots, Bier, Longdrinks und Alkoholfrei. Wein, Aperol und Lillet stehen zusätzlich unter „Wein & Aperitifs“; eigene Kategorien bleiben erhalten. Auf breiten Bildschirmen verteilen sich die Gruppen auf zwei Spalten, auf schmalen Geräten stehen sie untereinander. Gültige Kurse bleiben während der Gäste-Einspieler sichtbar und ändern sich gemeinsam bei Veröffentlichung. Bei Verbindungsverlust oder veraltetem Stand werden die Preise ausgeblendet. Im Admin gibt es einen direkten Link. Nachrichtensortierung und Ziehen/Pfeile sind entfernt; alle Meldungen bleiben manuell auslösbar.
