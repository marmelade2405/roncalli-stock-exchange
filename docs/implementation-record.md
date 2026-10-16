# SDD ledger — plan: docs/superpowers/plans/2026-10-08-stock-market-exchange.md

Spec: docs/superpowers/specs/2026-10-07-stock-market-exchange-design.md
Execution: inline, approved 08.10.2026. Branch: codex/stock-market-exchange. Base: 1cbe998.

Setup ruling: Managed worktree failed on Windows Git ownership. Use this project on a new development branch — preserves master and avoids changing global Git trust — cost if wrong: branch isolation does not isolate untracked files; prompt.txt will remain untouched.
Setup ruling: POSIX helpers received Windows-native Git paths and failed in a mkdir loop. Stopped the helper and use equivalent PowerShell/Node bookkeeping in this plan-scoped directory — avoids modifying installed skills — cost if wrong: bookkeeping must be checked explicitly.

Pre-flight 1 -> 2: DrinkConfig, Cents, Rng and price functions match; no conflict.
Pre-flight 2 -> 3: Immutable MarketState and projections allow persist-before-publish; no conflict.
Pre-flight 3 -> 4: Controller methods and conflict handling match HTTP and WebSocket consumption; no conflict.
Pre-flight 4 -> 5: Public/admin APIs and command envelopes match client connections; no conflict.
Pre-flight 5 -> 6: Shared formatting, clock and snapshots match display inputs; no conflict.
Pre-flight 5/6 -> 7: Test clock fixture and browser routes support full evening verification; no conflict.

Task 1: in progress. BASE 1cbe998. Initial tests written before price implementation.
Task 1: complete (commits 1cbe998..d47f745, tests: npm.cmd test -> 7/7 passed; npm.cmd run typecheck -> exit 0). RED observed: 7 assertion failures before implementation.
Task 2: in progress. BASE d47f745.
Task 2: complete (commits d47f745..146e4db, tests: npm.cmd test -> 20/20 passed; typecheck -> exit 0). RED observed: all 13 new behavioral assertions failed.
Task 3: in progress. BASE 146e4db.
Task 3: complete (commits 146e4db..4dda230, tests: npm.cmd test -> 30/30 passed; typecheck -> exit 0). RED observed: 9 failures before persistence/queue implementation; additional passing tick-failure coverage verifies existing commit path.
Task 4: in progress. BASE 4dda230.
Task 4: complete (commits 4dda230..80d7dfa, tests: npm.cmd test -> 42/42 passed; typecheck -> exit 0). RED observed: 12 HTTP/socket contract failures before implementation.
Task 5: in progress. BASE 80d7dfa.
Task 5: complete (commits 80d7dfa..6d0cc95; unit suite 47/47 passed, typecheck and build exit 0, admin browser 7/7 passed). RED observed: 5 utility assertions and 7 missing-login browser assertions. Visual QA desktop/tablet/mobile; document widths 1440/768/390 matched viewports; mobile price tables intentionally scroll horizontally with hint. Browser/tsx execution requires elevated Windows user context because os.userInfo fails in sandbox.
Task 6: in progress. BASE 6d0cc95.
Task 6: Ruling: Playwright clock is shared by a whole BrowserContext. Install and advance it once per context, not once per tab — documented library behavior and the 29:50 versus 30:00 failure identify a fixture defect — cost if wrong: simulated multi-screen timing would be inaccurate. Source: https://playwright.dev/docs/api/class-clock
Task 6: complete (commits 6d0cc95..16e1982; unit suite 51/51 passed, typecheck/build exit 0, combined browser 14/14 passed). RED: 4 model failures and 7 missing-display browser failures. Visual QA 1920x1080 overview/ticker/transition/crash/recovery, screenshots .artifacts/previews.
Task 7: in progress. BASE 16e1982.
Task 7: complete (commits 16e1982..951809b; typecheck/build exit 0; unit 52/52 and browser 15/15 passed; compiled production smoke 200/404 expected; visual QA all required sizes). Added regression: malformed WS upgrade URL RED -> HTTP 400 without stopping server GREEN. Initial full browser 14/15, isolated 8/8, final full 15/15; test-control error not reproduced, diagnostics added.
Final review: fresh gpt-6-astra reviewer, range 1cbe998..951809b, read-only. All five Review Focus guarantees confirmed. Three Important findings accepted after checking code: configuration draft lost during pending save; initial time request failure strands login; reduced-motion ticker permanently clips last drinks. Critical none, minor none, Declined to judge empty. One TDD fix pass started.
Final: fixed lost settings draft — configuration_save_preserves_newer_draft RED -> GREEN, whole unit suite 52/52 and browser suite 18/18.
Final: fixed stranded login after time failure — login_recovers_when_initial_time_request_fails RED -> GREEN, whole unit suite 52/52 and browser suite 18/18.
Final: fixed missing drinks with reduced motion — reduced_motion_ticker_shows_all_drinks_and_hides_prices RED -> GREEN, whole unit suite 52/52 and browser suite 18/18.
Final: no deferred minors, no Declined to judge items. Inline implementation remains on codex/stock-market-exchange; no remote publishing or merging requested. Production server runs in preparation state.
