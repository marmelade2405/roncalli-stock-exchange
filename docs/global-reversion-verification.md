# Live global Average reversion

Added a global 0-100% whole-step reversion slider alongside volatility and global Average. Factory default is 50%. Its beer example shows the deterministic movement before noise; distribution and equation use the current global value, including unsaved Average drafts. A zero value explicitly explains that target binding is disabled.

Normal forecasts update immediately unless already frozen. Current prices, overrides, deadlines, crash/recovery forecasts and special targets are retained. A crash intro's interrupted normal forecast updates so cancellation uses the new setting. Preparation history is resimulated while ready. Evening reset retains the setting; factory reset restores 50%. Old saved files without the global field keep their original per-drink reversion until explicitly changed. Schema-1 migration also keeps legacy behavior. New command is authenticated and validated at HTTP and domain boundaries; persistence uses the existing atomic market save.

Validation:
- TDD: new domain cases failed for missing global pricing/command/distribution support before implementation; the browser case failed for the absent slider.
- 280 unit/server/client tests pass across 52 files. Existing compatibility fixtures now explicitly select their individual legacy rate or global zero as intended.
- 18 browser cases pass across reversion, Average, volatility and distribution. New checks cover persistence/reload/factory reset, keeping a dirty Average while updating the curve, setting zero, paused simulation, frozen crash intro and desktop/mobile bounds.
- Build and typecheck pass; git diff --check passes.
- The Windows sandbox could not load temporary Vitest modules; full tests succeeded outside it with two workers.
- Live server restarted after saving .artifacts/market-reversion/before-restart.json. Read-only localhost check confirms slider 50%, beer 3.30 -> 2.75 euros before noise, unchanged published prices, overrides, deadline and runId. Desktop/mobile screenshots visually inspected. Live parameters were not moved as part of the check.
