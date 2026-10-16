# Anleitung für den Barabend

## Vorbereitung

1. Auf dem Serverrechner im Projektordner `npm.cmd start` ausführen. Vor dem ersten Start müssen die Projektpakete installiert, die `.env` ausgefüllt und der Build erstellt sein; die Schritte stehen in der README.
2. Die Steuerung unter `/admin` auf eurem eigenen Gerät öffnen und mit dem Passwort aus der lokalen `.env` anmelden.
3. Unter „Getränke & Preisgrenzen“ Namen, Kategorien, Startpreise, Unter- und Obergrenzen sowie Schwankungsbreiten eintragen. Preise werden standardmäßig auf zehn Cent gerundet.
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

„Markt starten“ beginnt einen vollständigen 30-Minuten-Timer. Die Startpreise bleiben bis zur ersten Runde gültig. Der Ablauf richtet sich nach dem Timer und ist unabhängig von vollen oder halben Uhrzeiten.

Zehn Sekunden vor jeder Runde werden die Preise festgeschrieben. Die unmittelbar anstehenden Eingaben sind dann gesperrt. Auf den Gästebildschirmen sind während dieser zehn Sekunden sämtliche Preise verborgen. Danach erscheinen die neuen Preise und ihre Veränderung zum vorherigen sichtbaren Stand.

## Crash und Erholung

„Börsencrash auslösen“ startet zunächst die zehnsekündige Übergangsanimation. Danach gelten fünf Minuten lang die vorbereiteten Crashpreise. Der bisherige normale Termin entfällt.

Die Crashvorgaben werden nach Veröffentlichung geleert. Normale Vorgaben bleiben für die nächste normale Runde gespeichert. Während des Crashs zeigt die Steuerung die gespeicherten Erholungspreise. Die normale Zufallsvorschau ist in dieser Zeit ausgesetzt.

Die letzten zehn Sekunden der fünf Crashminuten sind die Erholungsanimation. Nach fünf Minuten erscheinen neue Erholungspreise mit positiver Tendenz; frühere Preise werden nicht einfach wiederhergestellt. Ab diesem Zeitpunkt läuft wieder ein voller 30-Minuten-Timer.

Die Prozenttendenzen sind Zielwerte der Zufallsverteilung. Einzelne Preise und der tatsächliche Durchschnitt können wegen Zufall, Rundung, Preisgrenzen und manuellen Vorgaben abweichen. Die Entwickleransicht zeigt die tatsächlich geplante durchschnittliche Veränderung.

## Verbindung und Neustart

Wenn auf einem Anzeigegerät „Bewegung reduzieren“ aktiviert ist, wechselt die Laufliste in diskreten Schritten statt durchgehend zu scrollen. Alle Getränke erscheinen weiterhin; die preisfreien Übergänge bleiben aktiv.

Bei Verbindungsverlust bleibt die Steuerung lesbar, lässt aber keine unbestätigten Änderungen zu. Die Gäste sehen einen Verbindungshinweis. Bei einem bekannten anstehenden Preiswechsel werden die Preise trotzdem rechtzeitig verborgen. Ohne neuen verbindlichen Stand bleibt „Warte auf aktuelle Preise“ sichtbar.

Die Browser verbinden sich automatisch erneut. Ein Neuladen führt ebenfalls zum aktuellen gespeicherten Marktstand. Ein Serverneustart bewahrt Vorschauen und Vorgaben; abgelaufene Runden werden höchstens einmal nachgeholt.

## Geräte im WLAN verbinden

Auf dem Serverrechner in PowerShell `ipconfig` ausführen und die IPv4-Adresse der aktiven WLAN- oder LAN-Verbindung verwenden. Beispiel: Serveradresse `192.168.1.20`; Steuerung `http://192.168.1.20:3000/admin`, Gäste `http://192.168.1.20:3000/display`.

Falls die Adressen auf anderen Geräten nicht erreichbar sind, prüfen, ob alle Geräte im selben Netzwerk liegen, die Windows-Firewall den Node-Server im privaten Netzwerk zulässt und das WLAN keine Isolation zwischen seinen Geräten erzwingt. Die Anwendung verändert diese Einstellungen nicht automatisch.

## Nach dem Abend

Den Server mit Strg+C beenden. Die Marktdatei und eure `.env` bleiben erhalten. Für einen neuen Vorbereitungsmarkt nach einer Probe zuerst den Server beenden und `data/market.json` als Sicherung umbenennen. Beim nächsten Start entsteht ein neuer Markt mit Dummywerten; eure alten Einstellungen und der Verlauf bleiben in der Sicherung erhalten.
