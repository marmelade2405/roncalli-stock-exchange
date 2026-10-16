# Further movement for Breaking News

Cause: the old preview used min(current, lower-band target) or max(current, upper-band target). Once the target was reached, it deliberately returned the same price. The user now requires another movement, explicitly including previously fixed offers.

News still targets the appropriate outer 10% of the range. If the automatic or entered target is no longer further in the indicated direction, the price moves approximately halfway through the remaining absolute distance toward Min/Max, rounded toward that boundary. This guarantees at least one price step when room remains. Entered offers are now called Richtpreis. At the boundary, the trigger is disabled with a clear reason, and the domain rejects the action without consuming the news. Prices retained outside new bands after a live edit are also never moved in the wrong direction.

Canonical example: Lillet at 2.50 euros -> 2.10 euros (-0.40, -16%); at 8.50 -> 8.70. Beer offer with target 1.50: existing 1.40 -> 1.20; existing 1.50 -> 1.30. The unchanged default beer text was clarified to say at most 1.50 and mention an extra discount; custom text was preserved.

Verification: new stricter preview/boundary tests failed before implementation. All 290 unit/client/server cases pass, plus 11 browser cases covering both directions, explicit targets, boundaries, preserved availability, announcement, two displays, reload and intro skipping. Build/typecheck pass. Local server reloaded with a market backup; read-only live check confirms unchanged prices/deadline/run/schedule and the new preview. The live Lillet quote was 2.60 with next 2.50; the exact requested 2.50 -> 2.10 case was separately verified from the same configuration. No news was triggered by live verification.
