# Stock Market Exchange Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende Getränkebörse um 20-Minuten-Runden, zehn Preisänderungen als Diagramm, 16 einmalige Breaking News, Sofortkorrekturen, Crash-Abbruch, eine gemeinsame Simulation und zwei Reset-Arten erweitern.

**Architecture:** Neue reine Fachmodule für Parameter, Verlauf, Nachrichtenplanung und Marktuhr werden zunächst unabhängig geprüft. Eine neue Zustandsmaschine integriert sie; anschließend ersetzt ein kontrollierter Schemawechsel die bestehende Backend-Integration. Die beiden Browseransichten verwenden denselben veröffentlichten Markt und dieselbe Serverzeitprojektion.

**Tech Stack:** Node.js 24, TypeScript, natives HTTP, `ws`, Vite, Vitest und Playwright mit installiertem Microsoft Edge auf Windows. SVG-Diagramme ohne neue Pakete.

**Spec:** [2026-10-08-stock-market-exchange-events-design.md](../specs/2026-10-08-stock-market-exchange-events-design.md), schriftlich am 08.10.2026 vom Nutzer bestätigt.

**Execution:** Inline/direkt im aktuellen Chat ist bereits gewählt. Keine Implementer-Subagents; eine frische unabhängige Schlussprüfung gemäß `executing-plans`.

## Global Constraints

- Normales Intervall `1_200_000 ms`; Crash `300_000 ms`; Wechselanimation und Breaking News jeweils `10_000 ms`; Abendplanung `18_000_000 ms`; Special-Mindestabstand/Sichtzeit `120_000 ms`.
- Crashtrend −10 %, Crashamplitude Faktor 2, Erholungstrend +10 %, Specialwirkung standardmäßig ±40 %. Alle Ergebnisse auf Getränkeschritt runden und begrenzen.
- Alle acht bisherigen Dummygetränke und deren Startpreise, Grenzen, Schritte und Amplituden übernehmen. Alle 16 Texte exakt aus Abschnitt 4 der Spezifikation.
- Normale Vorgaben und Crashvorgaben bleiben getrennt und werden ausschließlich nach ihrer erfolgreichen eigenen Veröffentlichung geleert.
- Special und Sofortkorrektur setzen den normalen Timer nicht zurück. Nach Erholung entsteht ein voller 20-Minuten-Timer.
- Während Übergängen keine Sofortkorrektur und keine weitere Nachricht. Während Crash/Erholung warten Specials. Normale Runden gewinnen Terminkollisionen.
- Keine Preiswerte, Deltas oder tatsächlichen Diagramme während preisfreier Übergänge. Breaking News nennen keine automatisch eingeblendeten zukünftigen Beträge.
- Je Getränk zehn Änderungen plus Ausgangspunkt anzeigen; mindestens 50 Änderungen plus Ausgangspunkt speichern. Gleiche Preise erzeugen keinen neuen Punkt.
- Normale geplante Vorschläge bleiben bei Einzeleingriffen erhalten; nur die relevante Crash-/Erholungsvorschau des geänderten Getränks aktualisieren.
- Simulation nutzt denselben Markt. Geschwindigkeiten 1/10/60/120; Übergänge 1×; explizite Pause 0×. Authentifizierung verwendet echte Zeit.
- Reset erhöht Revision, Marktlauf-ID und Zeitgeneration; niemals auf null zurücksetzen. Werkseinstellungen behalten Zugangsdaten.
- Geschäftsparameter sind in der Vorbereitung editierbar; aktive Steuereingriffe gemäß Spezifikation bleiben bedienbar. Netzwerk/Geheimnisse bleiben `.env`.
- Atomar speichern vor Veröffentlichung, inklusive Uhrsteuerung und Ereignisverbrauch. Eine schreibende Instanz pro Marktdatei.
- Schema-1-Datei vor erfolgreicher Schema-2-Umstellung sichern; vorhandene Sicherungen und beschädigte Dateien nicht überschreiben.
- Öffentliche Daten enthalten keine Vorschauen, Warteschlange oder zukünftigen Nachrichtentexte. Fünfsekündige Zustandsnachrichten, Veraltung nach 15 realen Sekunden.
- Bestehende Prüfung gegen verlorene Entwürfe, fehlgeschlagene Zeitabfrage und reduzierte Bewegung erhalten.
- Keine neuen Abhängigkeiten oder externe Veröffentlichung. `.env`, echte `data/`, `prompt.txt` und fremde Aufgabenverzeichnisse nicht in Git aufnehmen.
- Windows: `npm.cmd`; bei Playwright-RegExp mit `|` direkt `node node_modules/@playwright/test/cli.js` verwenden. Test- und Planprotokolle unter `.superpowers/sdd/2026-10-08-stock-market-exchange-events/`.
- Erst diesen Plan prüfen lassen; die frühere Wahl inline bleibt erhalten. Vorher nur Dokumentation, kein Produktcode oder Datenmigration.

## Review Focus

1. Ein Reset bei verspäteter HTTP-Antwort, WebSocket-Nachricht oder Zeitabfrage darf weder Preise noch Entwürfe aus dem vorherigen Abend wiederherstellen: Tests in Tasks 7, 8 und 10.
2. Bei 120× und einer Ereignisgrenze zwischen zwei Server-Ticks darf keine Einblendung übersprungen werden; explizite Pause und Anmeldung bleiben korrekt: Tests in Tasks 3 und 6.
3. Special am Preislimit, unveränderte Rundenergebnisse und mehrere Veröffentlichungen mit gleichem Zeitstempel dürfen keine erfundenen Verlaufspunkte oder falsche Deltas anderer Getränke erzeugen: Tests in Tasks 1 und 4.
4. Gleichzeitiges Umsortieren, Direktstart und fehlgeschlagene Veröffentlichung dürfen ein Special weder doppelt verwenden noch verlieren: Tests in Tasks 4, 6 und 9.
5. Migration nahe einem Übergang und ungültige neue Katalog-/Uhr-/Verlaufsdaten müssen Original und Sicherung bewahren; Erholung oder normale Vorgaben dürfen nicht neu ausgewürfelt werden: Tests in Task 5.

## Dateiverantwortung und gemeinsamer Typvertrag

Die Typen für Schema 2 werden zunächst in `src/domain/model.ts` definiert, damit Tasks 1–5 den bisherigen Markt nicht halb umstellen. Task 6 stellt die vorhandenen Importpfade auf diese Typen und Funktionen um.

| Dateien | Verantwortung |
| --- | --- |
| `src/domain/model.ts`, `parameters.ts`, `configuration.ts`, `news-catalog.ts`, `history.ts` | Schema-2-Typen, gültige Konfiguration, Texte und Preisverlauf |
| `src/domain/specials.ts`, `special-schedule.ts` | Einzelpreiswirkung und einmaliger verteilter Zeitplan |
| `src/domain/market-clock.ts` | Reine Server-Marktuhr und Simulationsgrenzen |
| `src/domain/market-v2.ts`, `projections-v2.ts` | Preiswechsel, Eingriffe, Reset und rollenabhängige Ansichten |
| `src/domain/legacy.ts`, `src/server/market-store.ts`, `atomic-file.ts` | Altformat, Validierung, Sicherung, Migration und atomare Datei |
| vorhandene `types.ts`, `market.ts`, `snapshots.ts`, `defaults.ts`, `prices.ts` | Kompatible gemeinsame Importpfade, Preislogik und Umstellung |
| vorhandene Serverdateien | Serialisierte Integration, echte Zeit für Auth, neue Befehle und Zustandsheartbeat |
| gemeinsame Clientdateien | Skalierte Serverzeit, Generationen, Verbindungsfrische |
| Admin `settings.ts`, `price-table.ts`, `instant-price.ts`, `special-queue.ts`, `simulation-panel.ts`, `reset-dialog.ts`, `main.ts`, HTML/CSS | Konfiguration, sichere Eingaben und neue Bedienbereiche |
| Anzeige `chart.ts`, `breaking-news.ts`, vorhandene Anzeige-Dateien | Verlauf, größere Deltas, Nachrichten, Simulation und Ausblendung |
| `tests/domain`, `tests/server`, `tests/client`, `tests/e2e` | Verhalten, Fehlerfälle und vollständige Generalprobe |

### Verbindliche Namen in `model.ts`

- `MarketParameters = { normalMs, crashMs, transitionMs, newsMs, eveningMs, minSpecialGapMs, crashTrendPercent, recoveryTrendPercent, crashAmplitudeFactor, historyChanges, tickerRowMs }`; sämtliche Felder `number`, Dauern ganze Millisekunden aus ganzen Sekunden.
- `SpecialDefinition = { id: string; drinkId: string; direction: 'up' | 'down'; percent: number; headline: string; body: string }`.
- `PreparedConfig = { drinks: DrinkConfig[]; parameters: MarketParameters; specials: SpecialDefinition[]; specialOrder: string[] }`.
- `PriceEventKind = 'start' | 'normal' | 'crash' | 'recovery' | 'special' | 'correction'`; `PricePoint = { at: number; price: Cents; kind: PriceEventKind; revision: number }`; `PriceHistories = Record<string, PricePoint[]>`.
- `RoundKind = 'normal' | 'crash' | 'recovery' | 'special'`; `RandomRoundKind = Exclude<RoundKind, 'special'>`; `PublishedRound = { revision: number; kind: Exclude<PriceEventKind, 'start'>; publishedAt: number; prices: PriceMap }`. Zufallsfunktionen nehmen ausschließlich `RandomRoundKind`; `DisplayState.nextKind` ist `RoundKind | null`.
- `MarketClockState = { mode: 'live' | 'simulation'; speed: 1 | 10 | 60 | 120; paused: boolean; rate: 0 | 1 | 10 | 60 | 120; marketAnchor: number; wallAnchor: number; generation: number }`.
- `ClockSnapshot = Pick<MarketClockState, 'mode' | 'speed' | 'paused' | 'rate' | 'generation'> & { marketNow: number; sampledAt: number; ceilingAt: number | null }`; `TimeSnapshot = { serverNow: number; clock: ClockSnapshot }`. `serverNow` und `sampledAt` sind echte Serverzeit; `marketNow` ist Marktzeit.
- `SpecialSlot = { specialId: string; offsetMs: number }`; `SpecialSchedule = { startedAt: number | null; pending: SpecialSlot[]; done: (SpecialSlot & { publishedAt: number })[]; lastSpecialAt: number | null }`. Vor Start werden gespeicherte relative Plätze angezeigt; Marktstart verankert sie ohne erneutes Würfeln. Dadurch entsprechen die sichtbaren relativen Termine später den echten Terminen.
- Schema-2-`MarketState` enthält `schemaVersion: 2`, `revision`, `runId`, sämtliche `PreparedConfig`-Felder, bestehende `phase`, `prices`, `previews`, `overrides`, `deadline`, `viewMode`, `viewEpoch`, `publishedAt`, `history`, zusätzlich `historyByDrink`, `clock`, `schedule` und `transition`.
- `previousPrices: Record<string, Cents | null>` enthält pro Getränk die letzte tatsächliche Änderungsbasis; am Anfang überall `null`.
- `Transition` enthält `kind: 'normal' | 'crash' | 'recovery' | 'special'`, `publishAt`, `prices`, `normalDeadline: number | null`, optional `specialId` und `interruptedNormalPreview: PriceMap`. Bei Special ist `deadline` die Nachrichtenveröffentlichung; `normalDeadline` bleibt der erhaltene reguläre Termin.
- `MarketContext = { wallNow: number; marketNow: number }` trennt Echtzeit und Fachzeit.
- `MarketCommand` behält `start`, `crash`, `override`, `view`; `configure` erhält `PreparedConfig`. Ergänzungen: `{ type: 'correct'; drinkId; value }`, `{ type: 'special'; specialId }`, `{ type: 'reorder-specials'; ids: string[] }`, `{ type: 'cancel-crash' }`, `{ type: 'reset'; kind: 'evening' | 'factory' }`, `{ type: 'simulation'; enabled: boolean; speed?: 1 | 10 | 60 | 120 }`, `{ type: 'pause'; paused: boolean }`, `{ type: 'step' }`.
- `DisplayState` enthält bestehende veröffentlichte Felder, `runId`, per-Getränk-`previousPrices`, angezeigte `historyByDrink`, `nextNormalAt`, `hideAt`, `parameters: Pick<MarketParameters, 'transitionMs' | 'newsMs' | 'historyChanges' | 'tickerRowMs'>`, `news: Pick<SpecialDefinition, 'id' | 'drinkId' | 'direction' | 'headline' | 'body'> | null`. Keine Nachrichten-Prozentwirkung oder zukünftigen Beträge.
- `AdminState` ergänzt `config: DrinkConfig[]`, vollständige `parameters`, `specials`, `specialOrder`, `schedule`, `specialPreviews: Record<string, SpecialPreview>`, bestehende `previews`, `overrides`, `pendingPrices`.
- `SpecialPreview = { price: Cents; delta: Cents; percent: number; limited: boolean }`; `Snapshot<T> = TimeSnapshot & { type: 'state'; state: T }`.

## Task 1: Schema-2-Grundlagen, Parameter, Texte und Verlauf

**Files:** Create `src/domain/model.ts`, `parameters.ts`, `configuration.ts`, `news-catalog.ts`, `history.ts`, `tests/v2-fixtures.ts`, `tests/domain/configuration.test.ts`, `tests/domain/history.test.ts`. Bestehende Fachprimitive aus `types.ts` wiederverwenden.

**Interfaces:** Produces `DEFAULT_PARAMETERS`, `createDefaultConfiguration(drinks?: DrinkConfig[], rng?: Rng): PreparedConfig`, `validateConfiguration(config: PreparedConfig): void`, `createSpecialCatalog(drinks: DrinkConfig[]): SpecialDefinition[]`, `initialHistory(prices: PriceMap, at: number, revision: number): PriceHistories`, `recordChanges(history: PriceHistories, before: PriceMap, after: PriceMap, at: number, kind: PriceEventKind, revision: number): PriceHistories`, `visibleHistory(points: PricePoint[], changes: number): PricePoint[]`. Standard für optionale Getränke ist `DEFAULT_DRINKS`. Fixtures produce `makeConfiguration(drinks?: DrinkConfig[]): PreparedConfig` mit `midpointRng` und `context(time: number): MarketContext` mit gleicher Echt-/Marktzeit.

- [ ] **Step 1: Failing tests schreiben.** `default_parameters_are_exact`, `catalog_has_two_opposite_specials_per_drink`, `invalid_parameters_and_catalog_are_rejected`, `history_records_only_changed_drink`, `same_timestamp_keeps_publication_order`, `ten_changes_have_eleven_points`, `storage_keeps_fifty_changes`.

```ts
expect(DEFAULT_PARAMETERS).toMatchObject({ normalMs: 1_200_000, crashMs: 300_000, newsMs: 10_000, historyChanges: 10 });
expect(createSpecialCatalog(DEFAULT_DRINKS)).toHaveLength(16);
expect(recordChanges(initialHistory({ bier: 200, cola: 150 }, 0, 0), { bier: 200, cola: 150 }, { bier: 250, cola: 150 }, 1000, 'correction', 1).cola).toHaveLength(1);
expect(visibleHistory(elevenPoints, 10)).toHaveLength(11);
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/domain/configuration.test.ts tests/domain/history.test.ts`; Expected: neue fachliche Assertions schlagen fehl, die bisherigen Tests bleiben verwendbar.
- [ ] **Step 3: Primitive implementieren.** Standardtexte aus Spec übernehmen. Katalog-IDs `${drink.id}-up`/`${drink.id}-down`; genau ein Paar je Getränk. IDs eindeutig, Reihenfolge eine vollständige Permutation, Texte nicht leer, Überschrift höchstens 160 und Begründung höchstens 500 Zeichen. Grenzen und Zeitkombinationen aus Spec validieren. Verlauf unverändert lassen, wenn Preis gleich; ansonsten neuen Punkt anhängen und auf 51 begrenzen.
- [ ] **Step 4: Grün prüfen.** Dateitests, `npm.cmd test`, `npm.cmd run typecheck`; Expected: alle ausgeführten Assertions bestehen, Exit 0.
- [ ] **Step 5: Commit.** Nur Taskdateien; `feat: define configurable market history and news catalog`.

## Task 2: Specialpreise und verteilte einmalige Zeitplätze

**Files:** Create `src/domain/specials.ts`, `special-schedule.ts`, `tests/domain/specials.test.ts`, `tests/domain/special-schedule.test.ts`; modify `configuration.ts` für Planbarkeitsvalidierung.

**Interfaces:** Consumes Task-1-Typen/Parameter. Produces `previewSpecial(drink: DrinkConfig, current: Cents, special: SpecialDefinition): SpecialPreview`, `createSpecialSchedule(order: string[], parameters: MarketParameters, rng: Rng): SpecialSchedule`, `reorderSpecials(schedule: SpecialSchedule, ids: string[], activeId: string | null): SpecialSchedule`, `consumeSpecial(schedule: SpecialSchedule, specialId: string, publishedAt: number): SpecialSchedule`, `nextSpecialAt(schedule: SpecialSchedule, parameters: MarketParameters, normalDeadline: number | null, publishedAt: number): number | null`, `assertSchedulePossible(parameters: MarketParameters, count: number): void`.

- [ ] **Step 1: Failing tests schreiben.** `special_percent_is_rounded_and_bounded`, `schedule_is_reproducible_and_distributed`, `all_sixteen_slots_fit_evening`, `reorder_keeps_offsets`, `direct_consumption_removes_only_selected_slot`, `duplicate_and_active_reorders_rejected`, `collision_waits_until_after_regular_round`, `unplannable_configuration_rejected`.

```ts
expect(previewSpecial(makeDrink(), 200, beerDown)).toMatchObject({ price: 120, delta: -80 });
expect(previewSpecial(makeDrink(), 300, beerUp)).toMatchObject({ price: 300, delta: 0, limited: true });
expect(schedule.pending).toHaveLength(16);
expect(new Set(schedule.pending.map(x => x.specialId)).size).toBe(16);
expect(schedule.pending.every(x => x.offsetMs > 0 && x.offsetMs < 18_000_000)).toBe(true);
expect(reordered.pending.map(x => x.offsetMs)).toEqual(schedule.pending.map(x => x.offsetMs));
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/domain/specials.test.ts tests/domain/special-schedule.test.ts`; Expected: neue Funktionen/Fachassertions fehlen.
- [ ] **Step 3: Planung implementieren.** Reserve `min(normalMs, eveningMs / 10)`; verfügbare Starts schließen normale Übergänge und erforderliche Sichtzeit aus. Verteilungsbereiche gleichmäßig über verfügbare Marktzeit bilden, innerhalb des mittleren Bereichsteils zufällig wählen, Reihenfolge strikt steigend halten und Mindestabstand gewährleisten. Nur planbare Konfigurationen annehmen. Direkter Verbrauch entfernt Platz mit derselben ID; kein Neuauswürfeln restlicher Plätze. Automatischer nächster Termin berücksichtigt zuletzt veröffentlichten normalen/Erholungsstand und Specialabstand; manueller Start braucht Nachrichtendauer + regulären Übergang + eine Sekunde Platz.
- [ ] **Step 4: Grün prüfen.** Dateitests und gesamte Unit-Suite, Typprüfung; Expected: Exit 0, sämtliche benannten Fälle bestehen.
- [ ] **Step 5: Commit.** `feat: schedule single-use breaking news across the evening`.

## Task 3: Reine gemeinsame Markt- und Simulationsuhr

**Files:** Create `src/domain/market-clock.ts`, `tests/domain/market-clock.test.ts`.

**Interfaces:** Produces `createMarketClock(wallNow: number): MarketClockState`, `readMarketTime(clock: MarketClockState, wallNow: number): number`, `projectClock(clock: MarketClockState, wallNow: number, ceilingAt: number | null): ClockSnapshot`, `rebaseClock(clock: MarketClockState, wallNow: number, marketNow: number, patch: Partial<Pick<MarketClockState, 'mode' | 'speed' | 'paused' | 'rate'>>): MarketClockState`, `advanceClock(clock: MarketClockState, wallNow: number, boundary: number | null): { clock: MarketClockState; marketNow: number; reachedBoundary: boolean }`, `restoreClock(clock: MarketClockState, wallNow: number): MarketClockState`.

- [ ] **Step 1: Failing tests schreiben.** `live_clock_uses_real_monotonic_time`, `sixty_times_scales_elapsed_time`, `pause_does_not_advance`, `one_twenty_times_stops_exactly_at_boundary`, `transition_rate_is_one`, `generation_increases_on_jump`, `restart_simulation_pauses_saved_anchor`.

```ts
expect(readMarketTime(simulation60AtZero, 1000)).toBe(60_000);
expect(readMarketTime(pausedAt1200, 900_000)).toBe(1200);
expect(advanceClock(simulation120AtZero, 250, 12_345).marketNow).toBe(12_345);
expect(restoreClock(simulation60AtZero, 18_000_000)).toMatchObject({ paused: true, rate: 0, marketAnchor: 0 });
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/domain/market-clock.test.ts`; Expected: neue Uhrassertions schlagen fehl.
- [ ] **Step 3: Uhr implementieren.** Anker plus nichtnegative echte Zeitdifferenz mal Rate; kein Sprung über bekannte Grenze. Umankerung erhöht Generation. Live immer 1×, explizite Pause 0×, Simulation-Übergang 1×. Wiederanlauf einer Simulation verwendet gespeicherten Marktanker und pausiert; echte Downtime nicht hineinmultiplizieren.
- [ ] **Step 4: Grün prüfen.** Dateitest, ganze Unit-Suite, Typprüfung; Expected: Exit 0.
- [ ] **Step 5: Commit.** `feat: add bounded shared simulation clock`.

## Task 4: Neue Marktlogik mit Einzeleingriffen, Abbruch und Reset

**Files:** Create `src/domain/market-v2.ts`, `projections-v2.ts`, `tests/domain/market-v2.test.ts`, `tests/domain/projections-v2.test.ts`; modify `prices.ts` für optionalen Parametervertrag und `tests/v2-fixtures.ts`.

**Interfaces:** Consumes Tasks 1–3. Produces `createMarket(config: PreparedConfig, wallNow: number, rng: Rng): MarketState`, `applyCommand(state: MarketState, command: MarketCommand, time: MarketContext, rng: Rng): MarketState`, `advanceMarket(state: MarketState, time: MarketContext, rng: Rng): MarketState`, `nextBoundary(state: MarketState): number | null`, `toDisplayState(state: MarketState): DisplayState`, `toAdminState(state: MarketState): AdminState`. Extend `randomPrice(..., parameters?: MarketParameters)` und `buildPreview(..., parameters?: MarketParameters)`, alte vier Argumente bleiben bis Task 6 gültig. Fixture `liveMarket(config?: PreparedConfig): MarketState` erstellt Markt und startet bei Zeit 0.

- [ ] **Step 1: Failing tests schreiben.** `normal_round_is_twenty_minutes`, `correction_preserves_deadline_and_override`, `correction_changes_only_affected_forecast_and_basis`, `unchanged_price_does_not_add_history`, `special_freezes_then_changes_one_drink`, `special_preserves_normal_preview_and_override`, `failed_candidate_does_not_consume_slot`, `normal_transition_wins_collision`, `crash_defers_special`, `cancel_crash_uses_saved_recovery`, `cancel_crash_intro_keeps_overrides`, `reset_keeps_or_restores_configuration`, `reset_stops_pending_event_and_increases_ids`, `public_projection_excludes_future_news_and_prices`.

```ts
expect(liveMarket().deadline).toBe(1_200_000);
expect(corrected.deadline).toBe(before.deadline);
expect(corrected.overrides.normal).toEqual(before.overrides.normal);
expect(corrected.historyByDrink.cola).toEqual(before.historyByDrink.cola);
expect(newsStarted.transition).toMatchObject({ kind: 'special', publishAt: 70_000, normalDeadline: 1_200_000 });
expect(newsPublished.prices).toMatchObject({ bier: 120, cola: 150 });
expect(abortRecovery.deadline).toBe(abortRecovery.publishedAt + 1_200_000);
expect(reset.runId).toBe(before.runId + 1);
expect(reset.revision).toBeGreaterThan(before.revision);
expect(reset.clock.generation).toBeGreaterThan(before.clock.generation);
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/domain/market-v2.test.ts tests/domain/projections-v2.test.ts`; Expected: alle neuen Verhaltensgruppen zunächst fachlich rot.
- [ ] **Step 3: Zustandsmaschine implementieren.** Wiederverwendbare Veröffentlichung aktualisiert nur geänderte Getränkebasis/-historie. Übergangspreise sind festgeschrieben. Special reserviert ID bis Preisveröffentlichung, stellt normalen Termin wieder her und verbraucht genau seinen Platz. Umsortieren verändert auch die konfigurierte Reihenfolge: offene IDs in deren bisherigen Katalogpositionen ersetzen, erledigte IDs dort belassen. Somit stellt Abendreset die bearbeitete vollständige Reihenfolge wieder her. Crash-Einleitung sichert normale Vorschau für Abbruch. Aktiver Abbruch startet gespeicherte Erholung; Introabbruch stellt Vorschau wieder her mit neuem 20-Minuten-Timer. Reset setzt Inhalt, erhöht IDs und stellt Echtzeit/Vorbereitung her. Simulation-Uhrbefehle sind ebenfalls reine Zustandsänderungen mit Übergangsrate und Grenzen.
- [ ] **Step 4: Projektionen implementieren.** Öffentliche Diagramme auf `historyChanges + 1` begrenzen, Nachricht nur aktuell laufend und ohne Wirkung/Preis. `hideAt` ist die nächste bekannte Ausblendgrenze, auch für automatische Nachricht ohne Preis-/Textvorschau. Admin erhält vollständige Warteschlange und aktuelle Specialberechnungen. Ein später Wiederanlauf verarbeitet höchstens einen Preiswechsel; Special über altem normalem Termin erhält neuen normalen Timer.
- [ ] **Step 5: Grün prüfen.** Ganze Unit-Suite und Typprüfung; Expected: Task-4-Fälle sowie alte unabhängige Module bestehen.
- [ ] **Step 6: Commit.** `feat: integrate market news corrections crash cancellation and resets`.

## Task 5: Schema-2-Speicherung mit gesicherter Migration

**Files:** Create `src/domain/legacy.ts`, `src/server/market-store.ts`, `atomic-file.ts`, `tests/server/market-store.test.ts`, `tests/fixtures/schema-v1.json`.

**Interfaces:** Consumes Model/Engine. Produces `MarketStore = { load(): Promise<MarketState | null>; save(state: MarketState): Promise<void> }`, `createMarketStore(path: string, options?: { write?: typeof writeAtomic; now?: () => number; rng?: Rng }): MarketStore`, `writeAtomic(path: string, text: string): Promise<void>`, `validateStoredMarket(value: unknown): asserts value is MarketState`, `migrateLegacy(state: LegacyMarketState, wallNow: number, rng: Rng): MarketState`. Legacytypen sind explizit Schema 1 und importieren keine späteren Alias-Marktstände.

- [ ] **Step 1: Failing tests schreiben.** `reload_preserves_schedule_history_and_simulation`, `migration_keeps_prices_previews_and_override`, `migration_preserves_old_deadline_until_publication`, `legacy_backup_is_exact_and_not_overwritten`, `migration_write_failure_keeps_original`, `invalid_catalog_clock_or_history_is_not_overwritten`, `migration_near_transition_does_not_redraw_prices`.

```ts
expect(migrated).toMatchObject({ schemaVersion: 2, prices: legacy.prices, previews: legacy.previews, overrides: legacy.overrides, deadline: legacy.deadline });
expect(await readFile(backupPath, 'utf8')).toBe(originalText);
expect(await readFile(path, 'utf8')).toBe(originalText); // after injected migration write failure
expect(loaded.schedule).toEqual(saved.schedule);
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/server/market-store.test.ts`; Expected: fehlende Migration/Sicherung und Schema-2-Verhalten rot.
- [ ] **Step 3: Speicherung implementieren.** Bisherige atomare Dateischritte in `writeAtomic` übernehmen. Schema 2 vollständig validieren: Preis-/ID-Mengen, Vorzeichen, Zeit/Generation, Phasen-/Vorschaukonsistenz, aktive Nachricht, offene/erledigte Plätze, Historiereihenfolge und Begrenzung. Sicherung `market.json.v1-backup` exklusiv anlegen; existiert sie, neuen nummerierten Sicherungsnamen exklusiv verwenden. Vor dem Ersetzen Originalbytefolge sichern. Ungültige Dateien unverändert lassen.
- [ ] **Step 4: Migration implementieren.** Altformat separat validieren; nur nachgewiesene veröffentlichte Punkte rekonstruieren. Aktive Alttermine und Vorschauen unverändert übernehmen, neue Parameter ab nächster Runde. Noch nicht begonnener Markt erhält relative Specialplätze; laufender Markt deren Basis am Migrationszeitpunkt. Alte Crash-Einleitung besitzt keine normale Vorschau mehr: Abbruch bekommt einmalig eine gespeicherte normale Vorschau aus den unveränderten aktuellen Preisen, ohne vorhandene Crash-/Erholungswerte neu zu würfeln.
- [ ] **Step 5: Grün prüfen.** Dateitest, Unit-Suite, Typprüfung; Expected: Exit 0 und alle Original-/Backupassertions bestehen.
- [ ] **Step 6: Commit.** `feat: migrate persisted markets with original-state backups`.

## Task 6: Backend umstellen, Befehle schützen und Zeit veröffentlichen

**Files:** Modify `src/domain/types.ts`, `market.ts`, `snapshots.ts`, `defaults.ts`, `src/server/repository.ts`, `controller.ts`, `http.ts`, `realtime.ts`, `main.ts`, vorhandene Domain-/Servertests und Fixtures; create `tests/server/simulation.test.ts`, `tests/server/news.test.ts`.

**Interfaces:** Gemeinsame Importpfade exportieren nun Model/Engine/Projektionen; Legacytypen bleiben separat. `createRepository = createMarketStore`, `MarketRepository = MarketStore`. `createController(repository, options: { now: () => number; rng: Rng; drinks: DrinkConfig[] }): Promise<MarketController>` bleibt als Integrationssignatur erhalten. Controller ergänzt `timeSnapshot(): TimeSnapshot`; Snapshotmethoden liefern Uhrmetadaten. `now()` bedeutet echte monotone Serverzeit, Domainaufrufe bekommen `MarketContext`. `createApplication(..., now)` behält echte Zeit.

- [ ] **Step 1: Failing Integrationstests schreiben.** `unauthenticated_new_commands_are_rejected`, `invalid_new_commands_are_rejected`, `special_publish_failure_keeps_one_use_slot`, `concurrent_direct_special_runs_once`, `concurrent_reorder_cannot_drop_slot`, `simulation_boundary_between_ticks_shows_full_transition`, `simulation_five_hours_does_not_expire_login`, `heartbeat_contains_only_public_projection`, `simulation_restart_pauses_durable_anchor`, `reset_revision_reaches_connected_displays`.

```ts
expect((await app.command({ type: 'correct', drinkId: 'bier', value: 250 }, revision, '')).status).toBe(401);
expect((await app.command({ type: 'correct', drinkId: 'bier', value: 205 }, revision, cookie)).status).toBe(400);
expect(failedPublish.state.schedule.pending).toContainEqual(selectedSlot);
expect(concurrentResults.filter(x => x.status === 'fulfilled')).toHaveLength(1);
expect(time.clock).toMatchObject({ mode: 'simulation', rate: 1, marketNow: boundary });
expect((await fetch(app.base + '/api/admin/state', { headers: { Cookie: cookie } })).status).toBe(200); // virtual 5h did not expire the real session
```

- [ ] **Step 2: Rot prüfen.** `npm.cmd test -- tests/server/news.test.ts tests/server/simulation.test.ts`; Expected: neue Befehle/Zeitsynchronisierung noch nicht unterstützt.
- [ ] **Step 3: Adapter umstellen.** Aliasdateien und bestehende Tests auf Schema 2/20 Minuten anpassen; keine Verlust-/Zugriffstests entfernen. Controller serialisiert Uhrbewegung und Domainbewegung gemeinsam, begrenzt Simulation an `nextBoundary`, setzt Rate 1 vor Einblendung und geplante Rate danach. Neue Befehle validieren und revisionsprüfen. Reale auth-Zeit bleibt unangetastet.
- [ ] **Step 4: Dauerhafte Uhr und Heartbeat integrieren.** Simulationsanker bei jedem Commit und mindestens alle fünf echten Sekunden während Bewegung speichern; bei Wiederanlauf an zuletzt dauerhaftem Anker pausieren. Fehlgeschlagenes Speichern veröffentlicht keine neue Generation/Phase. WebSocket sendet vollständige projizierte Zustände alle fünf realen Sekunden unabhängig von nativen Ping/Pong. `/api/time` liefert `timeSnapshot`; Main-Tick bleibt 250 ms, keine parallelen Ticks. Einstieg in Simulation nur Vorbereitung; Pause/Sprung nur Simulation.
- [ ] **Step 5: Grün prüfen.** `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`; Expected: alle Domain-/Servertests grün, Client weiterhin kompilierbar. Vollständige Browserverifikation folgt nach Clientumstellung.
- [ ] **Step 6: Commit.** `feat: expose durable market controls and synchronized simulation time`.

## Task 7: Clientzeit, Generationen und Verbindungsfrische

**Files:** Modify `src/client/shared/protocol.ts`, `clock.ts`, `connection.ts`, `src/client/admin/main.ts`, `src/client/display/main.ts`, `tests/client/clock.test.ts`; create `src/client/shared/freshness.ts`, `tests/client/freshness.test.ts`; modify `tests/e2e/harness.ts`, `fixtures.ts` und alte Ablaufwerte.

**Interfaces:** `createClock().sync(sample: TimeSnapshot, requestStart: number, responseEnd: number): boolean`, `.now(performanceNow: number): number`; bool zeigt Annahme des Samples. Ablehnen älterer Generation, bei gleicher Generation älterer `sampledAt`. `createFreshness(timeoutMs = 15_000)` produziert `.received(performanceNow)`, `.isFresh(performanceNow): boolean`, `.reset()`. `connectMarket` liefert weiterhin `{close()}` und verarbeitet vollständige Snapshotmetadaten. `TestApp.advanceTo(wallTime)` bewegt echte Testserverzeit; neue `.step()` führt Simulationsbefehl aus und bewegt Browserkontextuhr nur einmal.

- [ ] **Step 1: Failing tests schreiben.** `scaled_midpoint_clock_projects_market_time`, `clock_clamps_to_boundary`, `pause_freezes_projection`, `stale_generation_cannot_undo_reset`, `old_same_generation_sample_is_ignored`, `freshness_expires_after_fifteen_real_seconds`.

```ts
clock.sync(sample60AtZero, 100, 100);
expect(clock.now(1100)).toBe(60_000);
expect(clock.sync(oldGenerationSample, 2000, 2000)).toBe(false);
expect(clock.now(10_000)).toBe(sample60AtZero.clock.ceilingAt); // ceiling is 120_000 for this fixture
expect(freshness.isFresh(15_001)).toBe(false);
```

- [ ] **Step 2: Rot prüfen.** Dateitests; Expected: alter Clockvertrag erfüllt neue Assertions nicht.
- [ ] **Step 3: Synchronisierung implementieren.** Verwende Marktanker, effektive Rate und Obergrenze; echte monotone Performancezeit für RTT/Frische. Snapshot und API-Zeit nutzen denselben Samplefilter. Initiale API-Zeitfehler dürfen Anmeldung nicht blockieren. Alte Preisrevisionen ablehnen, gleiche Revision mit neuerem Uhren-/Heartbeat-Sample annehmen. Verbindungsausfall oder Fristablauf wird an Anzeige weitergegeben.
- [ ] **Step 4: Harness anpassen.** Schema-2-Store im planbezogenen Testverzeichnis; Reset-/Restartsteuerung verwendet neue Domain-/Uhrverträge. BrowserClock weiterhin je Kontext, nicht je Tab. Alte 30-Minuten-Erwartungen auf 20 Minuten ändern; fehlende Nachricht wird weiterhin durch reale Frameunterdrückung geprüft.
- [ ] **Step 5: Grün prüfen.** Unit-Suite, Typprüfung, Build und bestehende Admin-Browsertests; Expected: Exit 0, bisherige Eingaberegressionen bleiben grün.
- [ ] **Step 6: Commit.** `feat: synchronize client simulation clocks and state freshness`.

## Task 8: Adminparameter und separate Sofortkorrektur

**Files:** Create `src/client/admin/instant-price.ts`; modify `settings.ts`, `price-table.ts`, `main.ts`, `index.html`, `admin.css`, `tests/e2e/admin.spec.ts`.

**Interfaces:** `createSettings` submit erhält `(config: PreparedConfig, revision: number, generation: number): void`; `.update`, `.saved(generation)`, `.ownRevision`, `.reset` bleiben verfügbar. `createInstantPriceEditor(root: HTMLElement, drinkId: string, submit: (value: Cents, revision: number, generation: number) => void)` produziert `.update(state: AdminState, connected: boolean, marketNow: number): void`, `.reset(): void`. Root kontrolliert zusätzlich Authsession und `runId` für alle verspäteten Eingabeantworten.

- [ ] **Step 1: Failing Browserfälle schreiben.** `all_business_parameters_are_editable_before_start`, `instant_price_is_independent_of_next_override`, `instant_price_error_keeps_draft`, `instant_price_locked_during_transition`, `reset_while_price_response_pending_does_not_clear_new_draft`, `configuration_save_preserves_newer_draft` weiterhin ausführen.

```ts
await page.getByTestId('normal-bier-input').fill('2,70');
await page.getByTestId('current-bier-input').fill('2,50');
await page.getByTestId('current-bier-save').click();
await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,70');
await expect(page.getByTestId('current-bier-value')).toContainText('2,50');
await expect(page.getByTestId('current-bier-status')).toContainText('Gespeichert');
```

- [ ] **Step 2: Rot prüfen.** Neue Browserfälle mit direktem Playwright-CLI und passendem `--grep`; Expected: fehlende Sofort-/Parameterbedienelemente und fehlende Verhaltenserwartungen rot.
- [ ] **Step 3: Formulare implementieren.** Alle Specparameter mit Einheiten, erlaubten Bereichen und Feldfehlern; gesamte `PreparedConfig` atomar speichern. Getränk hinzufügen/entfernen synchronisiert Nachrichtenpaare. Text-/Wirkungseditor je Nachricht in Vorbereitung. Dirty-Generation schützt nachträgliche Eingaben. Sofortpreis bei aktueller Preiszelle statt nächster Vorgabe; Bestätigung nur nach Erfolg.
- [ ] **Step 4: Resetlauf isolieren.** Bei neuem `runId` alte Entwürfe/Widgets zurücksetzen. Alte Erfolg-/Fehlercallbacks aus vorherigem Lauf ignorieren, damit neu eingetragene Felder nicht gelöscht oder mit alten Fehlern markiert werden. Authsession-Prüfung weiter erhalten.
- [ ] **Step 5: Grün prüfen.** Build, neue und bestehende Admin-Browserfälle sowie Unit-Suite/Typprüfung; Expected: alle betroffenen Eingabefälle grün. Laptop/Tablet/Handy visuell prüfen; horizontale Tabellenbedienung bleibt erreichbar.
- [ ] **Step 6: Commit.** `feat: add editable market parameters and instant drink corrections`.

## Task 9: Adminwarteschlange, Simulation, Crash-Abbruch und Resetdialog

**Files:** Create `src/client/admin/special-queue.ts`, `simulation-panel.ts`, `reset-dialog.ts`; modify `main.ts`, `index.html`, `admin.css`; create `tests/e2e/controls.spec.ts`.

**Interfaces:** `createSpecialQueue(root, handlers: { reorder(ids: string[], revision: number): void; trigger(id: string, revision: number): void }): { update(snapshot: Snapshot<AdminState>, connected: boolean): void; reset(): void }`. `createSimulationPanel(root, submit: (command: MarketCommand) => void)` mit denselben update/reset-Methoden. `createResetDialog(root, confirm: (kind: 'evening' | 'factory', revision: number) => void)` produziert `.open(kind, revision)`, `.close()`; Bestätigung behält Öffnungsrevision.

- [ ] **Step 1: Failing tests schreiben.** `queue_displays_future_effect_and_relative_time`, `reordering_changes_next_special`, `direct_click_consumes_selected_only`, `stale_reorder_cannot_drop_consumed_special`, `simulation_speed_pause_and_step_reach_both_clients`, `crash_cancel_starts_recovery`, `evening_reset_keeps_settings`, `factory_reset_restores_defaults`, `reset_confirmation_rejects_intervening_change`.

```ts
await expect(page.getByTestId('special-queue-pending').locator('[data-special-id]')).toHaveCount(16);
await page.getByTestId('special-bier-down-trigger').click();
await expect(page.getByTestId('special-bier-down-status')).toContainText('Läuft');
await expect(page.getByTestId('special-bier-down-status')).toContainText('Erledigt'); // after publication
await expect(page.getByTestId('simulation-speed')).toHaveValue('60');
await expect(page.getByTestId('reset-dialog')).toBeVisible();
```

- [ ] **Step 2: Rot prüfen.** `npx.cmd playwright test tests/e2e/controls.spec.ts`; Expected: neue Bereiche/Interaktionen fehlen.
- [ ] **Step 3: Bedienelemente implementieren.** Geplant/laufend/erledigt mit Zeitpunkt, Getränk, Richtung, Nachricht und tatsächlicher erwarteter Wirkung. Nach oben/unten plus Drag-and-drop mit identischem vollständigem ID-Vertrag. Direktstart genau per Aktion; laufende/gesperrte Meldungen samt Grund. Simulation zeigt wirkliche/gewählte Rate und Pause, Schritt während Animation gesperrt. Crash-Abbruch passend für Einleitung/aktive Phase, nicht für laufende Erholung.
- [ ] **Step 4: Reset implementieren.** Dialogtext unterscheidet erhaltene Einstellungen von Werkseinstellungen, keine Credentials nennen. Bestätigung sendet Öffnungsrevision; Konflikt verlangt erneute Bestätigung. Neues `runId` löscht vorherige laufende UIaktionen und Nachrichtenstatus. Beide Anzeigen müssen den Reset akzeptieren.
- [ ] **Step 5: Grün prüfen.** Controls-Browserfälle, alle Adminfälle, Unit-Suite/Typprüfung/Build; Expected: alle genannten Fälle grün.
- [ ] **Step 6: Commit.** `feat: add admin news queue simulation and market reset controls`.

## Task 10: Diagramme, größere Änderungen und Breaking-News-Anzeige

**Files:** Create `src/client/display/chart.ts`, `breaking-news.ts`, `tests/client/chart.test.ts`; modify `view-model.ts`, `overview.ts`, `ticker.ts`, `transition.ts`, `main.ts`, `index.html`, `display.css`, `tests/client/display-model.test.ts`, `tests/e2e/display.spec.ts`.

**Interfaces:** `chartGeometry(points: PricePoint[], width: number, height: number): { path: string; pointCount: number }`, `renderChart(container: HTMLElement, points: PricePoint[]): void`, `renderBreakingNews(container: HTMLElement, news: NonNullable<DisplayState['news']>, remainingMs: number): void`. `getDisplayModel(state, marketNow, connected, fresh)` liefert bestehende visibility-Felder mit erweitertem Wechseltyp; offline/unfrisch/überschrittenes `hideAt` verbirgt auch Charts. Tickerposition verwendet `parameters.tickerRowMs`.

- [ ] **Step 1: Failing tests schreiben.** `chart_uses_real_time_spacing`, `chart_handles_single_flat_and_duplicate_time_points`, `ten_changes_visible_in_both_modes`, `special_shows_news_then_one_changed_price`, `transition_hides_chart_price_and_delta`, `larger_delta_is_readable`, `simulation_badge_and_rate_match_two_displays`, `offline_and_silent_frames_hide_values`, `late_pre_reset_snapshot_does_not_restore_chart`, `reduced_motion_shows_all_drinks_and_news`.

```ts
expect(chartGeometry([point(0, 200), point(1000, 250), point(10_000, 210)], 100, 50).pointCount).toBe(3);
await expect(page.locator('[data-chart] svg')).toHaveCount(8);
await expect(page.getByTestId('breaking-news')).toContainText('BREAKING NEWS');
await expect(page.locator('[data-price]:visible')).toHaveCount(0);
await expect(page.locator('[data-delta]:visible')).toHaveCount(0);
await expect(page.locator('[data-chart]:visible')).toHaveCount(0);
```

- [ ] **Step 2: Rot prüfen.** Neue Chart-/Displaymodel-Tests und neue Display-Browserfälle; Expected: fehlende Diagramm-/Newsdarstellung und Offlineausblendung rot.
- [ ] **Step 3: Darstellung implementieren.** Pro Karte und Tickerzeile SVG aus veröffentlichten Punkten, tatsächliche Zeitabstände, robuste Skalierung bei einer/flachen Kurve. Größere Deltas ungefähr 30–34 px auf 1080p, klar neben Kurs/Diagramm. Breaking News mit Richtung, Getränk und Satirekennzeichnung, ohne Preisbeträge; verwendete Texte via `textContent`. SIMULATION in beiden Ansichten, keine privaten Daten im DOM. Veraltete/offline Daten sofort verbergen; gültiger Snapshot stellt sie wieder her.
- [ ] **Step 4: Synchronität und Cachegrenzen implementieren.** Gemeinsame Marktzeit für Animation/Ticker. Neues `runId` entfernt Diagramm-/Ticker-/News-Caches; stale clock/revision ignorieren. Reduzierte Bewegung behält diskrete vollständige Liste. Sämtliche kopierten Tickerzeilen und Diagramme liegen in ausblendbarer Preiszone.
- [ ] **Step 5: Grün und visuell prüfen.** Unit-Suite, Typprüfung, Build, komplette Display-Browserdatei; Expected: Exit 0. Screenshots 1920 × 1080 von Übersicht, Ticker, Breaking News, Simulation, Crash und Erholung tatsächlich ansehen, Layoutkorrektur nur bei konkretem Fehler.
- [ ] **Step 6: Commit.** `feat: visualize price history and breaking market news`.

## Task 11: Fünfstündige Generalprobe, Dokumentation und Übergabe

**Files:** Modify `tests/e2e/evening.spec.ts`, `README.md`, `docs/operator-guide.md`, `docs/verification.md`; create `tests/e2e/events-evening.spec.ts`, `docs/events-verification.md`.

**Interfaces:** Consumes komplette Integration und neue TestApp. Produces verifizierte Betriebsanleitung, Abnahmematrix und gebauten startbaren Server. Keine zusätzliche Marktlogik in diesem Task.

- [ ] **Step 1: Zusammenhängende Abnahme schreiben.** `five_hour_simulation_consumes_all_news_and_resets_for_real_evening`: vorbereitete Getränkeeinstellungen ändern, normale Vorgabe setzen, Simulation 60× starten, zwei Gäste öffnen. Alle 16 Specials jeweils genau einmal über Zeitgrenzen abspielen, einen vorziehen, andere umsortieren; Sofortkorrektur und Crash mit vorzeitiger Erholung einbauen. Während eines Specials realen Testserver neu starten und pausierten Stand fortsetzen. Anschließend Abendreset: Einstellungen bleiben, normale Vorgaben leer, alle Specials wieder verfügbar, Startpreise/Startpunkt, kein laufender Timer, live 1×. Echter Marktstart plant 20 Minuten.

```ts
expect(new Set(publishedNewsIds).size).toBe(16);
expect(publishedNewsIds).toHaveLength(16);
expect(finalSchedule.pending).toHaveLength(0);
expect(reset.state.phase).toBe('ready');
expect(reset.clock).toMatchObject({ mode: 'live', rate: 1 });
expect(reset.state.historyByDrink.bier).toHaveLength(1);
expect(realStarted.state.deadline).toBe(realStarted.clock.marketNow + 1_200_000);
```

- [ ] **Step 2: Ablauf prüfen.** `npx.cmd playwright test tests/e2e/events-evening.spec.ts tests/e2e/evening.spec.ts`; Expected: echte HTTP-/WS-/Browserintegration besteht ohne reale Fünfstundenwartezeit. Fehler anhand Ursache korrigieren, nicht durch entfernte Assertions kaschieren.
- [ ] **Step 3: Anleitung aktualisieren.** 20 Minuten, Verlauf, Grenzen von Specialwirkung, Reihenfolge, Sofortkorrektur, Abbruch, Simulationsrate/Pause/Sprung, beide Reset-Arten und Migrationbackup erklären. Generalprobe über denselben Markt und anschließender Abendreset ausdrücklich beschreiben. LAN-/Startbefehle beibehalten, keine .env-Werte veröffentlichen.
- [ ] **Step 4: Schlussprüfung ausführen.** `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e`; Expected: Exit 0, beobachtete Testzahlen dokumentieren. Kompilierten Server mit vorhandener lokaler `.env` starten, `/health`, `/admin`, `/display` HTTP 200 und `/__test/advance` 404 bestätigen. Bestehenden selbst gestarteten Prozess vorher geordnet beenden; keine fremden Prozesse stoppen. Reale Marktdatei nicht für Tests/resetten verwenden.
- [ ] **Step 5: Abnahme zuordnen.** Speckriterien 1–5 Tasks 1/4/8; 6 Task 10 und Admin-Visu; 7–9 Tasks 1/2/4/9; 10–12 Tasks 2/4/10; 13–14 Tasks 4/9; 15–16 Tasks 3/6/7/9; 17 Tasks 4/8/9/10; 18 Task 5; 19–21 Tasks 6/7/8/9/10; 22 dieser Task. Keine unbekannten Zahlen als bestanden angeben.
- [ ] **Step 6: Commit und Schlussreview.** `docs: verify market events simulation and evening operation`. Frischer Gesamtbranch-Reviewer gemäß Inline-Skill, Plan/Spec und Review Focus mitgeben. Wichtige Befunde einmal per RED→GREEN korrigieren, ganze Suite danach grün. Branch lokal erhalten, keine Veröffentlichung. Protokolle und Entscheidungen sichern, nur eigenes abgeschlossenes Aufgabenverzeichnis bereinigen. Nutzer erhält lokale Vorschau und Startanleitung.

## Planungsselbstprüfung

- Alle 22 Abnahmekriterien sind Tasks zugeordnet; keine neue Abhängigkeit erforderlich.
- Tasks 1–5 sind unabhängig vom derzeit laufenden Schema-1-Backend prüfbar; die gemeinsame Umstellung erfolgt in Task 6.
- Preiszeit und echte Authzeit, Preisrevision und Uhrgeneration sowie aktueller Sofortpreis und nächster manueller Preis bleiben getrennt.
- Jeder Review-Focus besitzt benannte Regressionen und einen klaren Eigentümer.
- Alle konsumierten Module/Funktionen werden in früheren Interfaces definiert. Der Testuhrvertrag bleibt je Browserkontext.
- Ausführung erfolgt nach Planfreigabe inline/direkt; keine erneute Auswahl der Ausführungsmethode erforderlich.
