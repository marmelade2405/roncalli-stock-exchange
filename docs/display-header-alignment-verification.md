# Display header alignment

The crash-price callout was absolutely positioned at the header's top, while the title and countdown were laid out beneath it. Replaced the separate placement with one three-column grid. The title/slogan block, centered crash-price callout and countdown now share a vertical center. The simulation badge sits below the callout without changing header height. Small screens use a centered title row followed by aligned crash/countdown blocks.

Verification:
- npm run build passes.
- Browser geometry checked at 1920x1080, 1440x900, 1366x768 and 1024x768, with and without the simulation badge: all three centers differ by less than 0.01px, crash callout is horizontally centered, blocks do not overlap.
- 650px and 390px widths retain in-bounds blocks with aligned crash/countdown centers.
- Screenshots visually inspected at 1920px, 1024px and 390px.
- Three existing display browser tests pass: shared countdown/prices, switching overview/ticker on both displays, matching simulation badges/rates.
- Live market data unchanged; refreshed localhost display serves the rebuilt stylesheet.
