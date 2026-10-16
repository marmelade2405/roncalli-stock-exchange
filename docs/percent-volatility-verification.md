# Percent volatility verification · 13.10.2026

The admin slider now controls a direct whole percentage (0–75 %, default 25 %) of each drink's effective Average. The global Average offset is included. Calculation retains fractional cents until the existing selling-price rounding step. Normal movement keeps asymmetric widths and balanced extremes; percentage denotes its basis, not a guaranteed maximum change. Crash uses double that basis. Specials and manual prices remain independent.

The new percentage command refreshes unfrozen forecasts and prepared history without moving current prices, overrides, deadlines or frozen publication quotes. Older stored markets without a percentage retain their absolute amplitude/factor behavior. Their UI shows the actual legacy basis and equation until percentage selection. Schema-1 migration preserves that behavior too.

Verification:

- Typecheck and production build passed.
- Full domain/client/server suite: 265 tests passed across 51 files.
- 21 distinct relevant browser cases passed; the final 16-case run covers the percentage control, legacy display, global Average and price distribution. Earlier five cases cover Avg-only derived fields and global sound availability.
- Regression checks include 40 % producing 80 cents for beer, 140 cents for a longdrink, 44 cents for a shot, and zero for water. A +10 % global Average turns the longdrink basis into 154 cents.
- Crash double basis, zero-percent reversion, percentage validation, admin authentication, frozen quotes, legacy fallback and migration are covered.
- Independent review found two legacy consistency issues; both were fixed and checked again with no additional actionable findings.
- Updated local server restarted; existing drink settings, specials and water price retained. Previously running simulation resumed. The user's current 75 % setting was preserved; factory default remains 25 %.
