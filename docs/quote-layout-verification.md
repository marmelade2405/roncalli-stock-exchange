# Höhere Charts und neue Kursanordnung · 12.10.2026

Die Gästeübersicht setzt den Preis rechts neben den Namen und vergrößert Euro- und Prozentänderungen. In der Laufliste steht der Preis unter dem Namen; Änderung und Chart folgen rechts. SVGs verwenden die verfügbare Kartenhöhe statt einer festen Obergrenze. Linien- und Balkenmodus bleiben nutzbar. Preiseinblendung, Signalpunkte und Lauflistenbewegung behalten ihre Funktion.

Geprüft: TypeScript, Produktionsbuild und zehn betroffene Edge-Browsertests erfolgreich. Die Tests decken Chart-Umschaltung auf beiden Displays, Preis-Einblendungen, zeitunabhängige Lauflistenbewegung sowie Karten ohne Überlappung bei kleinen Bildschirmhöhen ab.

Zusätzliche visuelle Prüfung bei 1920×1080, 1280×720 und 390×844: Charts liegen innerhalb ihrer Karten, kein horizontaler Seitenüberlauf. Bei Full HD beträgt die SVG-Höhe ungefähr 133 Pixel in der Übersicht und 160 Pixel in der Laufliste. Die laufende lokale Gästeansicht wurde ebenfalls auf Desktop und Handy geprüft. Die Anpassung betrifft ausschließlich den Client; der Server musste nicht neu gestartet werden.

Screenshots: `.artifacts/previews/quote-layout-overview-1920.png`, `.artifacts/previews/quote-layout-ticker-1920.png`, `.artifacts/previews/quote-layout-live-1920.png` und `.artifacts/previews/quote-layout-live-390.png`.
