# GitHub + Render einrichten

Der Projektcode ist auf GitHub veröffentlicht: https://github.com/marmelade2405/roncalli-stock-exchange (Branch `main`, auf ausdrücklichen Wunsch öffentlich). GitHub enthält den Code; Render führt den Server aus. Der tatsächliche Live-Status wird im Render-Dashboard geprüft. Danach braucht der Laptop nicht mehr eingeschaltet zu sein. Alle Geräte verwenden dieselbe HTTPS-Adresse und denselben Markt.

## 1. GitHub verbinden

Das Repository `marmelade2405/roncalli-stock-exchange` ist eingerichtet. Der lokale Branch `codex/market-events` wurde als Remote-Branch `main` veröffentlicht und verfolgt `origin/main`. Weitere freigegebene Änderungen mit `git push origin HEAD:main` übertragen. Die öffentliche Sichtbarkeit wurde ausdrücklich bestätigt.

Die lokale `.env`, `data/`, `node_modules/` und `.artifacts/` sind in `.gitignore` ausgeschlossen und gehören nicht auf GitHub. Persönliche unversionierte Dateien wie `prompt.txt`, `Flyer.jpeg` und `Werbung_Clips/` nicht hinzufügen. Der Online-Markt verwendet separate Zugangsdaten und einen eigenen Speicherort.

## 2. Render vorbereiten

1. Bei [Render](https://dashboard.render.com/) anmelden, GitHub verbinden und Zugriff auf dieses Repository erlauben.
2. **New → Blueprint** auswählen, Repository und Branch `main` wählen. Die Datei `render.yaml` im Projektstamm verwenden.
3. Beim angeforderten `ADMIN_PASSWORD` das gewünschte Admin-Passwort eintragen. Render erzeugt `SESSION_SECRET` automatisch. Zugangsdaten nicht in GitHub-Dateien schreiben.
4. Vor **Apply/Create** den angezeigten Preis prüfen. Die Vorlage erstellt **einen kostenpflichtigen Web Service (0,5 CPU / 512 MB) in Frankfurt und eine dauerhafte 1-GB-Disk**. Der kostenlose Tarif unterstützt keine persistente Disk und verliert lokale Daten beim Neustart.
5. Erst nach Zustimmung zu den angezeigten Kosten den Dienst erstellen. Der Build installiert auch die benötigten Entwicklungswerkzeuge und baut Client und Server.

Die Vorlage veröffentlicht keine Ressourcen durch das bloße Speichern oder Hochladen nach GitHub. Automatische Deployments sind ausgeschaltet; Updates in Render bewusst mit **Manual Deploy → Deploy latest commit** ausführen. So startet ein neuer Commit den Server nicht mitten im Barabend neu.

## 3. Online-Adressen

Die tatsächliche Adresse wird von Render vergeben; es gibt noch keine bestätigte öffentliche URL. An die dort angezeigte Basisadresse anhängen:

- `/admin` — Börsensteuerung
- `/display` — Gästeanzeige
- `/bar-display` — Barteam-Preise
- `/health` — muss `{"status":"ok"}` zurückgeben

Der Startbefehl übernimmt Renders HTTPS-Adresse automatisch für den Schutz der Admin-Befehle und sichere Sitzungscookies. Bei einer eigenen Domain `PUBLIC_ORIGIN` in Render auf deren vollständige HTTPS-Adresse ohne abschließenden Schrägstrich setzen. Port und WebSocket-Verbindung übernimmt Render; keine localhost-Adresse auf den anderen Geräten verwenden.

## 4. Marktstand übernehmen und prüfen

Ohne Übernahme startet Render mit den Werkseinstellungen. Soll der aktuell vorbereitete lokale Markt erhalten bleiben, vor der Umschaltung die lokale Datei `data/market.json` sichern und als neue Datei `/var/data/imported-market.json` auf die Render-Disk übertragen. Dies separat über die geschützte Render-Shell durchführen, nicht über GitHub. Zum Übertragen den lokalen Markt pausieren. Anschließend `STATE_FILE` in Render auf `/var/data/imported-market.json` ändern und neu deployen; den Pfad auch in `render.yaml` nachziehen. Die aktive Marktdatei nicht im laufenden Betrieb überschreiben. Nach dem Neustart den übernommenen Online-Markt kontrollieren. Lokaler und Online-Server sind sonst zwei unabhängige Märkte.

Nach dem Deploy Admin-Anmeldung, eine Simulation mit Preiswechsel, eine manuelle Nachricht und die parallele Gäste-/Barteam-Anzeige auf zwei Geräten testen. Anschließend einen bewussten Neustart in Render durchführen und prüfen, dass Einstellungen und Preise erhalten bleiben. `/var/data` ist persistent; immer nur **eine** Serverinstanz für diese Datei betreiben. Während des Abends nicht deployen oder den Speicher löschen.

Render-Quellen: [Blueprint-Referenz](https://render.com/docs/blueprint-spec), [persistente Disks](https://render.com/docs/disks), [kostenloser Tarif](https://render.com/docs/free), [Preise](https://render.com/pricing).
