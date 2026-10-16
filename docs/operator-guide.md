# Anleitung für den Barabend

## Vorbereitung

1. Auf dem Serverrechner im Projektordner `npm.cmd start` ausführen. Vor dem ersten Start müssen die Projektpakete installiert, die `.env` ausgefüllt und der Build erstellt sein; die Schritte stehen in der README.
2. Die Steuerung unter `/admin` auf eurem eigenen Gerät öffnen und mit dem Passwort aus der lokalen `.env` anmelden.
3. Unter „Getränke & Preisgrenzen“ Getränke, Preisgrenzen, Rundung, sämtliche Zeitparameter und Trends sowie Texte/Wirkungen der Breaking News bearbeiten. Zeiten werden in ganzen Sekunden gespeichert. Nicht passende Kombinationen werden beim Speichern abgewiesen, damit alle Meldungen in die Abendplanung passen.
4. Die Konfiguration speichern. Sie erzeugt neue Vorschauen und leert bisherige manuelle Vorgaben. Diese Einstellungen stehen während des laufenden Markts nicht zur Änderung bereit.
5. Auf den Gästegeräten `/display` öffnen. Alle Geräte verwenden dieselbe Serveradresse. Übersicht oder Laufliste in der Steuerung auswählen; die Wahl gilt gemeinsam für beide Anzeigen.
6. In der Gästeansicht „Vollbild“ wählen und den Server sowie die Anzeigegeräte für den Abend wach halten.

## Preise vorgeben

Jede Tabelle enthält aktuellen Preis, gespeicherten Zufallsvorschlag, optionalen manuellen Preis und wirksamen nächsten Preis. Die Zufallswerte ändern sich nicht durch Neuladen.

- Eine normale Vorgabe gilt nur für die nächste normale Runde.
- Eine Crashvorgabe gilt nur für den nächsten Crashstart.
- Ein leeres Feld verwendet den Zufallsvorschlag.
- Eingaben werden beim Verlassen des Felds gespeichert. Auch Enter verlässt das Feld. Auf „Gespeichert“ achten.
- Fehler bleiben am betreffenden Feld sichtbar; der wirksame Preis zeigt weiterhin den tatsächlich bestätigten Stand.
- Bei einer Änderung durch ein zweites Steuergerät bleibt eure noch ungespeicherte Eingabe erhalten. Die aktuellen Werte prüfen und das Feld erneut verlassen, um die Vorgabe bewusst noch einmal zu speichern.
- Auf schmalen Bildschirmen die Preistabelle seitlich wischen, um die manuellen Eingaben zu erreichen.

## Markt starten

„Markt starten“ beginnt standardmäßig einen vollständigen 20-Minuten-Timer. Die Startpreise bleiben bis zur ersten Änderung gültig. Der Ablauf richtet sich nach dem Timer und ist unabhängig von vollen oder halben Uhrzeiten. Ungespeicherte Einstellungen zuerst speichern; der Start ist bis dahin gesperrt.

Zehn Sekunden vor jeder Runde werden die Preise festgeschrieben. Die unmittelbar anstehenden Eingaben sind dann gesperrt. Auf den Gästebildschirmen sind während dieser zehn Sekunden sämtliche Preise verborgen. Danach erscheinen die neuen Preise und ihre Veränderung zum vorherigen sichtbaren Stand.

## Crash und Erholung

„Börsencrash auslösen“ startet zunächst die zehnsekündige Übergangsanimation. Danach gelten fünf Minuten lang die vorbereiteten Crashpreise. Der bisherige normale Termin entfällt.

Die Crashvorgaben werden nach Veröffentlichung geleert. Normale Vorgaben bleiben für die nächste normale Runde gespeichert. Während des Crashs zeigt die Steuerung die gespeicherten Erholungspreise. Die normale Zufallsvorschau ist in dieser Zeit ausgesetzt.

Die letzten zehn Sekunden der fünf Crashminuten sind die Erholungsanimation. Nach fünf Minuten erscheinen neue Erholungspreise mit positiver Tendenz; frühere Preise werden nicht einfach wiederhergestellt. Ab diesem Zeitpunkt läuft wieder ein voller 20-Minuten-Timer.

„Crash abbrechen“ während der Einleitung veröffentlicht keine Crashpreise und erhält die Crashvorgaben. Während der aktiven Crashphase beginnt es die Erholungsanimation vorzeitig mit den gespeicherten Erholungspreisen. Eine laufende Erholung lässt sich damit nicht abbrechen. Nach beiden Abbrüchen startet ein neuer normaler Timer.

## Sofortpreise und Kursverlauf

Unter „Die nächsten Kurse“ steht beim aktuellen Kurs eine separate Sofortpreis-Eingabe. Betrag eingeben und „Jetzt setzen“ wählen. Erst „Gespeichert“ bestätigt den sichtbaren Preis; die normale Einmalvorgabe bleibt erhalten. Im Preiswechsel sind Sofortkorrekturen gesperrt. Fehler lassen den eingegebenen Betrag stehen.

Die Gäste sehen standardmäßig zehn tatsächlich veröffentlichte Preisänderungen plus Ausgangspunkt. Höhere Charts stehen links vom Kurs mit Linien für Minimum, Average und Maximum. Die neue Preisliste und die Rückführung zum Average stehen in docs/bar-price-list.md; Wasser bleibt 0 €. Die Diagramme verwenden die tatsächlichen Zeitabstände. Ein unveränderter Kurs erzeugt keinen zusätzlichen Punkt. Größere Euro- und Prozentzahlen beziehen sich auf die letzte tatsächliche Änderung dieses Getränks.

## Breaking News

Für die 13 kostenpflichtigen Standardgetränke gibt es 26 satirische Nachrichten: je eine steigende und eine fallende Wirkung, standardmäßig ±40 %. Der Zeitplan verteilt sie zufällig über fünf Stunden; jede Meldung erscheint einmal. In der Warteschlange sind Vorschau, Zeitpunkt und Preisgrenzen sichtbar. Pfeile oder Ziehen ändern die Reihenfolge; „Jetzt auslösen“ zieht genau diese Nachricht vor. Erledigte Meldungen sind erst nach einem Reset wieder verfügbar.

Die Einblendung dauert standardmäßig zehn Sekunden und verbirgt sämtliche Preise und Diagramme. Anschließend verändert sich nur der Kurs des zugeordneten Getränks. Grenzen und Rundung können die tatsächliche Wirkung begrenzen; die Admin-Vorschau zeigt diese Abweichung. Der normale Timer und normale Einmalvorgaben bleiben bestehen; das Special gilt bis zur nächsten normalen Runde oder einer weiteren Änderung dieses Getränks.

Automatische Meldungen halten standardmäßig zwei Minuten Abstand zu Veröffentlichungen und vor normalen Wechseln. Kollisionen mit Crash, Erholung oder anderen Einblendungen verschieben die Meldung. Viele manuelle Eingriffe können das Ende der ursprünglichen Abendplanung überschreiten; die Queue verliert dadurch keine Nachricht. Direktstarts sind nur im normalen Markt mit genügend Restzeit möglich. Eine laufende Meldung ist bereits festgeschrieben und kann nicht verschoben werden.

## Generalprobe vor dem Abend

In der Vorbereitung „Generalprobe / Simulation“ aktivieren und Tempo am Regler wählen: ganze Werte von 1× bis 120×. Danach Markt starten und dieselben Admin-/Gästeoberflächen ausprobieren. Der Hinweis SIMULATION erscheint auf beiden Anzeigen. Normale Wartezeiten laufen beschleunigt; Preiswechsel und Nachrichten dauern weiterhin die eingestellte Zahl echter Sekunden bei 1×.

Den Regler jederzeit nach links oder rechts verschieben, auch während einer laufenden oder pausierten Simulation und im Crash. Marktzeit, Termine und Preise bleiben beim Tempowechsel erhalten. Eine Pause wird dadurch nicht aufgehoben. Während eines Preiswechsels oder einer Nachricht wird das neue Tempo vorgemerkt; die Einblendung bleibt bei 1×, danach gilt das gewählte Tempo.

„Pause“ hält die Marktzeit an, „Fortsetzen“ setzt sie fort. „Zum nächsten Ereignis“ springt bis zum nächsten Special oder Preiswechsel; während einer Einblendung ist der Sprung gesperrt. Bei Serverneustart bleibt die Simulation am gespeicherten Stand pausiert und muss bewusst fortgesetzt werden. Die Anmeldung richtet sich weiter nach echter Zeit.

Vor dem tatsächlichen Abend „Abend neu starten“ bestätigen. Dadurch bleiben eure Einstellungen und Reihenfolge erhalten, die Probe wird gelöscht, alle Nachrichten sind wieder offen und der Markt steht in Vorbereitung mit Livegeschwindigkeit 1×. Erst dann den echten Abend starten.

## Reset

„Abend neu starten“ behält Getränke, Einstellungen, Nachrichtentexte, konfigurierte Reihenfolge und Gästeansicht. Es setzt Preise auf Startwerte, leert Vorgaben und Verlauf, macht alle Specials wieder verfügbar und beendet Timer/Simulation. „Werkseinstellungen“ stellt zusätzlich die ursprünglichen acht Getränke, Standardnachrichten und Standardparameter wieder her.

Beide Aktionen benötigen eine Bestätigung und sind auch während Crash oder Wechsel möglich. Ändert ein anderes Steuergerät den Markt bei geöffnetem Dialog, prüft den neuen Stand und bestätigt erneut. Zugangsdaten bleiben bei beiden Aktionen erhalten.

Die Prozenttendenzen sind Zielwerte der Zufallsverteilung. Einzelne Preise und der tatsächliche Durchschnitt können wegen Zufall, Rundung, Preisgrenzen und manuellen Vorgaben abweichen. Die Entwickleransicht zeigt die tatsächlich geplante durchschnittliche Veränderung.

## Verbindung und Neustart

Wenn auf einem Anzeigegerät „Bewegung reduzieren“ aktiviert ist, wechselt die Laufliste in diskreten Schritten statt durchgehend zu scrollen. Alle Getränke erscheinen weiterhin; die preisfreien Übergänge bleiben aktiv.

Bei Verbindungsverlust bleibt die Steuerung lesbar, lässt aber keine unbestätigten Änderungen zu. Die Gäste sehen einen Verbindungshinweis und ausgeblendete Preise/Diagramme. Das gilt auch bei einer scheinbar offenen Verbindung, die über 15 Sekunden keinen frischen Zustand liefert. Ohne neuen verbindlichen Stand bleibt „Warte auf aktuelle Preise“ sichtbar.

Die Browser verbinden sich automatisch erneut. Ein Neuladen führt ebenfalls zum aktuellen gespeicherten Marktstand. Ein Serverneustart bewahrt Vorschauen und Vorgaben; abgelaufene Runden werden höchstens einmal nachgeholt.

## Geräte im WLAN verbinden

Auf dem Serverrechner in PowerShell `ipconfig` ausführen und die IPv4-Adresse der aktiven WLAN- oder LAN-Verbindung verwenden. Beispiel: Serveradresse `192.168.1.20`; Steuerung `http://192.168.1.20:3000/admin`, Gäste `http://192.168.1.20:3000/display`.

Falls die Adressen auf anderen Geräten nicht erreichbar sind, prüfen, ob alle Geräte im selben Netzwerk liegen, die Windows-Firewall den Node-Server im privaten Netzwerk zulässt und das WLAN keine Isolation zwischen seinen Geräten erzwingt. Die Anwendung verändert diese Einstellungen nicht automatisch.

## Nach dem Abend

Für den nächsten Abend „Abend neu starten“ wählen, um eure Einstellungen zu behalten. Den Server mit Strg+C beenden. Marktdatei und `.env` bleiben erhalten. Alte Schema-1-Dateien werden bei Bedarf mit einer unveränderten, nicht überschriebenen `.v1-backup`-Sicherung migriert. Eine beschädigte Datei bleibt erhalten und verhindert den Start mit einer Fehlermeldung.
