# Bar display and chart autoscale implementation plan

**Goal:** Remove manual-news reordering, auto-scale guest charts to visible extrema, and add a read-only staff price display.
**Execution:** User-authorized inline implementation; no repeated design approval.
**Files:** special-queue/main/index and domain/server command handling for sorting removal; display/chart for observed scale; new client/bar-display entry, Vite entry and server route; unit/browser regression tests and operator docs.

- [x] Write and run failing tests for obsolete reorder rejection, observed chart extrema and staff price publication/staleness.
- [x] Remove arrows, dragging, queue reorder command/helper and obsolete tests. Preserve existing catalog, prices and consumed news.
- [x] Compute padded observed low/high; keep a flat-price fallback and show Average only at its true scale position. Test smooth path bounds and guide labels.
- [x] Add `/bar-display` with names/current prices only, immediate shared publications and safe waiting state for stale/disconnected quotes. Keep guest animations separate.
- [x] Add admin link and desktop/mobile layout. Test 20 drinks, water, transitions, corrections and stale-state protection.
- [x] Verify unit/type/build/browser checks, request read-only review, restart the local server without resetting the market, smoke-check and commit exact files.
