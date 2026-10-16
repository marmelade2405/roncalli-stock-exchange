# Abnahme am 08.10.2026

Diese Seite dokumentiert die ursprüngliche Version. Die aktuelle Erweiterung mit 20-Minuten-Runden, Specials, Simulation und Reset ist in [events-verification.md](events-verification.md) dokumentiert.

Geprüft auf Windows mit Node.js 24.16.0 und Microsoft Edge. Die Testuhr simuliert den gesamten Abend; reale Betriebsdaten und Zugangsdaten werden dabei nicht verwendet.

## Ausgeführte Prüfungen

- `npm.cmd run typecheck`: erfolgreich.
- `npm.cmd test`: 52 von 52 Tests erfolgreich.
- `npm.cmd run build`: erfolgreicher Produktionsbuild beider Oberflächen und des Servers.
- `npm.cmd run test:e2e`: 18 von 18 Browsertests erfolgreich, einschließlich des vollständigen Abendablaufs mit Serverneustart und zwei Anzeigen sowie der drei Schlussreview-Regressionen.
- `npm.cmd start`: kompilierten Produktionsserver mit lokaler `.env` gestartet. `/health`, `/admin`, `/display` und `/api/state` liefern HTTP 200; `/__test/advance` liefert HTTP 404. Der öffentliche Zustand enthält acht Getränke, keine Vorschauen, Phase `ready`.
- Übersicht, Laufliste, normaler Übergang, Crash und Erholung bei 1920 × 1080 visuell geprüft. Steuerung bei 1440 × 900, 768 × 1024 und 390 × 844 geprüft; die Dokumentbreite entspricht jeweils der Bildschirmbreite. Auf schmalen Geräten lassen sich die Preistabellen horizontal verschieben.

## Zuordnung zur Spezifikation

| Abnahmekriterium | Nachweis |
| --- | --- |
| 1. Start mit unabhängigem 30-Minuten-Timer | `tests/domain/market.test.ts`, `tests/e2e/display.spec.ts` |
| 2. Reproduzierbare Preisberechnung mit Grenzen und Rundung | `tests/domain/prices.test.ts` |
| 3. Veröffentlichung exakt der gespeicherten Vorschau oder Vorgabe | `tests/domain/market.test.ts`, `tests/e2e/admin.spec.ts` |
| 4. Einmalige Vorgaben korrekt leeren und erhalten | `tests/domain/market.test.ts`, `tests/e2e/evening.spec.ts` |
| 5. Crash ersetzt normalen Termin | `tests/domain/market.test.ts`, `tests/e2e/evening.spec.ts` |
| 6. Neue Erholungspreise und neuer 30-Minuten-Timer | `tests/domain/market.test.ts`, `tests/e2e/evening.spec.ts` |
| 7. Zehn preisfreie Sekunden, synchrone Anzeigen | `tests/client/display-model.test.ts`, `tests/e2e/display.spec.ts`, `tests/e2e/evening.spec.ts` |
| 8. Öffentliche Kanäle ohne Vorschauen und Schreibrechte | `tests/domain/snapshots.test.ts`, `tests/server/http.test.ts`, `tests/server/realtime.test.ts` |
| 9. Beide Darstellungen mit aktuellen Preisen und Veränderungen | `tests/e2e/display.spec.ts`, `tests/e2e/evening.spec.ts`, visuelle Prüfung |
| 10. Wiederverbinden, Neustart, höchstens ein nachgeholter Übergang | `tests/server/repository.test.ts`, `tests/server/controller.test.ts`, `tests/e2e/evening.spec.ts` |
| 11. Vollständiges Zeitbeispiel ohne reale Wartezeit | `tests/e2e/evening.spec.ts` |
| 12. Größen und Lesbarkeit | Visuelle Prüfung; Bilder unter `.artifacts/previews/` |

## Zusätzliche Fehlerfälle

Konflikte zwischen Steuergeräten, alte Echtzeitnachrichten, Speicherausfälle, falsche Geräteuhren und Verbindungsverlust während eines Preiswechsels sind abgedeckt. Eine fehlerhafte WebSocket-Upgrade-Adresse wird mit HTTP 400 abgewiesen; der Server bleibt erreichbar. Dieser Fall wurde vor der Korrektur als unbehandelte Ausnahme reproduziert.

Beim ersten vollständigen Browserlauf schlug eine Teststeueranfrage zum Anzeigewechsel einmal fehl. Der gezielte Wechsel bestand anschließend acht Wiederholungen. Die Testfixture zeigt nun bei einem Fehler auch den Antworttext des Testservers, um weitere Ursachen nachvollziehen zu können. Der abschließende vollständige Lauf bestand alle 15 Tests; die Ursache des einmaligen Teststeuerfehlers wurde nicht reproduziert.

## Unabhängige Schlussprüfung

Ein frischer Reviewer prüfte den gesamten Entwicklungsbranch mit `gpt-6-astra`, ohne Änderungen vorzunehmen. Alle fünf Prüfschwerpunkte des Plans wurden bestätigt. Drei relevante Clientfehler wurden anschließend in einem Korrekturdurchgang behoben:

- Neue Einstellungsentwürfe bleiben erhalten, wenn die Antwort einer früheren Speicherung verspätet eintrifft: `configuration_save_preserves_newer_draft`.
- Eine fehlgeschlagene anfängliche Zeitabfrage blockiert die Anmeldung nicht: `login_recovers_when_initial_time_request_fails`.
- Bei reduzierter Bewegung zeigt die Laufliste sämtliche Getränke in diskreten Schritten und verbirgt die Preise während des Übergangs: `reduced_motion_ticker_shows_all_drinks_and_hides_prices`.

Alle drei Tests schlugen vor der Korrektur mit dem beschriebenen Verhalten fehl und bestanden danach. Nach den Korrekturen bestanden erneut sämtliche 52 Logik-/Servertests und 18 Browsertests; Typprüfung und Produktionsbuild waren ebenfalls erfolgreich. Es gibt keine zurückgestellten kleineren Reviewbefunde und keine vom Reviewer ausgeklammerten Verhaltensfälle.
