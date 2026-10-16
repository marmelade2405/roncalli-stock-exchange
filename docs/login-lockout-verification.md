# Anmeldesperre: 10 Fehlversuche, 1 Stunde

Stand: 16.10.2026.

Zehn falsche Passwörter innerhalb einer Stunde sperren die betreffende Client-Adresse für eine Stunde ab dem zehnten Fehlversuch. Der zehnte Fehler und alle gesperrten Anmeldungen liefern HTTP 429, Code `LOGIN_RATE_LIMITED` und `Retry-After`. Auch das richtige Passwort wird während der Sperre nicht akzeptiert. Zusätzliche Versuche verlängern die Sperre nicht. Erfolgreiche Anmeldungen vor dem Limit löschen den Fehlerzähler; vorhandene Sitzungen bleiben gültig.

Die Sperre verwendet echte Serverzeit, nicht die Markt-/Simulationszeit. Zähler liegen im einzelnen Serverprozess, laufen automatisch ab und sind auf höchstens 10.000 Einträge begrenzt. Bei ausgeschöpfter Kapazität werden zusätzliche Login-Adressen vorübergehend abgewiesen, statt Sperren zu verdrängen. Ein Serverneustart setzt die Zähler zurück.

Direktbetrieb verwendet die Socket-Adresse und ignoriert eingesendete Proxy-Header. Für Render setzt die Vorlage `LOGIN_IP_HEADER=cf-connecting-ip`; ein eigener vertrauenswürdiger Proxy kann `x-real-ip` verwenden. Der Proxy muss die Adresse selbst überschreiben und direkte Backend-Zugriffe verhindern. IPv4-mapped IPv6 und alternative IPv6-Schreibweisen werden normalisiert; IPv6-Adressen im selben /64 teilen das Limit. Ungeprüfte X-Forwarded-For-Ketten werden nicht akzeptiert.

## Verifikation

- 303 Domain-/Servertests in 57 Dateien bestanden.
- 15 Browserprüfungen für Admin und Anmeldesperre bestanden.
- Gezielte Prüfungen: zehnter Fehlversuch, richtiges Passwort während Sperre, exakt einstündige Freigabe, keine Verlängerung durch erneute Versuche, Rücksetzen nach Erfolg, bestehende Sitzung, parallele Login-Anfragen, getrennte Proxy-Adressen, IPv6-/64, gefälschte Header, falsche Origin, ungültige JSON-Eingaben und begrenzter Speicher.
- Sperrmeldung bleibt nach Neuladen wirksam; Browser-Screenshot `.artifacts/previews/login-hour-lock.png`.
- `npm run typecheck`, `npm run build` und `git diff --check`: erfolgreich.

Keine produktiven Zugangsdaten, Marktdaten oder Hosting-Ressourcen verändert. Render bleibt gekündigt.
