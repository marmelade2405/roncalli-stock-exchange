# Stock Market Exchange Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine im Browser bedienbare Getränkebörse mit verbindlichen Preisvorschauen, einmaligen manuellen Vorgaben, Crash und Erholung sowie zwei synchronen Gästeansichten umsetzen.

**Architecture:** Ein einzelner TypeScript-Server verwaltet Preise, Vorschauen und absolute Zeitpunkte. Eine unabhängig prüfbare Zustandsmaschine erzeugt Preisrunden; eine serialisierte Steuerung speichert Änderungen vor deren Veröffentlichung. Zwei Browseransichten verwenden getrennte öffentliche und authentifizierte Zustandskanäle.

**Tech Stack:** Node.js 24 LTS, TypeScript, natives Node-HTTP und `ws`, Vite für HTML/CSS/TypeScript, Vitest für Logik und Serverintegration, Playwright für Browserverhalten. Kein zusätzliches Frontendframework. Installierte Umgebung bei Planerstellung: Node 24.16.0 und npm 11.13.0.

**Spec:** [2026-10-07-stock-market-exchange-design.md](../specs/2026-10-07-stock-market-exchange-design.md), vom Nutzer am 08.10.2026 bestätigt.

## Global Constraints

- Normale Preisänderungen im Abstand von 30 Minuten, ohne Bindung an volle oder halbe Uhrzeiten.
- Normale manuelle Eingaben gelten für genau die nächste normale Preisrunde und werden anschließend geleert.
- Separate manuelle Crashpreise gelten für genau den nächsten manuell ausgelösten Crashstart und werden anschließend geleert.
- Nach der Erholungsrunde beginnt ein neuer vollständiger 30-Minuten-Timer.
- Während eines Crashs gibt es keine zusätzliche normale Preisrunde.
- Die sichtbare Preisänderung bezieht sich auf den zuletzt tatsächlich angezeigten Preis.
- In den letzten zehn Sekunden vor einer Preisänderung verdeckt eine Börsenanimation sämtliche Preise auf den Gästebildschirmen.
- Geldwerte werden intern in ganzen Cent verwaltet. Die Standardrundung beträgt 10 Cent.
- Verbindliche Dauern: Normalrunde `1_800_000 ms`, Crash `300_000 ms`, Übergang `10_000 ms`. Die Crashdauer beginnt mit Veröffentlichung der Crashpreise, nach der Einleitungsanimation.
- Preisziele: Normal `100 %`, Crash `90 %` mit doppelter normaler Schwankungsbreite, Erholung `110 %` mit normaler Schwankungsbreite. Grenzen und Rundung bleiben wirksam; manuelle Werte ersetzen das Zufallsergebnis.
- Startpreise und Grenzen für die acht Dummygetränke exakt aus Abschnitt 4 der Spezifikation übernehmen.
- Vorschauen werden gespeichert und beim Veröffentlichen nicht neu ausgewürfelt. Nach Crashstart ist die normale Zufallsvorschau bis zur Erholung ausgesetzt; normale manuelle Vorgaben bleiben erhalten.
- `/admin` ist passwortgeschützt; `/display` ist lesend. Unveröffentlichte Preise dürfen weder in öffentlichen HTTP-Antworten noch in öffentlichen WebSocket-Nachrichten stehen.
- Der Server ist die verbindliche Zeit- und Zustandsquelle. Nur eine schreibende Instanz und eine lokale JSON-Speicherdatei.
- Vorbereitungsparameter während des laufenden Markts sperren; manuelle Preise und gemeinsame Darstellungsart bleiben steuerbar.
- Projekttexte und Beträge auf Deutsch. Keine erfundenen Ausschankgrößen, keine Bestellungen oder Zahlungen.
- Auf Windows `npm.cmd` beziehungsweise `npx.cmd` verwenden. `prompt.txt` nicht verändern oder mit Aufgabenänderungen committen.
- Erst den Plan prüfen lassen und die Ausführungsart auswählen. Noch kein Produktcode, Projektgerüst oder Abhängigkeiten während der Planerstellung.

## Review Focus

1. Ein Crashknopf oder Preiseingaben genau zehn Sekunden vor dem Termin dürfen die bereits festgeschriebene Runde nicht verändern: Tests in Task 2 und Task 4.
2. Gleichzeitige Steuergeräte sowie verspätete Servernachrichten dürfen bestätigte Eingaben nicht überschreiben: Tests in Task 3 und Task 5.
3. Eine misslungene Speicherung darf weder Preise veröffentlichen noch einmalige Vorgaben verbrauchen; ein späterer Versuch darf den Wechsel nur einmal ausführen: Tests in Task 3.
4. Eine Gästeansicht im bereits als Admin angemeldeten Browser darf trotzdem keine Vorschauen erhalten: Test in Task 4.
5. Eine unterbrochene Verbindung während des Countdowns oder eine falsche Geräteuhr darf keine alten Preise über den Wechseltermin hinaus sichtbar lassen: Tests in Task 6.

## Dateien und gemeinsame Schnittstellen

Die Dateipfade sind relativ zum Projektordner. Jede Aufgabe nennt ihren vollständigen Änderungsumfang; die folgenden Typen und Funktionsnamen sind verbindlich zwischen den Aufgaben.

| Dateien | Aufgabe |
|---|---|
| `src/domain/types.ts`, `defaults.ts`, `prices.ts` | Geldwerte, Getränkekonfiguration und Preisberechnung |
| `src/domain/market.ts`, `snapshots.ts` | Marktübergänge und rollenabhängige Zustandssichten |
| `src/server/repository.ts`, `controller.ts` | Atomare Speicherung und serialisierte Bedienung |
| `src/server/config.ts`, `auth.ts`, `http.ts`, `realtime.ts`, `main.ts` | Serverstart, Zugriffsschutz, APIs und WebSocket-Verteilung |
| `src/client/shared/protocol.ts`, `connection.ts`, `clock.ts`, `format.ts`, `base.css` | Echtzeitverbindung, Serverzeit und gemeinsame Formatierung |
| `src/client/admin/index.html`, `main.ts`, `price-table.ts`, `settings.ts`, `admin.css` | Bedienoberfläche |
| `src/client/display/index.html`, `main.ts`, `view-model.ts`, `overview.ts`, `ticker.ts`, `transition.ts`, `display.css` | Gästeanzeigen und Wechselanimation |
| `tests/domain/`, `tests/server/`, `tests/client/`, `tests/e2e/` | Bedeutungsvolle Logik-, Integrations- und Browserprüfungen |
| `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` | Werkzeuge und reproduzierbarer Build |
| `.gitignore`, `.env.example`, `README.md`, `docs/operator-guide.md` | Lokale Konfiguration und Startanleitung |

### Typvertrag in `src/domain/types.ts`

- `Cents = number`: endliche ganze Centwerte, keine Fließkomma-Euro im Marktstand.
- `PriceMap = Record<string, Cents>`; `OverrideMap = Record<string, Cents | null>`; `Rng = () => number` mit Ergebnis `0 <= x < 1`.
- `DrinkConfig = { id: string; name: string; category: string; startCents: Cents; minCents: Cents; maxCents: Cents; amplitudeCents: Cents; stepCents: Cents }`.
- `RoundKind = 'normal' | 'crash' | 'recovery'`; `ViewMode = 'overview' | 'ticker'`.
- `Transition = { kind: RoundKind; publishAt: number; prices: PriceMap }` ist ausschließlich intern beziehungsweise für Admins sichtbar.
- `MarketState` enthält `schemaVersion: 1`, `revision: number`, `phase: 'ready' | 'normal' | 'crash' | 'transition'`, `drinks: DrinkConfig[]`, `prices: PriceMap`, `previousPrices: PriceMap | null`, `previews: { normal: PriceMap | null; crash: PriceMap | null; recovery: PriceMap | null }`, `overrides: { normal: OverrideMap; crash: OverrideMap }`, `deadline: number | null`, `transition: Transition | null`, `viewMode: ViewMode`, `viewEpoch: number`, `publishedAt: number` und `history: PublishedRound[]`.
- `PublishedRound = { revision: number; kind: RoundKind; publishedAt: number; prices: PriceMap }`; Historie auf die letzten 100 Veröffentlichungen begrenzen.
- `MarketCommand` ist eine Union: `{ type: 'start' }`, `{ type: 'crash' }`, `{ type: 'override'; scope: 'normal' | 'crash'; drinkId: string; value: Cents | null }`, `{ type: 'view'; mode: ViewMode }`, `{ type: 'configure'; drinks: DrinkConfig[] }`.
- `DomainError` besitzt einen maschinenlesbaren `code` und eine deutsche `message`; Codes sind `INVALID_INPUT`, `LOCKED`, `INVALID_PHASE` und `UNKNOWN_DRINK`.
- `DisplayState` enthält ausschließlich `revision`, `phase`, öffentliche Getränke `{ id, name, category }[]`, `prices`, `previousPrices`, `deadline`, `nextKind: RoundKind | null`, `publishedAt`, `viewMode`, `viewEpoch`. Keine Preisgrenzen, Vorgaben, Vorschauen oder internen Übergangspreise.
- `AdminState = DisplayState & { config: DrinkConfig[]; previews: MarketState['previews']; overrides: MarketState['overrides']; pendingPrices: PriceMap | null }`.
- `Snapshot<T> = { type: 'state'; serverNow: number; state: T }`; `CommandRequest = { expectedRevision: number; command: MarketCommand }`.

## Task 1: Preisberechnung und ausführbare Testgrundlage

**Files:** Create `package.json`, `.gitignore`, `tsconfig.json`, `tsconfig.server.json`, `vitest.config.ts`, `src/domain/types.ts`, `src/domain/defaults.ts`, `src/domain/prices.ts`, `tests/fixtures.ts`, `tests/domain/prices.test.ts`; generate `package-lock.json`.

**Interfaces:**
- Produces `DEFAULT_DRINKS: DrinkConfig[]`, `NORMAL_MS`, `CRASH_MS`, `TRANSITION_MS` in `defaults.ts`.
- Produces `randomPrice(drink: DrinkConfig, current: Cents, kind: RoundKind, rng: Rng): Cents`, `buildPreview(drinks: DrinkConfig[], prices: PriceMap, kind: RoundKind, rng: Rng): PriceMap`, `resolvePrices(preview: PriceMap, overrides: OverrideMap): PriceMap`, `validateDrinks(drinks: DrinkConfig[]): void`, `validateOverride(drink: DrinkConfig, value: Cents | null): void` in `prices.ts`.
- Test fixtures produce `makeDrink(overrides?: Partial<DrinkConfig>): DrinkConfig` with id `bier`, start `200`, min `100`, max `300`, amplitude `30`, step `10`; `midpointRng: Rng` always returns `0.5`.

- [x] **Step 1: Testgrundlage einrichten und fehlende Preislogik prüfen.** Minimalen ESM-TypeScript-Testaufbau erstellen. `ws` als Laufzeitpaket; `typescript`, `tsx`, `vite`, `vitest`, `@types/node`, `@types/ws`, `@playwright/test` als Entwicklungspakete installieren und Lockdatei erzeugen. Skripte: `test = vitest run`, `typecheck = tsc --noEmit`, später `build`, `start`, `dev`, `test:e2e`. Vitest nur auf `tests/domain/**/*.test.ts`, `tests/server/**/*.test.ts` und `tests/client/**/*.test.ts` anwenden; Playwright-Dateien unter `tests/e2e/` bleiben ausgeschlossen. `.env`, `data/`, `node_modules/`, `dist/`, Testberichte und Screenshots ignorieren; `.env.example` nicht ignorieren.
- [x] **Step 2: Fachliche Tests schreiben.** `normal_midpoint_keeps_200`, `crash_midpoint_is_180`, `recovery_from_140_is_150`, `crash_zero_rng_from_200_is_120`, `clamps_and_rounds`, `manual_price_replaces_preview`, `rejects_invalid_configuration_and_override`.

```ts
expect(randomPrice(makeDrink(), 200, 'crash', midpointRng)).toBe(180);
expect(randomPrice(makeDrink(), 140, 'recovery', midpointRng)).toBe(150);
expect(randomPrice(makeDrink(), 200, 'crash', () => 0)).toBe(120);
expect(resolvePrices({ bier: 180 }, { bier: 240 })).toEqual({ bier: 240 });
expect(() => validateOverride(makeDrink(), 205)).toThrow();
expect(() => validateOverride(makeDrink(), Number.NaN)).toThrow();
```

- [x] **Step 3: Rot prüfen.** `npm.cmd test -- tests/domain/prices.test.ts` muss wegen fehlender Preisfunktionen fehlschlagen, nicht wegen eines unbenutzbaren Testwerkzeugs.
- [x] **Step 4: Funktionen implementieren.** Abweichung `(rng() * 2 - 1) * amplitudeCents`, bei Crash doppelte Amplitude; Zielwert mit Faktor `1`, `0.9` oder `1.1`. Ergebnis auf `stepCents` runden, dann begrenzen. Validierung fordert mindestens ein Getränk, eindeutige IDs, nichtleere Namen, positive passende Schrittweite, endliche Ganzzahlen, `0 <= min <= start <= max` und nichtnegative Amplitude. Manuelle Werte müssen innerhalb der Grenzen liegen und ein Vielfaches der Schrittweite sein.
- [x] **Step 5: Grün prüfen.** Den Dateitest und `npm.cmd run typecheck` ausführen; alle genannten Fälle bestehen. Bestehende eigene Dateien erhalten.
- [x] **Step 6: Commit.** Nur die Dateien dieser Aufgabe vormerken; Commit `feat: add bounded drink price calculation`.

## Task 2: Markt, verbindliche Vorschauen und Zeitübergänge

**Files:** Create `src/domain/market.ts`, `src/domain/snapshots.ts`, `tests/domain/market.test.ts`, `tests/domain/snapshots.test.ts`; modify `src/domain/types.ts` nur zur Vervollständigung des Typvertrags.

**Interfaces:**
- Consumes Preisfunktionen und Konstanten aus Task 1.
- Produces `createMarket(drinks: DrinkConfig[], now: number, rng: Rng): MarketState`, `applyCommand(state: MarketState, command: MarketCommand, now: number, rng: Rng): MarketState`, `advanceMarket(state: MarketState, now: number, rng: Rng): MarketState` in `market.ts`.
- Produces `toDisplayState(state: MarketState): DisplayState`, `toAdminState(state: MarketState): AdminState` in `snapshots.ts`.
- Funktionen verändern den übergebenen Zustand nicht. `advanceMarket` liefert bei unverändertem Zustand denselben Stand ohne neue Revision oder neue Zufallsziehung.

- [x] **Step 1: Zustands- und Zeitgrenzentests schreiben.** Testfälle: `start_preserves_initial_prices`, `normal_round_consumes_only_normal_overrides`, `crash_discards_old_deadline`, `recovery_preserves_normal_override_and_restarts_timer`, `preview_is_not_redrawn_on_publication`, `locks_exactly_at_ten_seconds`, `rejects_second_crash`, `configuration_is_locked_after_start`, `view_switch_does_not_redraw_prices`, `public_projection_excludes_private_values`. RNG-Aufrufe zählen: Ansichtswechsel und manuelle Vorgaben erzeugen keine Ziehungen. Eine Veröffentlichung darf neue Folgevorschauen ziehen, aber veröffentlichte Preise müssen der vorher gespeicherten wirksamen Vorschau entsprechen.

```ts
const ready = createMarket([makeDrink()], 0, midpointRng);
const running = applyCommand(ready, { type: 'start' }, 0, midpointRng);
expect(running.deadline).toBe(1_800_000);
expect(advanceMarket(running, 1_789_999, midpointRng).phase).toBe('normal');
expect(advanceMarket(running, 1_790_000, midpointRng).phase).toBe('transition');
```

Weiteres Szenario im Test: normale Vorgabe `250`, Crashvorgabe `140`, Crashknopf bei `60_000`; Veröffentlichung bei `70_000`; Erholung bei `370_000` ergibt `150`; nächste normale Veröffentlichung bei `2_170_000` übernimmt `250`. Die Crashvorgabe ist ab `70_000` leer, die normale Vorgabe erst ab `2_170_000`.

- [x] **Step 2: Rot prüfen.** `npm.cmd test -- tests/domain/market.test.ts tests/domain/snapshots.test.ts`; fehlende Funktionen führen zum erwarteten Fehlschlag.
- [x] **Step 3: Zustandsmaschine implementieren.** Vorbereitung erzeugt normale und Crashvorschau. Normalübergang friert die aufgelösten Vorgaben zehn Sekunden vor dem Termin ein. Crashkommando friert die Crashvorschau ein, verwirft den normalen Termin und plant Veröffentlichung in zehn Sekunden. Crashveröffentlichung erzeugt sofort die Erholungsvorschau und plant deren Veröffentlichung in fünf Minuten. Erholung erzeugt normale und Crashvorschau neu; Timer jeweils ab tatsächlicher Veröffentlichung. Vorgaben ausschließlich nach erfolgreicher Verwendung entfernen. Ein weit überfälliger Aufruf veröffentlicht höchstens eine gespeicherte Runde und beginnt danach einen neuen Timer ab `now`.
- [x] **Step 4: Rollenprojektionen implementieren.** Öffentliche Felder ausdrücklich aufbauen, niemals den internen Zustand per Spread an Gäste schicken. Adminprojektion enthält die festgeschriebenen Übergangspreise. Vorschauen während einer unveränderten Runde stabil halten; normale Vorschau während Crash aussetzen. `previousPrices` vor jeder Veröffentlichung aus den zuletzt gültigen Preisen setzen.
- [x] **Step 5: Grün prüfen.** Beide Dateitests und alle Domain-Tests bestehen. Exakt am Animationsbeginn sind Änderungen an der unmittelbar anstehenden Runde und Crashauslösung gesperrt. Normale Eingaben dürfen während des Crashs für die nächste normale Runde gesetzt bleiben; Crashvorgaben sind während des Crashs nicht editierbar.
- [x] **Step 6: Commit.** `feat: implement market rounds crash and recovery`.

## Task 3: Dauerhafte Speicherung und serialisierte Steuerung

**Files:** Create `src/server/repository.ts`, `src/server/controller.ts`, `tests/server/repository.test.ts`, `tests/server/controller.test.ts`.

**Interfaces:**
- Consumes `MarketState`, `MarketCommand`, `Snapshot`, Domain-Funktionen und Projektionen.
- Produces `MarketRepository = { load(): Promise<MarketState | null>; save(state: MarketState): Promise<void> }`, `createRepository(filePath: string): MarketRepository`.
- Produces `createController(repository: MarketRepository, options: { now: () => number; rng: Rng; drinks: DrinkConfig[] }): Promise<MarketController>`.
- `MarketController` bietet `dispatch(command: MarketCommand, expectedRevision: number): Promise<Snapshot<AdminState>>`, `tick(): Promise<void>`, `publicSnapshot(): Snapshot<DisplayState>`, `adminSnapshot(): Snapshot<AdminState>`, `subscribe(listener: () => void): () => void`. `RevisionConflictError` kennzeichnet Konflikte; HTTP-Aufgabe übersetzt diesen in Status `409`.

- [x] **Step 1: Dauerhaftigkeits- und Konkurrenztests schreiben.** `reload_keeps_previews_and_overrides`, `failed_save_preserves_memory_and_inputs`, `two_commands_with_same_revision_only_one_succeeds`, `overdue_normal_round_is_recovered_once`, `expired_crash_publishes_saved_recovery_once`, `corrupt_file_is_not_replaced`, `subscriber_fires_only_after_save`. Dateien in einem temporären Testverzeichnis schreiben; Repositoryfehler beim Controllertest über einen Stub erzeugen.

```ts
const before = controller.adminSnapshot();
// repository.save wird für den nächsten Aufruf mit einem Schreibfehler ersetzt.
await expect(controller.dispatch({ type: 'crash' }, before.state.revision)).rejects.toThrow();
expect(controller.adminSnapshot()).toEqual(before);
// Zwei gleiche expectedRevision: genau ein erfülltes Ergebnis, ein Konflikt.
expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
```

- [x] **Step 2: Rot prüfen.** `npm.cmd test -- tests/server/repository.test.ts tests/server/controller.test.ts`.
- [x] **Step 3: Repository implementieren.** Datei nur bei `ENOENT` als noch nicht angelegt behandeln. Geladenes Schema inklusive Geldwerte, Drink-IDs, Karten, Vorschauen, Phasen und Zeitpunkte prüfen. Erst temporäre Datei im selben Verzeichnis vollständig schreiben, dann durch `rename` ersetzen. Beschädigte Daten oder I/O-Fehler melden, statt einen neuen Dummy-Markt darüber zu speichern.
- [x] **Step 4: Controller implementieren.** Timer und Bedienbefehle laufen durch eine gemeinsame Promise-Warteschlange, die nach einem Fehler weitere Arbeit zulässt. Fällige Übergänge vor Bedienbefehlen abgleichen; Revision erneut prüfen. Kandidaten zuerst speichern, danach Speicherzustand ersetzen und Listener benachrichtigen. Beim Start gespeicherten Stand übernehmen und maximal eine überfällige Veröffentlichung nachholen; existierende Vorschauen nicht neu berechnen.
- [x] **Step 5: Grün prüfen.** Beide Dateitests bestehen; nach Neustart bleiben gespeicherte Vorschauen und noch nicht verbrauchte manuelle Vorgaben erhalten. Fehlgeschlagene Veröffentlichung ist bei späterer erfolgreicher Speicherung genau einmal sichtbar.
- [x] **Step 6: Commit.** `feat: persist and serialize market changes`.

## Task 4: Server, Zugriffsschutz und getrennte Echtzeitkanäle

**Files:** Create `src/server/config.ts`, `src/server/auth.ts`, `src/server/http.ts`, `src/server/realtime.ts`, `src/server/main.ts`, `.env.example`, `tests/server/http.test.ts`, `tests/server/realtime.test.ts`; modify `package.json`, `tsconfig.server.json`.

**Interfaces:**
- Consumes `MarketController` aus Task 3.
- Produces `ServerConfig = { host: string; port: number; stateFile: string; adminPassword: string; sessionSecret: string; publicOrigin: string | null; secureCookies: boolean; clientDir: string }`, `readConfig(env: NodeJS.ProcessEnv): ServerConfig`.
- Produces `createAuth(config: Pick<ServerConfig, 'adminPassword' | 'sessionSecret' | 'secureCookies'>): AuthService`; `AuthService` bietet `login(password: string): string | null` als Set-Cookie-Header bei Erfolg beziehungsweise `null` bei falschem Passwort, `isAdmin(cookieHeader: string | undefined): boolean`, `clearCookie(): string` als Set-Cookie-Header zum Abmelden.
- Produces `createApplication(config: ServerConfig, controller: MarketController, now: () => number): { server: import('node:http').Server; close(): Promise<void> }`. `main.ts` startet diese Anwendung und ruft `controller.tick()` alle `250 ms` auf; es wird kein zweiter Timer für Preise eingeführt.
- HTTP: `GET /api/state` öffentliche Momentaufnahme; `GET /api/time` mit `{ serverNow }`; `GET /api/admin/state` geschützte Momentaufnahme; `POST /api/login` mit `{ password }`; `POST /api/logout`; `POST /api/admin/commands` mit `CommandRequest`; `GET /health` für Betriebsbereitschaft.
- WebSocket: `/ws/public` sendet immer `Snapshot<DisplayState>`, auch mit Admincookie; `/ws/admin` benötigt Adminsession und sendet `Snapshot<AdminState>`.

- [x] **Step 1: HTTP- und Sockettests schreiben.** `anonymous_mutation_is_401`, `invalid_input_is_400`, `invalid_phase_or_locked_command_is_409`, `stale_revision_is_409`, `failed_storage_is_503`, `foreign_origin_is_rejected`, `public_socket_with_admin_cookie_has_no_preview`, `two_displays_receive_same_revision`, `admin_socket_requires_session`, `static_path_cannot_escape_client_directory`. Echte HTTP- und Socketverbindungen auf einem temporären Port nutzen; Zeit über Controller-Clock injizieren.
- [x] **Step 2: Rot prüfen.** `npm.cmd test -- tests/server/http.test.ts tests/server/realtime.test.ts`.
- [x] **Step 3: Authentifizierung und Konfiguration implementieren.** Standard `HOST=0.0.0.0`, `PORT=3000`, `STATE_FILE=./data/market.json`; Passwort und Sessiongeheimnis aus lokaler Umgebung. Ohne diese Geheimnisse klaren Startfehler liefern; `.env.example` enthält leere Platzhalter und Erläuterung. Cookies `HttpOnly`, `SameSite=Strict`, für HTTPS zusätzlich `Secure`; Sessiongültigkeit zwölf Stunden. Geheimnisse niemals protokollieren. Mutierende Requests und Admin-Socket-Upgrades auf gleiche Origin beziehungsweise konfigurierte `PUBLIC_ORIGIN` prüfen.
- [x] **Step 4: HTTP und WebSockets implementieren.** Eingabeform, Bodygröße bis `64 KiB`, Kommandofelder und erwartete Revision prüfen. Deutsche Fehlerantwort `{ code, message }` liefern. Beim Connect sofort vollständigen aktuellen Stand senden, danach nur gespeicherte Zustandsänderungen verteilen. Socket-Ping/Pong erkennt getrennte Clients. Statische Dateien aus dem festgelegten Buildverzeichnis ausliefern; `/admin` und `/display` auf ihre jeweiligen HTML-Dateien führen. `main.ts` übernimmt sauberes Stoppen und schließt Timer, Server und Sockets.
- [x] **Step 5: Grün prüfen.** Integrationsprüfungen bestehen. Produktion enthält keine Testuhr-Endpunkte. Loginfehler, Gastzugriff und abgewiesene Befehle verändern keine Vorschauen oder Vorgaben.
- [x] **Step 6: Commit.** `feat: expose authenticated control and public market stream`.

## Task 5: Steueroberfläche mit echten Vorschauen und manuellen Vorgaben

**Files:** Create `vite.config.ts`, `playwright.config.ts`, `src/client/shared/protocol.ts`, `connection.ts`, `clock.ts`, `format.ts`, `base.css`, `src/client/admin/index.html`, `main.ts`, `price-table.ts`, `settings.ts`, `admin.css`, `tests/client/format.test.ts`, `tests/client/clock.test.ts`, `tests/e2e/harness.ts`, `fixtures.ts`, `admin.spec.ts`; modify `package.json`.

**Interfaces:**
- Consumes `Snapshot`, `AdminState`, `MarketCommand` und APIs aus Task 4; `protocol.ts` exportiert die browsergeeigneten gemeinsam genutzten Typen ohne Serverimplementierung.
- Produces `parseEuro(input: string): Cents | null`, `formatEuro(value: Cents): string`, `formatChange(current: Cents, previous: Cents | null): { euro: string; percent: string; direction: 'up' | 'down' | 'flat' }` in `format.ts`.
- Produces `createClock(): { sync(serverNow: number, requestStart: number, responseEnd: number): void; now(performanceNow: number): number }`; Methoden arbeiten mit `performance.now()`, nicht mit der Geräteuhr.
- Produces `connectMarket<T>(role: 'public' | 'admin', handlers: { onState(snapshot: Snapshot<T>): void; onConnection(connected: boolean): void }): { close(): void }`, `sendCommand(command: MarketCommand, expectedRevision: number): Promise<Snapshot<AdminState>>` und `syncServerClock(clock: ReturnType<typeof createClock>): Promise<void>` in `connection.ts`.
- Browser-Testfixtures bieten `testApp` mit `baseURL`, `advanceTo(timestamp: number): Promise<void>`, `restart(): Promise<void>`, `password` sowie deterministischen Drink- und RNG-Werten. Eine steuerbare Serveruhr gehört nur in `tests/e2e/harness.ts`; Produktion importiert diese Datei nicht.

- [x] **Step 1: UI-nahe Fachtests und Admin-Browsertests schreiben.** Zuerst die Browser-Testfixture und Playwright-Konfiguration mit einer startbaren Testserverinstanz einrichten; fehlende HTML-Dateien dürfen als HTTP-404 beantwortet werden, damit der anschließende Rotlauf am fehlenden Login scheitert. Dezimalkomma `2,30` und Dezimalpunkt `2.30` ergeben `230`, leere Eingabe ergibt `null`; unvollständige oder überpräzise Werte führen zu einem erklärenden Fehler statt zu stillschweigender Veränderung. `formatChange` zeigt bei fehlendem oder null Euro hohem vorherigen Preis keine Division durch null; die Prozentangabe ist dann „—“. Browsertests: `stored_preview_survives_reload`, `manual_entry_changes_effective_price`, `normal_and_crash_inputs_are_separate`, `round_clears_only_used_fields`, `conflict_preserves_unsaved_input`, `outdated_socket_message_is_ignored`, `configuration_is_locked_while_running`. Eingabe `205` Cent wird als ungültiger Zehn-Cent-Schritt sichtbar abgewiesen.
- [x] **Step 2: Rot prüfen.** `npm.cmd test -- tests/client/format.test.ts tests/client/clock.test.ts`. E2E-Runner konfigurieren und `npx.cmd playwright test tests/e2e/admin.spec.ts` ausführen; der fehlende Adminablauf schlägt als fachliche Assertion fehl. Falls nötig den Chromium-Testbrowser über Playwright installieren.
- [x] **Step 3: Build und gemeinsame Browsermodule implementieren.** Vite-Root `src/client`, zunächst HTML-Einstieg `admin/index.html`, Ausgabe `dist/client`; Task 6 ergänzt den zweiten Einstieg. Serverseitiger TypeScript-Build mit `rootDir=src` nach `dist/server`, inklusive gemeinsamer Domain-Typen. Skripte `build = vite build && tsc -p tsconfig.server.json`, `start = node --env-file=.env dist/server/server/main.js`, `dev = tsx --env-file=.env src/server/main.ts`, `test:e2e = playwright test`; Entwicklungsanwendung verwendet vorher gebaute Browserdateien. Initial und beim Reconnect Serverzeit per `/api/time` synchronisieren, danach alle 30 Sekunden; Mittelpunkt der Requestdauer zur Zeitkorrektur verwenden. Reconnect wartet `1`, `2`, dann höchstens `5` Sekunden. Nach älteren Revisionen kein Rücksprung der UI.
- [x] **Step 4: Adminoberfläche implementieren.** Login, Status und Countdown; getrennte Tabellen für normale Runde und nächsten Crash; Spalten aktuell, Zufall, manuell, wirksam und Veränderung; Übersicht des tatsächlichen durchschnittlichen Prozentwechsels. Eingaben beim Verlassen des Felds speichern, währenddessen sichtbar „Wird gespeichert“ anzeigen, erst nach Bestätigung „Gespeichert“. Draft, Fokus und Fehlermeldung bei Liveupdates erhalten. Während Crash Erholungsvorschau anzeigen und normale Zufallsvorschau als ausgesetzt kennzeichnen. Preisbereiche, Namen und Schwankungen nur in Vorbereitung bearbeitbar. Crashknopf und unmittelbar anstehende Eingaben im Übergang sperren. Darstellungswahl wirkt zentral. Namen ausschließlich als Text rendern.
- [x] **Step 5: Grün prüfen.** Unit- und Admin-Browsertests bestehen. Login, Vorschautabellen, Crashauslösung und Fehlerstatus zusätzlich im Browser prüfen; Handyansicht bei `390 × 844`, Tablet `768 × 1024`, Laptop `1440 × 900` verwenden.
- [x] **Step 6: Commit.** `feat: add admin preview and one-shot price controls`.

## Task 6: Börsenanzeigen, gemeinsamer Countdown und vollständige Preisverbergung

**Files:** Create `src/client/display/index.html`, `main.ts`, `view-model.ts`, `overview.ts`, `ticker.ts`, `transition.ts`, `display.css`, `tests/client/display-model.test.ts`, `tests/e2e/display.spec.ts`; modify `vite.config.ts` um den zweiten HTML-Einstieg; use gemeinsame Browsermodule und Testfixtures aus Task 5.

**Interfaces:**
- Consumes ausschließlich `Snapshot<DisplayState>`, Server-Clock und Formatierung aus Task 5.
- Produces `getDisplayModel(state: DisplayState, serverNow: number, connected: boolean): { showPrices: boolean; remainingMs: number | null; transitionKind: RoundKind | null; waitingForPublication: boolean }` in `view-model.ts`.
- Produces `renderOverview(container: HTMLElement, state: DisplayState): void`, `renderTicker(container: HTMLElement, state: DisplayState, serverNow: number): void`, `renderTransition(container: HTMLElement, kind: RoundKind, remainingMs: number): void`.

- [x] **Step 1: Anzeige- und Verbindungsgrenzentests schreiben.** `prices_hide_at_deadline_minus_10000`, `disconnected_display_stays_hidden_after_deadline`, `two_displays_share_prices_and_countdown`, `admin_mode_switch_updates_both_displays`, `transition_contains_no_visible_price_or_delta`, `ticker_duplicates_never_leak_old_prices`, `device_date_does_not_change_market_time`, `first_round_has_neutral_change`. Bekannte Deadline `1_800_000`: bei `1_789_999` Preise sichtbar, bei `1_790_000` verborgen; nach Deadline ohne neue Snapshotrevision weiter verborgen.
- [x] **Step 2: Rot prüfen.** `npm.cmd test -- tests/client/display-model.test.ts` und `npx.cmd playwright test tests/e2e/display.spec.ts`; Countdown-Grenze und tatsächliche Sichtbarkeit aller Preiszeilen prüfen.
- [x] **Step 3: Darstellung implementieren.** Dunkler Hintergrund, helle große Namen und Preise, grüne Aufwärts- und rote Abwärtspfeile, neutrale unveränderte Werte; Kopf mit Motto und nächster Änderung. Übersicht zeigt alle acht Getränke auf einem 16:9-Bildschirm gleichzeitig. Laufliste bewegt vollständige Zeilen von unten nach oben in wiederholter Folge; Laufposition aus Serverzeit minus `viewEpoch` berechnen. Standardzyklus für acht Getränke `48_000 ms`; keine unabhängigen CSS-Startzeiten auf den Geräten. Keine entfernten Fonts oder Medien, damit lokaler Betrieb ohne Internet funktioniert.
- [x] **Step 4: Animation und Wiederverbindung implementieren.** Während Übergang alle Preiscontainer einschließlich wiederholter Laufzeilen vollständig ausblenden. Preisfreie bildschirmfüllende Animation mit Countdown und Text „Neue Preisrunde“, „Börsencrash“ oder „Erholung“. Als nächster Preisstand gilt ausschließlich ein tatsächlich veröffentlichter Snapshot mit fortgeschriebenem `publishedAt`; ein reiner Ansichtswechsel erhöht zwar die Revision, ersetzt aber keine Preisveröffentlichung. Bei abgelaufener bekannter Deadline ohne empfangenen neuen Stand „Warte auf aktuelle Preise“ statt alter Preise anzeigen. Verbindungsstatus sichtbar kennzeichnen. Bewegtbild ohne schnelle Blinkeffekte; Preisverbergen bleibt auch bei reduzierter Bewegung aktiv.
- [x] **Step 5: Grün und visuell prüfen.** Tests bestehen. Beide Ansichten, Crash, Erholung und die Zehn-Sekunden-Animation bei `1920 × 1080` rendern und Screenshots prüfen. Auf vollständig in den Bildschirm gelaufenen Zeilen sind Namen, Preise und Veränderungen vollständig lesbar; kein seitliches Abschneiden von Beträgen. Das Ein- und Auslaufen am oberen und unteren Listenrand gehört zur Bewegung. Zwei Tabs auf dieselbe Darstellung und Revision prüfen.
- [x] **Step 6: Commit.** `feat: add synchronized market displays and price transitions`.

## Task 7: Vollständiger Abendablauf, Startanleitung und Auslieferung

**Files:** Create `README.md`, `docs/operator-guide.md`, `tests/e2e/evening.spec.ts`; modify `.env.example`, `package.json` nur falls für den verifizierten Start erforderlich. Testergebnisse unter ignoriertem `test-results/` speichern.

**Interfaces:**
- Consumes fertige Anwendung und Testfixtures aus Tasks 1–6.
- Produces einen nach Anleitung startbaren lokalen Server und nachvollziehbare Prüfergebnisse; kein neuer Preis- oder Zeitmechanismus.

- [x] **Step 1: Zusammenhängenden Abnahmetest schreiben.** `evening_flow_preserves_previews_and_resets_timer`: Admin anmelden, Markt starten, normale Vorgabe `250`, Crashvorgabe `140`, zwei Displays verbinden, Crash bei `60_000` auslösen. Bei `70_000` beide Displays `140` und geleerte Crashvorgabe; bei `360_000` keine Preise; bei `370_000` Erholung `150`, normale Vorgabe weiter `250`, nächste Deadline `2_170_000`; bei `2_170_000` normale Runde `250` und geleerte normale Vorgabe. Dazwischen Admin neu laden, Displayverbindung unterbrechen und Anwendung während Crash neu starten; gespeicherte Erholung und Vorschauen bleiben erhalten. Moduswechsel beide Richtungen einschließen.
- [x] **Step 2: Abnahmetest prüfen.** `npx.cmd playwright test tests/e2e/evening.spec.ts`; fehlende Verknüpfungen korrigieren, bis der gesamte Ablauf ohne reale Wartezeiten besteht.
- [x] **Step 3: Startanleitung schreiben.** Schritte für `npm.cmd ci`, `.env.example` nach `.env` kopieren, Passwort und Sessiongeheimnis lokal setzen, `npm.cmd run build`, `npm.cmd start`. `/admin` und `/display` sowie Zugriff über die lokale IPv4-Adresse erklären. Serverrechner muss für den Abend eingeschaltet bleiben; Gästeansichten können auf zwei Anzeigecomputern oder duplizierten Bildschirmen laufen. Windows-Firewall beziehungsweise WLAN-Client-Isolation bei Verbindungsproblemen erklären, ohne Einstellungen automatisch zu verändern. Vorschauen, bestätigte Eingaben, Crashablauf und Wiederverbinden beschreiben. Internetbetrieb benötigt einen persistenten Server und HTTPS/WSS; kein Hosting veröffentlichen.
- [x] **Step 4: Verbindliche Abschlussprüfung ausführen.** `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e`. Erfolgreiche Befehle und Testanzahlen aus tatsächlichem Output dokumentieren. Produktion zusätzlich mit `npm.cmd start` starten und `/health`, `/admin`, `/display` abrufen; unbekannte `/__test/*`-Routen müssen nicht verfügbar sein. Die lokalen Ausgabedateien enthalten keine Vorschauen in öffentlicher Kommunikation oder eingebetteten Beispieldaten.
- [x] **Step 5: Prüfergebnis anhand der Spezifikation bewerten.** Alle zwölf Abnahmekriterien zu den Domain-, Server-, Client- und Browsertests zuordnen. Restliche Browserdarstellung visuell prüfen. Korrekturen nur bei konkreten Fehlern vornehmen; bestandene Prüfungen ohne neue Änderungen nicht wiederholt ausführen.
- [x] **Step 6: Commit und Übergabe.** `docs: document operation and verify complete evening flow`. Nach frischer Schlussprüfung beziehungsweise der gewählten Reviewmethode Ergebnis mit Startbefehl und lokaler Vorschau übergeben. Keine Veröffentlichung oder Änderung fremder Dienste.

## Selbstprüfung und Abdeckung

| Spezifikation | Umsetzung und Prüfung |
|---|---|
| Preisgrenzen, Rundung und Tendenzen | Task 1; `prices.test.ts` |
| Verbindliche Vorschauen und einmalige Vorgaben | Task 2, Task 5; RNG-Zähler, Reload- und Eingabetests |
| Timer, fünf Minuten Crash und drei Preisphasen | Task 2, Task 7; kontrollierte Zeitgrenzen und Abendablauf |
| Speicherung, Konflikte und Wiederanlauf | Task 3; Repository- und Controllertests |
| Authentifizierung und Gastdaten | Task 4; echte HTTP-/Sockettests einschließlich Admincookie auf Gastkanal |
| Separate Steuerung, Countdown und Erholungsvorschau | Task 5; Browserprüfungen |
| Beide Gästevarianten, Preisänderung und Animation | Task 6; Sichtbarkeits- und Synchronisationstests plus Screenshots |
| Betrieb im LAN, Internetfähigkeit und Start | Task 7; Anleitung und Produktions-Smokecheck |

Die fünf zusätzlichen Review-Fälle sind jeweils mit einem konkreten Test abgedeckt. Die Aufgaben verwenden durchgängig denselben Typvertrag. Die erste Ausführung beginnt mit der Prüfung des Arbeitsverzeichnisses und gegebenenfalls einer isolierten Arbeitskopie gemäß `using-git-worktrees`; bereits vorhandene passende Arbeitskopien werden wiederverwendet.

## Ausführungswahl

Für diese sieben aufeinander aufbauenden Aufgaben ist die direkte Umsetzung durch den Hauptagenten in dieser Sitzung die Empfehlung: Änderungen an Typen, Zustand, API und Darstellung bleiben eng miteinander verbunden. Alternativ kann jede Aufgabe mit separatem Implementierungs- und Reviewagenten ausgeführt werden; das verursacht mehr Kontextaufwand.

Vor Umsetzung prüft der Nutzer diesen Plan und wählt direkte Ausführung oder Subagenten. Danach gilt der passende Ausführungsskill. Der bestehende Projektordner und die Spezifikation bleiben die Grundlage; externe Veröffentlichung gehört nicht zu dieser Übergabe.

## Geprüfte Werkzeugdokumentation

- [Vite: Getting Started](https://vite.dev/guide/): TypeScript ohne Frontendframework und mehrere HTML-Einstiege sind unterstützt.
- [Vitest: Getting Started](https://vitest.dev/guide/): einmaliger Testlauf über `vitest run`; die vorhandene Node-Version erfüllt die dokumentierte Anforderung.
- [ws: offizielle README](https://github.com/websockets/ws/blob/master/README.md): serverseitige WebSocket-Anbindung, getrennte Upgradepfade, Authentifizierung und Ping/Pong. Im Browser wird die native WebSocket-API verwendet.
- [Playwright: Clock](https://playwright.dev/docs/clock): kontrollierte Browserzeit und Timer; Clock vor Laden der zeitabhängigen Anwendung installieren. Eine Browser-Testuhr verändert keine Serverzeit, daher die separate Testfixture.
- [Node.js: Dateisystem](https://nodejs.org/api/fs.html): persistente Dateizugriffe und Ersetzung per `rename`; Schreibvorgänge werden durch die Anwendung serialisiert.
