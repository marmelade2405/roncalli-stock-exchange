# Market controls and display implementation plan

> **For agentic workers:** Use superpowers:executing-plans for the user-authorized inline implementation. No additional approval gates; the user explicitly waived them earlier.

**Goal:** Implement the user's crash, simulation, guest-chart and admin-control changes in the existing market.
**Architecture:** Keep persisted previews and frozen transitions. Add optional crash-range/selected-percent metadata with legacy fallback, authenticated simulation-skip and live ticker-speed commands. Reuse the local audio engine only in the admin. Render floating price-change bars on the existing chart scale.
**Tech stack:** Existing TypeScript, native HTTP/WebSocket, HTML/CSS/SVG, Vitest and Edge/Playwright; no new dependencies.
**Spec:** Latest user message in this chat, 09.10.2026.

## Global constraints

- Crash draw is one integer percentage in configurable inclusive 5–15% defaults; recovery uses that same percentage upward. Bounds, rounding and manual crash prices can limit actual effects.
- Fixed water stays zero. Never recompute frozen transition prices; previews remain persisted.
- Skip only authenticated, connected simulation normal/crash/recovery introductions; live and news remain protected.
- Inline execution, preserve actual market and password; back up saved state before rollout.

## Review focus

- Restart during crash retains the selected percentage and matching recovery.
- Price limits or overrides must not make the displayed percentage claim exact per-drink effects.
- Countdown skips preserve pause, one publication and restart the normal timer correctly.
- Live ticker edits must preserve forecasts, overrides, drafts and scroll position.
- Fixed save controls must not cover the final fields on phone widths; guest pages have no sound controls.

## Tasks

- [x] Write failing domain/browser tests in `tests/domain/crash-range.test.ts`, `tests/domain/control-shortcuts.test.ts`, `tests/client/change-bars.test.ts`, `tests/e2e/event-controls.spec.ts`; run and confirm missing behavior.
- [x] Add optional range and selected-percent fields in `model.ts`/`parameters.ts`; implement `crash-prices.ts`, persisted crash/recovery lifecycle in `market-v2.ts`, projections and store validation. Test saved range, bounds and matching recovery.
- [x] Add authenticated session capability and skip/ticker command validation in `server/http.ts`. Add admin counter behavior, ticker-speed control and sound control. Test live rejection, draft/market preservation and paused simulation.
- [x] Replace guest chart rendering with red/green change bars, remove visible demo/history caption, update title and dot-free transition headings, exact crash/recovery percentage copy and authenticated simulation counter click.
- [x] Add explanatory equations to distribution preview and fixed bottom settings-save bar. Update browser tests affected by intended chart/audio changes.
- [x] Run full unit/type/build/browser verification, read-only review, visual checks; back up and roll out actual market, document and commit exact files.
