# Stock Market Exchange – Designspezifikation

Datum: 07.10.2026  
Status: Schriftliche Spezifikation vom Nutzer am 08.10.2026 bestätigt.  
Ziel: Eine Getränkebörse für einen Barabend mit separater Steueroberfläche und zwei synchronen Gästebildschirmen.

## 1. Ziel und bestätigte Anforderungen

Die Anwendung zeigt wechselnde Getränkepreise im Börsenstil. Das Barteam bedient eine Steueroberfläche auf einem separaten Gerät, beispielsweise Tablet, Handy oder Laptop. Die beiden Gästebildschirme zeigen denselben Markt, dieselben Preise, denselben Countdown und dieselbe Darstellungsart.

Die Anwendung unterstützt Betrieb im lokalen Netzwerk und alternativ über einen zentralen Server im Internet. Eine installierte App auf den Bedien- und Anzeigegeräten ist nicht erforderlich; diese öffnen die jeweilige Browseransicht.

Bestätigt sind:

- Normale Preisänderungen im Abstand von 30 Minuten, ohne Bindung an volle oder halbe Uhrzeiten.
- Vorab sichtbare, gespeicherte Zufallsvorschläge für die nächste Preisrunde.
- Optionale manuelle Preise je Getränk; leere Felder verwenden die gespeicherten Zufallsvorschläge.
- Normale manuelle Eingaben gelten für genau die nächste normale Preisrunde und werden anschließend geleert.
- Separate manuelle Crashpreise gelten für genau den nächsten manuell ausgelösten Crashstart und werden anschließend geleert.
- Ein Crash dauert fünf Minuten. Beim Start entstehen Preise mit doppelter Schwankungsstärke und einer durchschnittlichen Abwärtstendenz von 10 Prozent.
- Nach dem Crash werden neue Preise mit einer durchschnittlichen Aufwärtstendenz von 10 Prozent gegenüber den Crashpreisen berechnet. Frühere Preise werden nicht wiederhergestellt.
- Nach der Erholungsrunde beginnt ein neuer vollständiger 30-Minuten-Timer.
- Während eines Crashs gibt es keine zusätzliche normale Preisrunde.
- Ein Countdown kündigt die nächste Preisänderung an.
- In den letzten zehn Sekunden vor einer Preisänderung verdeckt eine Börsenanimation sämtliche Preise auf den Gästebildschirmen.
- Beide Gästevarianten sind verfügbar: Gesamtübersicht und kontinuierlich von unten nach oben laufende Getränkeliste.
- Die sichtbare Preisänderung bezieht sich auf den zuletzt tatsächlich angezeigten Preis.

## 2. Betriebsmodell und Architektur

Eine zentrale Serverinstanz verwaltet den vollständigen Markt. Browser berechnen weder eigene Verkaufspreise noch eigene Preisrunden. Damit gibt es auch bei mehreren geöffneten Steuer- oder Gästeansichten einen verbindlichen Preisstand.

Die Komponenten haben folgende Aufgaben:

| Komponente | Verantwortung |
|---|---|
| Preislogik | Zufallspreise, Grenzen, Rundung, manuelle Vorgaben und Preisveränderungen |
| Marktsteuerung | Zustandswechsel, Timer, Crashstart, Erholung und Übergangsanimation |
| Speicherung | Verbindlicher Marktstand, Zeitpunkte, Vorschauen, Eingaben und Preisverlauf |
| Server und Echtzeitkanal | Berechtigungen, Bedienaktionen und Verteilung des vollständigen Zustands |
| Steueroberfläche | Einstellungen, Vorschauen, manuelle Vorgaben und Crashauslösung |
| Gästeansicht | Gemeinsamer Countdown, Preise, Veränderungen und Animationen |

Vorgesehene technische Grundlage ist ein kleiner Node.js-Server mit TypeScript und einem Browserfrontend aus HTML, CSS und TypeScript. Änderungen werden über einen WebSocket-Kanal verteilt. Die Preislogik bleibt unabhängig von Netzwerk und Darstellung prüfbar.

Der Markt wird in einer lokalen JSON-Datei auf dem Server gespeichert. Schreibvorgänge werden nacheinander ausgeführt und durch Schreiben in eine temporäre Datei mit anschließender Ersetzung abgesichert. Es gibt für diesen Barabend genau eine schreibende Serverinstanz.

### Netzwerkvarianten

- **Lokales Netzwerk:** Der Server läuft auf einem Rechner vor Ort. Steuergerät und Anzeigecomputer verbinden sich über WLAN oder LAN mit diesem Rechner. Die Steuerung kann auf einem anderen Gerät als dem Server laufen. Internet ist für diesen Betrieb nicht erforderlich.
- **Internet:** Derselbe Anwendungsaufbau läuft auf einem erreichbaren Server. Dieser muss eine dauerhaft laufende Serveranwendung und WebSocket-Verbindungen unterstützen. Die Browser verbinden sich über HTTPS beziehungsweise WSS.

Die Wahl des konkreten Internetanbieters und eine Veröffentlichung sind ein späterer Betriebsschritt. Der lokale Betrieb ist die erste vorgesehene Betriebsart; die Architektur ermöglicht auch den Onlinebetrieb.

### Rollen

- `/admin`: geschützte Steueroberfläche mit Schreibzugriff.
- `/display`: Gästeansicht mit ausschließlich lesendem Zugriff.

Die Steueroberfläche wird mit einem konfigurierten Passwort geschützt. Das Passwort wird nicht in der Gästeansicht oder im Projektquelltext hinterlegt. Schreibaktionen müssen serverseitig authentifiziert und geprüft werden. Für Onlinebetrieb wird HTTPS vorausgesetzt.

## 3. Marktstart, Timer und Zustände

Vor dem Marktstart können Getränke und Dummywerte angepasst werden. Die Gästeansicht zeigt die Startpreise und den Status „Markt öffnet bald“. Ein Countdown beginnt erst, wenn das Barteam den Markt startet.

Beim Marktstart bleiben die konfigurierten Startpreise sichtbar. Die erste normale Runde wird für 30 Minuten später angesetzt; ihre Zufallsvorschläge liegen sofort vor.

| Zustand | Gästeansicht | Nächster Wechsel |
|---|---|---|
| Vorbereitung | Startpreise und Öffnungshinweis | Manueller Marktstart |
| Normalbetrieb | Aktuelle Preise und Countdown | Normale Runde nach 30 Minuten oder manuell eingeleiteter Crash |
| Wechselanimation | Börsenanimation; sämtliche Preise verborgen | Veröffentlichung der bereits feststehenden nächsten Preise |
| Crash | Crashpreise, Crashhinweis und Countdown bis zur Erholung | Erholungsrunde fünf Minuten nach Veröffentlichung der Crashpreise |

Jeder automatische Preiswechsel besitzt einen serverseitig festgelegten Veröffentlichungszeitpunkt. Zehn Sekunden davor beginnt die Wechselanimation. Der Countdown läuft in dieser Phase bis null weiter; mit Ablauf erscheinen die neuen Preise gleichzeitig.

### Normale Runde

1. Zehn Sekunden vor dem Termin werden die wirksamen Preise der kommenden Runde festgeschrieben; weitere Änderungen an dieser Runde sind gesperrt.
2. Die Gästeansicht verbirgt Preise und Preisveränderungen und zeigt die Wechselanimation.
3. Zum Termin veröffentlicht der Server die zuvor festgeschriebenen Preise.
4. Normale manuelle Vorgaben werden geleert.
5. Neue Vorschauen werden erzeugt; ein neuer Timer läuft für 30 Minuten ab Veröffentlichung.

### Crashstart

1. Der Startknopf ist nur im Normalbetrieb außerhalb einer laufenden Wechselanimation verfügbar. Parallele Crashes werden nicht zugelassen.
2. Das Barteam löst den Crash aus. Der Server schreibt die wirksamen Crashpreise fest und verwirft den bisherigen Termin der normalen Runde.
3. Die Gästeansicht zeigt zehn Sekunden lang die Crash-Einleitungsanimation ohne alte oder neue Preise.
4. Danach werden die Crashpreise veröffentlicht. Erst jetzt beginnen die fünf Crashminuten.
5. Die verwendeten manuellen Crashvorgaben werden geleert. Normale manuelle Vorgaben bleiben für die nächste normale Runde erhalten.
6. Der Server berechnet und speichert sofort die Vorschau der Erholungsrunde.

### Crashende und Erholung

1. Zehn Sekunden vor Ablauf der fünf Crashminuten beginnt die Erholungsanimation. Die Crashpreise werden vollständig verborgen.
2. Exakt fünf Minuten nach Veröffentlichung der Crashpreise erscheint die gespeicherte Erholungsrunde.
3. Die Erholung verwendet eine positive Tendenz von 10 Prozent und die normale Schwankungsbreite.
4. Es werden neue Vorschauen für die nächste normale Runde und den nächsten Crash erzeugt.
5. Ein neuer vollständiger 30-Minuten-Timer startet ab Veröffentlichung der Erholungspreise.

Die fünf Crashminuten schließen die letzten zehn Sekunden der Erholungsanimation ein. Der Countdown beschreibt stets die verbleibende Zeit bis zur nächsten Veröffentlichung.

### Verbindliches Zeitbeispiel

| Zeitpunkt | Vorgang |
|---|---|
| 20:27:50 | Crashknopf betätigt; zehn Sekunden Animation beginnen |
| 20:28:00 | Crashpreise veröffentlicht; fünfminütiger Timer startet |
| 20:32:50 | Erholungsanimation beginnt; alle Gästepreise verborgen |
| 20:33:00 | Erholungspreise veröffentlicht; neuer 30-Minuten-Timer startet |
| 21:02:50 | Animation für die normale Runde beginnt |
| 21:03:00 | Normale Preise veröffentlicht; neuer 30-Minuten-Timer startet |

Um 20:30 findet in diesem Beispiel keine zusätzliche Preisrunde statt.

## 4. Preisberechnung

Geldwerte werden intern in ganzen Cent verwaltet. Die Standardrundung beträgt 10 Cent. Startpreise, Grenzen und manuelle Vorgaben müssen zur eingestellten Rundung passen.

Je Getränk werden Startpreis, Mindestpreis, Höchstpreis und normale Schwankungsbreite konfiguriert. Die Schwankungsbreite ist der maximale zufällige Abstand vom jeweiligen Zielwert.

| Preisrunde | Zielwert der Berechnung | Zufällige Abweichung |
|---|---|---|
| Normal | Zuletzt gültiger Preis | Normale Schwankungsbreite in beide Richtungen |
| Crashstart | 90 Prozent des zuletzt gültigen Preises | Doppelte normale Schwankungsbreite in beide Richtungen |
| Erholung | 110 Prozent des gültigen Crashpreises | Normale Schwankungsbreite in beide Richtungen |

Für Zufallspreise wird eine gleichmäßig verteilte Abweichung gewählt, das Ergebnis auf die eingestellte Preisschrittweite gerundet und auf die Getränkepreisgrenzen begrenzt. Das fertige Ergebnis wird gespeichert.

„Im Schnitt −10 Prozent“ beziehungsweise „im Schnitt +10 Prozent“ beschreibt den Zielwert der Zufallsverteilung, keine garantierte exakte Durchschnittsänderung jeder Runde. Einzelne Getränke können in die andere Richtung laufen. Rundung, Preisgrenzen und manuelle Vorgaben können den tatsächlichen Durchschnitt zusätzlich verändern. Die Steueroberfläche zeigt deshalb die tatsächlich geplante durchschnittliche prozentuale Änderung über alle aktiven Getränke.

Manuelle Vorgaben ersetzen den Zufallspreis vollständig; sie werden nicht noch einmal zufällig verändert oder prozentual verschoben. Ungültige Vorgaben werden abgewiesen und an ihrem Eingabefeld erklärt. Bei Eingaben außerhalb der Grenzen werden die Grenzen nicht stillschweigend umgangen.

### Dummygetränke und Standardwerte

Die Werte dienen zum Entwickeln und Vorführen und sind in der Vorbereitung anpassbar. Mengeneinheiten werden erst ergänzt, wenn die tatsächlichen Ausschankgrößen feststehen.

| Getränk | Startpreis | Mindestpreis | Höchstpreis | Normale Schwankung | Crashschwankung |
|---|---:|---:|---:|---:|---:|
| Bier | 2,00 € | 1,00 € | 3,00 € | ±0,30 € | ±0,60 € |
| Radler | 2,00 € | 1,00 € | 3,00 € | ±0,30 € | ±0,60 € |
| Cola | 1,50 € | 1,00 € | 2,50 € | ±0,20 € | ±0,40 € |
| Wasser | 1,50 € | 1,00 € | 2,50 € | ±0,20 € | ±0,40 € |
| Gin Tonic | 3,50 € | 2,00 € | 5,00 € | ±0,50 € | ±1,00 € |
| Cuba Libre | 3,50 € | 2,00 € | 5,00 € | ±0,50 € | ±1,00 € |
| Wodka Orange | 3,50 € | 2,00 € | 5,00 € | ±0,50 € | ±1,00 € |
| Whisky Cola | 3,50 € | 2,00 € | 5,00 € | ±0,50 € | ±1,00 € |

## 5. Vorschauen und einmalige manuelle Vorgaben

Die Vorschau ist verbindlich: Angezeigte Zufallspreise werden beim Wechsel übernommen, sofern eine manuelle Vorgabe sie nicht ersetzt. Browserneuladen, erneutes Verbinden und Änderungen an manuellen Eingabefeldern erzeugen keine neuen Zufallsvorschläge.

Die Steueroberfläche zeigt je Getränk:

- Aktuellen Preis.
- Gespeicherten Zufallsvorschlag für die nächste normale Runde.
- Optionalen manuellen Preis für diese Runde.
- Daraus resultierenden wirksamen nächsten Preis mit Kennzeichnung „Zufall“ oder „Manuell“.
- Geplante Änderung in Euro und Prozent.

Für den nächsten Crashstart existiert eine zweite, klar getrennte Tabelle mit derselben Struktur. Während des laufenden Crashs erscheint zusätzlich die gespeicherte Erholungsvorschau; die Erholung wird automatisch berechnet.

Normale Zufallsvorschläge werden bei Marktvorbereitung, nach jeder normalen Runde und nach der Erholung erstellt. Bei Crashstart verliert die vorherige normale Zufallsvorschau ihre Gültigkeit. Bis zur Erholung wird sie als ausgesetzt gekennzeichnet und nicht als noch bevorstehender Preis angezeigt. Nach der Erholung wird sie auf deren Preisbasis neu erstellt. Noch nicht verbrauchte normale manuelle Vorgaben bleiben bestehen.

Neue Crashvorschläge werden nach der Erholung und nach normalen Preisrunden berechnet, weil sich ihre Ausgangspreise geändert haben. Ein Hinweis erklärt diese Aktualisierung in der Steueroberfläche. Zufallsvorschläge dürfen während einer unveränderten Preisrunde nicht selbstständig wechseln.

Die Eingabefelder werden erst nach erfolgreicher Veröffentlichung der zugehörigen Preisrunde geleert. Ein abgewiesener Crashstart oder ein fehlgeschlagener Bedienbefehl verbraucht keine Vorgaben. Die Erholungsrunde verbraucht keine normalen Vorgaben.

## 6. Steueroberfläche

Die Oberfläche bleibt auf Laptop und Tablet vollständig bedienbar und passt sich auch einem Handy an. Sie zeigt deutlich getrennte Bereiche:

1. Marktstatus, Verbindung, aktueller Countdown und Art des nächsten Preiswechsels.
2. Nächste normale Runde mit Zufallsvorschau, manuellen Eingaben und wirksamen Preisen.
3. Nächster Crash mit Zufallsvorschau, manuellen Eingaben, wirksamen Preisen und Startknopf.
4. Während des Crashs: Crashstatus, verbleibende Zeit und Erholungsvorschau.
5. Getränkeinstellungen für die Vorbereitung sowie die gemeinsame Gästeansicht „Übersicht“ oder „Laufliste“.

Während der Zehn-Sekunden-Animation sind Eingaben für die unmittelbar bevorstehende Runde und der Crashknopf gesperrt. Das Barteam sieht weiterhin die festgeschriebenen Preise. Das Verbergen der Preise betrifft die Gästebildschirme.

Die Oberfläche unterscheidet eine noch laufende Speicherung, eine bestätigte Vorgabe und einen Speicherfehler. Bei mehreren Steuergeräten verhindert eine Zustandsversion, dass veraltete Befehle neue Änderungen unbemerkt überschreiben. Die aktualisierten Werte werden an alle Steueransichten verteilt.

Die Konfiguration von Getränkeliste, Preisgrenzen, Startpreisen und Schwankungsbreiten ist für die Vorbereitung vorgesehen. Während des laufenden Markts bleiben diese Parameter unverändert; Preiseingaben und Gästeansicht sind weiter steuerbar. Dies hält die zugesagten Vorschauen während des Abends nachvollziehbar.

## 7. Gästebildschirme und Gestaltung

Die zwei Gästebildschirme zeigen dieselbe zentral ausgewählte Ansicht. Bei physischer Bildschirmduplizierung genügt eine Browserinstanz. Bei zwei Anzeigecomputern richten sich Countdown, Übergänge und Laufphase nach derselben Serverzeit.

### Gemeinsame Gestaltung

- Dunkler Börsenhintergrund mit kontrastreicher heller Schrift.
- Große Getränkenamen und Preise, gut aus mehreren Metern lesbar.
- Euroformat mit deutschem Dezimalkomma.
- Veränderung in Euro und Prozent zum zuletzt tatsächlich gezeigten Preis.
- Steigende Preise: Grün mit Aufwärtspfeil; fallende Preise: Rot mit Abwärtspfeil; unveränderte Preise: neutrales Zeichen. Richtung ist auch ohne Farberkennung erkennbar.
- Kopfbereich mit „Stock Market Exchange“, Marktstatus und Countdown.
- Auffälliger Crashstatus und eigene Darstellung der Erholungsphase.

Beim ersten Marktstand gibt es noch keine Veränderung; angezeigt wird ein neutrales Zeichen. Veränderungen werden bei jedem tatsächlichen Preiswechsel fortgeschrieben und bleiben bis zum nächsten Wechsel sichtbar.

### Variante A: Gesamtübersicht

Alle aktiven Getränke stehen gleichzeitig in einem geordneten Raster. Jedes Getränk zeigt Namen, aktuellen Preis und letzte Veränderung. Das erste Layout wird auf die acht Dummygetränke und einen Bildschirm im Format 16:9 ausgelegt. Es entstehen keine Seitenwechsel, bei denen ein Teil der Preise vorübergehend fehlt.

### Variante B: Laufliste

Getränke laufen in wiederholter Folge von unten nach oben. Name, Preis und Veränderung bleiben je Zeile zusammen. Die Bewegung ist langsam genug, um einen vollständig sichtbaren Eintrag lesen zu können. Geschwindigkeit und Laufphase sind serverweit definiert, damit zwei unabhängige Anzeigecomputer bei gleicher Bildschirmgröße dieselbe Liste zeigen.

### Wechselanimation und Preisverbergen

Zehn Sekunden vor Veröffentlichung ersetzt eine bildschirmfüllende Animation die gesamte Preisdarstellung. Sie kündigt je nach Vorgang „Neue Preisrunde“, „Börsencrash“ oder „Erholung“ an und zeigt den Countdown.

In dieser Phase dürfen weder alte noch neue Preise sichtbar sein. Das gilt auch für wiederholte Laufzeilen, Veränderungen und eventuell vorhandene zusätzliche Preiszeilen. Der Preisinhalt wird für Gäste vollständig ausgeblendet; eine lediglich transparente Dekoration über lesbaren Preisen reicht nicht aus. Die Animation verwendet keine schnell flackernden Effekte.

Die Gästeansicht erhält neue Preise erst mit deren Veröffentlichung. Vorschauen und manuelle Eingaben werden ausschließlich an authentifizierte Steueransichten übertragen. Ein alter Preis kann technisch bereits beim Gast vorliegen, bleibt während des Übergangs aber vollständig verborgen.

## 8. Speicherung, Uhrzeit und Fehlerverhalten

Der Server verwaltet Preise, Vorschauen, manuelle Vorgaben, Zustand, Versionsnummer, Zeitpunkte und eine begrenzte Historie der Veröffentlichungen. Ein Preiswechsel und das Leeren der zugehörigen Vorgaben werden gemeinsam gespeichert. Die Historie enthält den vorherigen sichtbaren Preisstand, damit Veränderungen nach erneutem Verbinden korrekt bleiben.

Die Browser synchronisieren ihre Countdown-Anzeige mit Serverzeit und Veröffentlichungszeitpunkt. Abweichende Geräteuhren oder gedrosselte Browsertimer dürfen keine eigenen Preiswechsel auslösen.

Bei Verbindungsverlust:

- Die Steueroberfläche meldet den Verlust und lässt keine unbestätigten Preisänderungen zu.
- Die Gästeansicht kennzeichnet, dass keine aktuellen Daten empfangen werden.
- Vor einem bereits bekannten Wechseltermin beginnt die Gästeansicht weiterhin die Preisverbergung. Wenn der neue verbindliche Stand nicht empfangen wird, bleibt statt Preisen ein Verbindungs- beziehungsweise Wartehinweis sichtbar.
- Die Browser verbinden sich automatisch erneut und übernehmen einen vollständigen aktuellen Zustand. Preisvorschauen werden dabei nicht neu ausgewürfelt.

Bei einem Serverneustart wird der gespeicherte Markt wiederhergestellt. Liegt ein Veröffentlichungszeitpunkt bereits in der Vergangenheit, wird genau die zuletzt gespeicherte anstehende Runde einmalig nachgeholt. Es werden keine Serien von rückwirkenden Zufallsrunden erzeugt. Nach dieser Veröffentlichung beginnt der zum Zustand gehörende neue Timer. Abgelaufene Crashs werden mit der gespeicherten Erholung beendet; sie starten nicht noch einmal von vorne.

Beschädigte oder nicht lesbare Speicherdaten führen zu einer klaren Fehlermeldung; die Anwendung setzt den laufenden Markt nicht stillschweigend auf Dummywerte zurück.

## 9. Umfang der ersten Umsetzung

Enthalten sind Preisverwaltung, einmalige manuelle Vorgaben, verbindliche Zufallsvorschauen, normale Runden, Crash und Erholung, Timer, Animationen, beide Gästevarianten, Schutz der Steuerung, Speicherung und automatisches erneutes Verbinden.

Nicht Teil dieses Barabendprojekts sind Kassensystem, Zahlungsabwicklung, Bestellannahme, Warenbestand oder eine Preisberechnung aus tatsächlichen Verkaufszahlen. Die Börsenwirkung entsteht durch die definierte Schwankungslogik und Eingriffe des Barteams.

## 10. Abnahmekriterien

1. Ein Marktstart erzeugt Vorschauen und einen 30-Minuten-Timer; es gibt keine Orientierung an xx:00 oder xx:30.
2. Mit einer bekannten Zufallsfolge entstehen reproduzierbare normale, Crash- und Erholungspreise innerhalb der Grenzen und Rundung.
3. Das beim Wechsel veröffentlichte Ergebnis entspricht exakt der gespeicherten Vorschau beziehungsweise der wirksamen manuellen Vorgabe.
4. Manuelle normale Vorgaben werden nur nach ihrer normalen Runde geleert. Crashvorgaben werden nur nach erfolgreichem Crashstart geleert. Normale Vorgaben überstehen Crash und Erholung.
5. Ein Crash verwirft den vorherigen normalen Termin. Innerhalb der fünf Minuten gibt es keine normale Zwischenrunde.
6. Die Erholung berechnet neue Preise auf Basis der Crashpreise mit positiver Tendenz. Danach liegt der nächste normale Termin exakt 30 Minuten später.
7. Die letzten zehn Sekunden jedes Wechsels zeigen auf der Gästeansicht keine alten oder neuen Preise. Countdown und Animation stimmen auf beiden Anzeigen überein.
8. Ein Gast erhält über den Echtzeitkanal keine noch unveröffentlichten Preisvorschauen und kann keine Bedienaktionen ausführen.
9. Übersicht und Laufliste zeigen dieselben aktuellen Preise und Änderungen. Der Moduswechsel in der Steuerung wirkt auf beide Gästeanzeigen.
10. Erneutes Verbinden und Neustart bewahren Preise, Vorschauen und einmalige Vorgaben. Ein verpasster Übergang wird höchstens einmal nachgeholt.
11. Das Zeitbeispiel aus Abschnitt 3 wird mit kontrollierter Uhr geprüft, ohne echte 30 Minuten abzuwarten.
12. Die Gästeansichten werden bei 1920 × 1080 und die Steuerung bei Laptop-, Tablet- und Handygröße visuell geprüft.

## 11. Nächster Schritt

Nach Prüfung und Zustimmung zu dieser schriftlichen Spezifikation folgt ein konkreter Implementierungsplan. Produktcode, Projektgerüst und Abhängigkeiten werden erst nach diesem Planungsschritt umgesetzt.
