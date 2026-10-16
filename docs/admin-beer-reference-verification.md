# Admin beer reference examples

Market volatility now shows an explicit beer reference with its normal euro basis and the doubled crash basis, instead of the mean basis across all drinks. It tracks the selected volatility and effective Average; stored legacy factor profiles still use their saved absolute basis. The global Average summary is labeled Referenzbeispiel: Bier and its free-water copy is removed.

Price distribution defaults to beer even if it is not first in the drink list, labels the selected reference explicitly, and retains the other drink options. The existing reversion is labeled fixed in both parameter summary and equation explanation. No reversion control or pricing-model change was introduced: harmonized drink configuration keeps 50% reversion.

Verification: build, typecheck and 16 existing browser tests pass (global Average, volatility, distribution). Read-only localhost admin check confirms the 25% beer basis of 0.55 euros, doubled crash basis of 1.10 euros, Average reference 2.20 to 2.20 euros, beer distribution selection, fixed 50% reversion, and correctly updated label when selecting Aperol. Desktop and 375px controls inspected for layout. Live market parameters and prices unchanged.
