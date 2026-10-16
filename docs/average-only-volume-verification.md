# Average-only pricing and global volume verification · 13.10.2026

All paid defaults now use a once-raised Standard-Average (approximately +10 %, rounded to 10 cents). Derivation applies on every configuration save: Min ≈ 50 %, Max ≈ 250 %, start = Average, amplitude = 25 %, step = 10 cents and reversion = 50 %. Water remains fixed at zero. Only the drink's Average is editable as an individual pricing parameter in the table and distribution editor. Global Average remains a separate live −10…+10 % offset and cannot compound the saved baseline.

Volume controls are above the five admin tabs, remain available when muted or audio activation is unavailable, and preserve local browser volume preferences. Guest sound controls remain absent.

Verification:

- TypeScript typecheck and production build passed.
- Full domain/server suite: 259 tests passed across 50 files.
- 32 distinct relevant browser cases passed across Average, derived bands, pricing distribution, bar prices, manual news, sound, market volatility, quote announcement and the full simulated evening. Old price assertions were updated to the new preset; the corrected manual-news suite passed on rerun.
- Browser checks cover read-only derived fields, automatic recalculation on an Average edit, water protection, sound controls in all five tabs, persistence while muted and AudioContext failure.
- Independent read-only review found no actionable regressions.
- Current local server rebuilt/restarted. Original state saved privately in ignored `.artifacts/raised-average-original.json`; new baseline applied exactly once with an original-baseline guard.
- Actual state checked: 20 drinks, 38 manual news entries, water zero, 20 prepared history points per drink, simulation ready at 1×. Existing messages, timing parameters, view, chart mode and ticker columns retained.

Example: beer Standard-Average €2.00, Min €1.00, Max €5.00; global −10 % gives a target of €1.80 and +10 % gives €2.20. Configuration saves and factory reset do not repeat the baseline increase.
