# Render-Hosting: live geprüft am 14.10.2026

- Öffentliche Basisadresse: https://roncalli-stock-exchange.onrender.com
- Admin: https://roncalli-stock-exchange.onrender.com/admin
- Gästeanzeige: https://roncalli-stock-exchange.onrender.com/display
- Barteam: https://roncalli-stock-exchange.onrender.com/bar-display
- GitHub: https://github.com/marmelade2405/roncalli-stock-exchange, Branch `main`.
- Veröffentlichtes Release: `f3fce191bdc6b6c07830880d2cc9c68454fc7acb`.
- Render-Service: `srv-db7tjlgn74is73e4sutg`, Blueprint `exs-db7th5vavr4c73du7fug`.
- Eine Node.js-Instanz in Frankfurt, Compute `0.5c-512mb`.
- Dauerhafte Disk: 1 GB, Mount `/var/data`, Marktdatei `/var/data/market.json`.
- Freigegebene Grundkosten: 7,25 USD/Monat, ggf. Steuern und Mehrverbrauch.
- Passwort direkt vom Nutzer in Render eingegeben, Session-Schlüssel von Render generiert. Beide bleiben außerhalb von GitHub.

## Tatsächlich geprüft

Render hat den Linux-Build erfolgreich ausgeführt und den Server auf Port 10000 gestartet. Die öffentliche HTTPS-Prüfung bestätigt:

- `/health` liefert HTTP 200 und `status: ok`.
- `/admin`, `/display`, `/bar-display` liefern HTTP 200 mit HTML.
- `/api/admin/state` verweigert nicht angemeldeten Zugriff mit HTTP 401.
- Öffentliche WebSocket-Verbindung über WSS empfängt einen gültigen Marktstand.
- Beide Einspieler-Videos liefern funktionierende Byte-Range-Antworten (HTTP 206).
- Öffentlicher Marktstand: 20 Getränke, Wasser 0 €, Phase `ready`.
- Gästeanzeige im Browser sichtbar geprüft; Screenshot unter `.artifacts/previews/roncalli-render-live.png`.

Die automatisierte Prüfung hat den Online-Markt nicht gestartet, keine Preise verändert und keine Nachrichten ausgelöst. Eine erfolgreiche Admin-Anmeldung wurde nicht automatisiert geprüft, weil das Online-Passwort vom Nutzer direkt eingegeben wurde.

## Betrieb

Der Laptop kann für den Online-Markt ausgeschaltet werden. Alle Geräte brauchen Internet und verwenden die obigen HTTPS-Adressen. Die Online-Instanz beginnt mit der Konfiguration im Quellcode und eigener Historie. Der bisherige lokale Markt in `data/market.json` ist separat und wurde nicht importiert.

Automatische Web-Service-Deployments sind deaktiviert. Updates bewusst im Render-Dashboard veröffentlichen; während des Barabends nicht deployen. Niemals die persistente Disk löschen oder mehrere Instanzen auf dieselbe Marktdatei zugreifen lassen.
