# Roncalli Stock Exchange

Getränkebörse für Barabende: variable Preise, Breaking News, Börsencrashs, Simulation und synchronisierte Gästeanzeigen.

## Setup

Benötigt: **Node.js 24**, Git und ein Browser.

```sh
git clone https://github.com/marmelade2405/roncalli-stock-exchange.git
cd roncalli-stock-exchange
npm ci
```

Bei der Ersteinrichtung `.env.example` nach `.env` kopieren und eigene Werte setzen:

- `ADMIN_PASSWORD`: mindestens 8 Zeichen
- `SESSION_SECRET`: zufälliger Schlüssel mit mindestens 32 Zeichen

Eine vorhandene `.env` behalten. Schlüssel erzeugen:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Starten

```sh
npm run build
npm start
```

Unter Windows bei Bedarf `npm.cmd` statt `npm` verwenden. Rechner und Terminal müssen weiterlaufen; beenden mit `Strg+C`.

| Ansicht | Adresse |
| --- | --- |
| Admin | [localhost:3000/admin](http://localhost:3000/admin) |
| Gäste | [localhost:3000/display](http://localhost:3000/display) |
| Barteam | [localhost:3000/bar-display](http://localhost:3000/bar-display) |

Im Admin einrichten, Simulation ausprobieren und **Markt starten**. Ton wird im Admin-Tab auf dem jeweiligen Gerät aktiviert.

## Hosting

- **Lokales Netzwerk:** Alle Geräte ins gleiche LAN/WLAN. `localhost` durch die IP des Serverrechners ersetzen, z. B. `192.168.1.20`. `HOST=0.0.0.0`, `PUBLIC_ORIGIN` leer; bei Bedarf Firewall-Port 3000 im privaten Netzwerk freigeben.
- **Render:** Eigenen GitHub-Fork verbinden → **New → Blueprint** → `render.yaml` auswählen → eigenes Admin-Passwort setzen → Kosten prüfen und deployen. Die Vorlage nutzt kostenpflichtigen Server und dauerhaften Speicher.
- **Eigener Server:** Node.js, HTTPS mit WebSocket-Unterstützung, dauerhafter Speicher und `PUBLIC_ORIGIN` mit eurer HTTPS-Adresse. Eine Serverinstanz pro Marktdatei.
- **GitHub Pages reicht nicht:** GitHub speichert den Code; die Anwendung braucht einen laufenden Node.js-Server.

## Daten & Sicherheit

Marktstand: `data/market.json`. Zugangsdaten: `.env`. Beides bleibt lokal und sollte vor Updates gesichert werden. Zehn falsche Anmeldungen führen zu einer Stunde Sperre pro Netzwerkadresse; Serverneustart setzt die Zähler zurück.

## Mehr Infos

[Bedienung](docs/operator-guide.md) · [Preislogik](docs/bar-price-list.md) · [Marktregler](docs/market-controls-guide.md) · [Hosting im Detail](docs/github-render-hosting.md)

Entwicklung: `npm run dev` · Prüfung: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Nach Änderungen am Client neu bauen.
