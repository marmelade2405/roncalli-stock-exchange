# Anleitung für den Barabend

## Vorbereitung

1. Auf dem Serverrechner im Projektordner `npm.cmd start` ausführen. Vor dem ersten Start müssen die Projektpakete installiert, die `.env` ausgefüllt und der Build erstellt sein; die Schritte stehen in der README.
2. Die Steuerung unter `/admin` auf eurem eigenen Gerät öffnen und mit dem Passwort aus der lokalen `.env` anmelden.
3. Im Reiter „Einstellungen“ unter „Getränke & Preisgrenzen“ Getränke, Preisgrenzen, Rundung, Zeitparameter und Trends sowie Texte/Wirkungen der Breaking News bearbeiten. Zeiten werden in ganzen Sekunden gespeichert. Festpreise von Specials müssen innerhalb der jeweiligen Preisgrenzen liegen und zum Rundungsschritt passen.
4. Die Konfiguration speichern. Sie erzeugt neue Vorschauen und leert bisherige manuelle Vorgaben. Diese Einstellungen stehen während des laufenden Markts nicht zur Änderung bereit.
5. Auf den Gästegeräten `/display` öffnen. Alle Geräte verwenden dieselbe Serveradresse. Übersicht oder Laufliste in der Steuerung auswählen; die Wahl gilt gemeinsam für beide Anzeigen.
6. In der Gästeansicht „Vollbild“ wählen und den Server sowie die Anzeigegeräte für den Abend wach halten.

## Preise vorgeben

Die fünf Reiter trennen „Steuerung“ (Simulation und Reset), „Kurse“ (normale Vorgaben und Sofortpreise), „Crash“ (Crashvorgaben und Erholung), „Breaking News“ (manuelle Meldungen) und „Einstellungen“. Ein Wechsel erhält Entwürfe; der letzte Reiter wird lokal für diesen Browser gemerkt. Pfeiltasten sowie Home/End wechseln zwischen fokussierten Reitern. Marktstatus, Countdown, Gästeansicht und die Start-/Crashaktionen stehen gemeinsam darüber.

Jede Tabelle enthält aktuellen Preis, gespeicherten Zufallsvorschlag, optionalen manuellen Preis und wirksamen nächsten Preis. Die Zufallswerte ändern sich nicht durch Neuladen.

„Ø nächste Preisänderung“ und „Ø Crash-Preisänderung“ oben rechts sind der gleichgewichtete Mittelwert der geplanten prozentualen Änderungen gegenüber dem aktuellen Kurs. Gespeicherte manuelle Vorgaben zählen mit; Getränke mit aktuellem Preis 0 € werden ausgelassen. „Zieltrend Erholung“ bezeichnet dagegen den eingestellten Trend, nicht den tatsächlich vorbereiteten Durchschnitt.

- Eine normale Vorgabe gilt nur für die nächste normale Runde.
- Eine Crashvorgabe gilt nur für den nächsten Crashstart.
- Ein leeres Feld verwendet den Zufallsvorschlag.
- Eingaben werden beim Verlassen des Felds gespeichert. Auch Enter verlässt das Feld. Auf „Gespeichert“ achten.
- Fehler bleiben am betreffenden Feld sichtbar; der wirksame Preis zeigt weiterhin den tatsächlich bestätigten Stand.
- Bei einer Änderung durch ein zweites Steuergerät bleibt eure noch ungespeicherte Eingabe erhalten. Die aktuellen Werte prüfen und das Feld erneut verlassen, um die Vorgabe bewusst noch einmal zu speichern.
- Auf schmalen Bildschirmen die Preistabelle seitlich wischen, um die manuellen Eingaben zu erreichen.

## Markt starten

Unter „Einstellungen“ steht unter der Getränketabelle die „Preisverteilung · normale Runden“. Getränk auswählen und Average, Rückführung, Schwankung, Min/Max, Preisschritt oder Startpreis direkt am Diagramm anpassen. Die Eingaben sind mit der Tabelle verbunden. Die Linie reagiert vor dem Speichern; der aktuelle Markt bleibt unverändert. „Ungespeicherter Entwurf“ unterscheidet geplante von gespeicherten Parametern. Anklicken oder Pfeiltasten im Diagramm zeigt die Häufigkeit eines einzelnen Preises. Gold markiert den Ziel-Average; daneben steht der tatsächliche Mittelwert der Vorschau.

Die Vorschau verwendet 200.000 normale Runden nach 2.000 Einlaufrunden, einschließlich Rundung und Preisgrenzen. Sie beschreibt eine angenäherte langfristige Verteilung bei gleich langen Runden, ohne Crashs, News oder manuelle Eingriffe. Sehr breite Preisbereiche werden in höchstens 200 Preisgruppen zusammengefasst und entsprechend beschriftet. Bei geringer Rückführung kann das Ergebnis vom Startpreis abhängen; es ist keine Umsatzprognose. Ungültige Eingaben blenden die Linie aus und zeigen den Fehler. Ältere gespeicherte Getränke ohne Average werden mit ihrer tatsächlichen Zufallswanderung berechnet, bis neue Parameter gespeichert werden.

„Schwankung €“ steuert jetzt die Basis der automatisch asymmetrischen Normalbewegung: Mehr Platz oberhalb des Average erlaubt größere positive Ausschläge, mehr Platz unterhalb größere negative. Die Vorschau nennt beide Beträge sowie die ausbalancierte Häufigkeit seltener Min-/Max-Spitzen. Größere Schwankungsbasis erhöht diese Häufigkeit. Die folgenden normalen Runden ziehen Extremkurse wieder zum Average zurück; Spitzen ändern nicht die eingestellte Rundendauer. Crash und Erholung verwenden weiterhin ihre separaten Trends und Schwankungen.

„Markt starten“ beginnt standardmäßig einen vollständigen 20-Minuten-Timer. Die Startpreise bleiben bis zur ersten Änderung gültig. Der Ablauf richtet sich nach dem Timer und ist unabhängig von vollen oder halben Uhrzeiten. Ungespeicherte Einstellungen zuerst speichern; der Start ist bis dahin gesperrt.

Zehn Sekunden vor jeder Runde werden die Preise festgeschrieben. Die unmittelbar anstehenden Eingaben sind dann gesperrt. Auf den Gästebildschirmen sind während dieser zehn Sekunden sämtliche Preise verborgen. Danach erscheinen die neuen Preise und ihre Veränderung zum vorherigen sichtbaren Stand.

## Crash und Erholung

„Börsencrash auslösen“ startet zunächst die zehnsekündige Übergangsanimation. Danach gelten fünf Minuten lang die vorbereiteten Crashpreise. Ein gemeinsamer, gespeicherter Rückgang wird standardmäßig aus 5–15 % ausgewählt; Minimum und Maximum sind unter Einstellungen änderbar. Rundung, Preisgrenzen und manuelle Vorgaben können einzelne Kurse begrenzen. Der bisherige normale Termin entfällt.

Die Crashvorgaben werden nach Veröffentlichung geleert. Normale Vorgaben bleiben für die nächste normale Runde gespeichert. Während des Crashs zeigt die Steuerung die gespeicherten Erholungspreise. Die normale Zufallsvorschau ist in dieser Zeit ausgesetzt.

Die letzten zehn Sekunden der fünf Crashminuten sind die Erholungsanimation. Nach fünf Minuten erscheinen neue Erholungspreise mit genau demselben ausgewählten Prozentsatz nach oben; frühere Preise werden nicht einfach wiederhergestellt. Ab diesem Zeitpunkt läuft wieder ein voller 20-Minuten-Timer.

„Crash abbrechen“ während der Einleitung veröffentlicht keine Crashpreise und erhält die Crashvorgaben. Während der aktiven Crashphase beginnt es die Erholungsanimation vorzeitig mit den gespeicherten Erholungspreisen. Eine laufende Erholung lässt sich damit nicht abbrechen. Nach beiden Abbrüchen startet ein neuer normaler Timer.

## Sofortpreise und Kursverlauf

Die Preisschilder verwenden einen einzelnen größeren Getränkenamen. Über dem Preis steht ein grüner bzw. roter Blinkpunkt; die Charts haben keine blinkenden Endpunkte. Der Verlauf zeigt standardmäßig 15 Datenpunkte einschließlich Ausgangspunkt. Der Admin-Parameter „Verlauf (Datenpunkte)“ ändert die Gesamtanzahl. Achsen und Schrift werden ohne Streckung gerendert, auch beim Ändern der Bildschirmbreite. simulierte Verläufe schlagen stärker nach oben und unten aus, bleiben innerhalb der Preisgrenzen und sind als Demo gekennzeichnet.

Nach normaler Preisrunde, Crash und Erholung werden die Kurse nacheinander sichtbar. „Preis-Einblendung: Abstand (Sekunden)“ steuert den Abstand, standardmäßig 0,5 Sekunden. Werte von 0 bis 5 Sekunden sind in Schritten von 0,05 Sekunden möglich; 0 blendet alles gleichzeitig ein. Der Abstand muss zur Runden-/Crashdauer passen, sonst wird die Konfiguration beim Speichern abgewiesen. Einzelne Specials und Sofortkorrekturen erscheinen direkt. Korrekturen während einer Sequenz zeigen nur ihren betroffenen Kurs sofort; die übrigen Kurse folgen weiter der ursprünglichen Reihenfolge. Ein Neuladen startet die Sequenz nicht erneut.

In beschleunigten Simulationen bleibt eine mehrteilige Sequenz kurz bei 1×, damit alle Kurse sichtbar werden. Danach gilt wieder das gewählte Tempo. „Zum nächsten Ereignis“ überspringt diese Präsentation bewusst und springt zum nächsten Preiswechsel. Preisberechnung und Live-Termine bleiben unverändert. Der grüne Marktstatus mit LED zeigt frische, gültige Live-Kurse an. Die Breaking-News-Laufleiste verwendet größere Schrift.

Unter „Die nächsten Kurse“ steht beim aktuellen Kurs eine separate Sofortpreis-Eingabe. Betrag eingeben und „Jetzt setzen“ wählen. Erst „Gespeichert“ bestätigt den sichtbaren Preis; die normale Einmalvorgabe bleibt erhalten. Im Preiswechsel sind Sofortkorrekturen gesperrt. Fehler lassen den eingegebenen Betrag stehen.

Die Gäste sehen standardmäßig 15 Datenpunkte als Liniencharts. Bis genügend echte Änderungen vorliegen, ergänzen dezente simulierte Verlaufspunkte den Verlauf. Unter dem Chart stehen keine Demo- oder Änderungszahlen mehr. Die Demo ist auf beiden Anzeigen identisch, endet am echten Ausgangspreis und wird mit echten Änderungen schrittweise ersetzt. Sie beeinflusst weder Preise noch Vorschauen, Delta-Werte oder den gespeicherten Marktverlauf. Höhere Charts stehen links vom Kurs mit Linien für Minimum, Average und Maximum. Die neue Preisliste und die Rückführung zum Average stehen in docs/bar-price-list.md; Wasser bleibt 0 € mit flachem Verlauf. Preisstände sind gleichmäßig verteilt und werttreu gerundet verbunden; tatsächliche Zeitpunkte bleiben in der Diagrammbeschreibung. Ein unveränderter Kurs erzeugt keinen zusätzlichen Punkt. Größere Euro- und Prozentzahlen beziehen sich auf die letzte tatsächliche Änderung dieses Getränks.

## Breaking News

Für die 19 kostenpflichtigen Standardgetränke gibt es 38 satirische Nachrichten: je eine steigende und eine fallende Wirkung, standardmäßig ±40 %. Elf Meldungen sind auf Roncalli zugeschnitten; zwei EZB-Meldungen betreffen Berentzen bzw. Pfeffi. Die sieben Shot-Sorten besitzen unabhängige Kurse und jeweils zwei eigene Nachrichten. Alle Meldungen werden ausschließlich manuell ausgelöst, auch in der Simulation und nach einem Serverneustart. Es gibt keine automatischen Startzeiten. Die Warteschlange zeigt offene und erledigte Meldungen mit tatsächlicher Preisvorschau. Die gewünschte Meldung auswählen; „Jetzt auslösen“ startet die ausgewählte Meldung einmal. Erledigte Meldungen sind erst nach einem Reset wieder verfügbar.

Benes RageCage-Special setzt Bier immer auf genau 1,50 €, auch wenn es zuvor günstiger war. Die Gästeanzeige zeigt dabei die tatsächliche Kursrichtung. Heshams Wein-Special verwendet +50 %; die übrigen prozentualen Meldungen bleiben innerhalb der Getränkepreisgrenzen. In den Nachrichteneinstellungen ist ein optionaler „Festpreis €“ eintragbar. Ein leerer Festpreis verwendet stattdessen die Prozentwirkung. Festpreise werden vor dem Speichern auf Grenzen und Rundungsschritt geprüft. [Alle Roncalli-Meldungen](roncalli-news.md).

Die Einblendung beginnt mit fünf Sekunden animiertem Einspieler. Anschließend steht die Meldung 15 Sekunden groß und ruhig auf dem Bildschirm. Während aller 20 Sekunden sind sämtliche Preise und Diagramme verborgen. Erst danach verändert sich der Kurs des zugeordneten Getränks. Die Meldung läuft anschließend unten im Nachrichtenband weiter; das Getränk ist in Übersicht und Laufliste farbig markiert. Band und Markierung enden mit dem nächsten Special oder einer Preisrunde. Grenzen und Rundung können die tatsächliche Wirkung begrenzen; die Admin-Vorschau zeigt diese Abweichung. Der normale Timer und normale Einmalvorgaben bleiben bestehen. „News: Gesamtdauer“ und „News-Einspieler“ sind in der Vorbereitung einstellbar; die verbleibende Zeit ist die Lesedauer.

Direktstarts sind nur im normalen Markt mit genügend Restzeit für die gesamte News-Einblendung vor dem nächsten Kurswechsel möglich. Während Crash, Erholung oder einer anderen Einblendung ist der Start gesperrt. Offene Meldungen bleiben erhalten, bis ein Admin sie auslöst; die Abenddauer verbraucht oder startet keine Nachrichten. Eine laufende Meldung ist bereits festgeschrieben.

## Generalprobe vor dem Abend

In der Vorbereitung im Reiter „Steuerung“ „Generalprobe / Simulation“ aktivieren und Tempo am Regler wählen: ganze Werte von 1× bis 500×. Danach Markt starten und dieselben Admin-/Gästeoberflächen ausprobieren. Der Hinweis SIMULATION erscheint auf beiden Anzeigen. Normale Wartezeiten laufen beschleunigt; Preiswechsel und Nachrichten dauern weiterhin die eingestellte Zahl echter Sekunden bei 1×. Beim News-Einspieler fliegen die Schriftbänder in den letzten 0,7 Sekunden auseinander; ein Lichtstreifen gibt die Lesemeldung frei. Nach fünf Sekunden ist sie vollständig sichtbar und bleibt bis zur Veröffentlichung bei Sekunde 20 stehen.

Den Regler jederzeit nach links oder rechts verschieben, auch während einer laufenden oder pausierten Simulation und im Crash. Marktzeit, Termine und Preise bleiben beim Tempowechsel erhalten. Eine Pause wird dadurch nicht aufgehoben. Während eines Preiswechsels oder einer Nachricht wird das neue Tempo vorgemerkt; die Einblendung bleibt bei 1×, danach gilt das gewählte Tempo.

Der Countdown einer zehnsekündigen Preiseinleitung lässt sich zum Überspringen anklicken, im Admin oder in einer Gästeansicht mit derselben Admin-Anmeldung. Livebetrieb und Breaking News bleiben geschützt. „Pause“ hält die Marktzeit an, „Fortsetzen“ setzt sie fort. „Zum nächsten Ereignis“ springt bis zum nächsten normalen Preiswechsel oder zur Erholung; es startet keine News. Während einer Einblendung ist der Sprung gesperrt. Bei Serverneustart bleibt die Simulation am gespeicherten Stand pausiert und muss bewusst fortgesetzt werden. Die Anmeldung richtet sich weiter nach echter Zeit.

Vor dem tatsächlichen Abend „Abend neu starten“ bestätigen. Dadurch bleiben eure Einstellungen und Reihenfolge erhalten, die Probe wird gelöscht, alle Nachrichten sind wieder offen und der Markt steht in Vorbereitung mit Livegeschwindigkeit 1×. Erst dann den echten Abend starten.

## Reset

„Abend neu starten“ behält Getränke, Einstellungen, Nachrichtentexte, konfigurierte Reihenfolge und Gästeansicht. Es setzt Preise auf Startwerte, leert Vorgaben und Verlauf, macht alle Specials wieder verfügbar und beendet Timer/Simulation. „Werkseinstellungen“ stellt zusätzlich die 20 Standardgetränke einschließlich kostenlosem Wasser, Standardnachrichten und Standardparameter wieder her.

Beide Aktionen benötigen eine Bestätigung und sind auch während Crash oder Wechsel möglich. Ändert ein anderes Steuergerät den Markt bei geöffnetem Dialog, prüft den neuen Stand und bestätigt erneut. Zugangsdaten bleiben bei beiden Aktionen erhalten.

Die Prozenttendenzen sind Zielwerte der Zufallsverteilung. Einzelne Preise und der tatsächliche Durchschnitt können wegen Zufall, Rundung, Preisgrenzen und manuellen Vorgaben abweichen. Die Entwickleransicht zeigt die tatsächlich geplante durchschnittliche Veränderung.

## Verbindung und Neustart

Im Admin-Reiter Steuerung „Ton aktivieren“ anklicken; Signale werden auf diesem Admin-Gerät ausgegeben. Kurze Signale begleiten Preiswechsel, Breaking News, Crash, Erholung und die gestaffelten Kurs-Pops. Lautstärke einstellen oder mit „Ton an“ wieder stummschalten. Die Auswahl und Lautstärke werden lokal im Browser gemerkt; nach Neuladen kann erneut ein Klick zur Freigabe der Audioausgabe nötig sein. Bereits laufende oder verpasste Ereignisse werden nicht nachträglich vertont. Bei Pause, Reset oder Verbindungsverlust werden laufende Signale gestoppt. Bei zwei getrennten Anzeigecomputern nur das gewünschte Gerät vertonen, um doppelte Ausgabe zu vermeiden. Die frühere Fußleiste mit Uhr und Legende entfällt; Vollbild bleibt in der Gästeansicht oben erreichbar. Das Nachrichtenlaufband bleibt erhalten.

Die Laufliste läuft auf breiten Bildschirmen in zwei Spalten mit einzelnen Getränkeblöcken mit standardmäßig drei Sekunden je Zeile. Auf schmalen Geräten erscheinen alle Getränke in einer Spalte. Das Tempo ist jederzeit am Regler neben Übersicht/Laufliste einstellbar. Blinkpunkte stehen über den Preisen; die Charts zeigen Liniencharts. simulierte Verläufe bewegen sich in zusammenhängenden Trends um den Average. Die größere News-Anzeige trägt im Einspieler „RONCALLI STOCK MARKET EXCHANGE“; lange Texte werden für kleinere Bildschirme eingepasst. Der Crash-Einspieler verwendet einen roten Alarmrahmen, fallende Pfeile, eine abstürzende Linie und einen kurzen Bildschirmstoß. Mit „Bewegung reduzieren“ bleiben Punkt, Rahmen, Pfeile und Stoß ruhig; Countdown und Fortschritt bleiben ablesbar.

Wenn auf einem Anzeigegerät „Bewegung reduzieren“ aktiviert ist, wechselt die Laufliste in diskreten Schritten statt durchgehend zu scrollen. Der News-Einspieler erscheint ohne Flugbewegung, das Nachrichtenband zeigt eine ruhende Kurzmeldung. Alle Getränke erscheinen weiterhin; die preisfreien Übergänge bleiben aktiv.

Bei Verbindungsverlust bleibt die Steuerung lesbar, lässt aber keine unbestätigten Änderungen zu. Die Gäste sehen einen Verbindungshinweis und ausgeblendete Preise/Diagramme. Das gilt auch bei einer scheinbar offenen Verbindung, die über 15 Sekunden keinen frischen Zustand liefert. Ohne neuen verbindlichen Stand bleibt „Warte auf aktuelle Preise“ sichtbar.

Die Browser verbinden sich automatisch erneut. Ein Neuladen führt ebenfalls zum aktuellen gespeicherten Marktstand. Ein Serverneustart bewahrt Vorschauen und Vorgaben; abgelaufene Runden werden höchstens einmal nachgeholt.

## Geräte im WLAN verbinden

Auf dem Serverrechner in PowerShell `ipconfig` ausführen und die IPv4-Adresse der aktiven WLAN- oder LAN-Verbindung verwenden. Beispiel: Serveradresse `192.168.1.20`; Steuerung `http://192.168.1.20:3000/admin`, Gäste `http://192.168.1.20:3000/display`.

Falls die Adressen auf anderen Geräten nicht erreichbar sind, prüfen, ob alle Geräte im selben Netzwerk liegen, die Windows-Firewall den Node-Server im privaten Netzwerk zulässt und das WLAN keine Isolation zwischen seinen Geräten erzwingt. Die Anwendung verändert diese Einstellungen nicht automatisch.

## Nach dem Abend

Für den nächsten Abend „Abend neu starten“ wählen, um eure Einstellungen zu behalten. Den Server mit Strg+C beenden. Marktdatei und `.env` bleiben erhalten. Alte Schema-1-Dateien werden bei Bedarf mit einer unveränderten, nicht überschriebenen `.v1-backup`-Sicherung migriert. Eine beschädigte Datei bleibt erhalten und verhindert den Start mit einer Fehlermeldung.
