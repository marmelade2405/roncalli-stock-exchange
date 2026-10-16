# Stock Market Exchange: Kursverlauf, Breaking News und Simulation

Datum: 08.10.2026. Status: Gesprächsentwurf und schriftliche Spezifikation vom Nutzer bestätigt.

Grundlage: bestehende Anwendung auf `codex/stock-market-exchange`, Stand `c9bee8c`, und [bisherige Spezifikation](2026-10-07-stock-market-exchange-design.md). Diese Erweiterung ersetzt das normale 30-Minuten-Intervall durch 20 Minuten und ergänzt die unten beschriebenen Funktionen. Die bisherigen Regeln für einmalige Vorgaben, gespeicherte Vorschauen, synchronisierte Anzeigen und Speicherung vor Veröffentlichung gelten weiterhin, soweit hier ausdrücklich geändert.

## 1. Ziel und bestätigte Entscheidungen

Der fünfstündige Barabend soll eine lebendigere Getränkebörse bekommen. Gäste sehen pro Getränk einen tatsächlichen Kursverlauf und größere Änderungszahlen. Überraschende satirische Nachrichten bewegen jeweils einen einzelnen Getränkepreis. Admins können die gesamte Ereignisfolge überblicken, umsortieren, vorziehen und Preise bei Bedarf direkt korrigieren.

Bestätigt wurden:

- Normale Runden alle **20 Minuten**, weiterhin als Timer und unabhängig von vollen Uhrzeiten.
- Die acht Dummygetränke erhalten je ein steigendes und ein fallendes Special: **16 Breaking News, jedes einmal pro Abend**.
- Zufällige Verteilung über ungefähr fünf Stunden; die Reihenfolge ist steuerbar.
- Ein Specialpreis gilt bis zur nächsten regulären Runde. Ein weiterer Eingriff am selben Getränk kann ihn zuvor ersetzen.
- Die Simulation benutzt denselben Markt und dieselben Gästebildschirme, vor dem tatsächlichen Abend.
- Zwei Reset-Funktionen: Abend neu starten mit erhaltenen Einstellungen; Werkseinstellungen mit Dummygetränken und Standardparametern.

Die bestehenden Startpreise bleiben: Bier/Radler 2,00 €, Longdrinks 3,50 €, Cola/Wasser 1,50 €. Grenzen, Rundung und normale Schwankungsbreiten bleiben zunächst wie bisher.

## 2. Architektur und betrachtete Ansätze

Empfohlen wird die Erweiterung der bestehenden zentralen Zustandsmaschine. Verlauf, Ereigniswarteschlange, Parameter und Simulationsuhr gehören zu demselben gespeicherten Markt. Die vorhandenen HTTP-/WebSocket-Kanäle bleiben getrennt nach Gast und Admin. SVG-Diagramme benötigen keine zusätzliche Chartbibliothek.

Für die Ereignisplanung wurden zwei Varianten betrachtet:

1. **Vorab zufälliger Zeitplan:** Alle Zeitpunkte sind nach Marktstart bekannt und gespeichert; Admins können den ganzen Abend planen. Diese Variante wird umgesetzt.
2. **Nächsten Abstand nach jedem Special bestimmen:** Flexibel, aber spätere Termine bleiben unbekannt und die Verteilung aller 16 Ereignisse ist schwieriger zu überblicken.

Die Regeln bleiben getrennt in Preisberechnung, Ereignisplanung, Veröffentlichungslogik, Marktuhr, Speicherung und Darstellung. Ein zentraler serialisierter Befehlsweg verhindert konkurrierende Veröffentlichungen. Kein zweiter Server und kein separater Simulationsmarkt.

## 3. Preisrunden und Sofortkorrekturen

### Normale Runde

Standardintervall: `1_200_000 ms`. Nach Veröffentlichung einer normalen Runde oder Erholung beginnt ein voller neuer 20-Minuten-Timer. Ein Special oder eine Sofortkorrektur verändert diesen Termin nicht.

Die zehn Sekunden vor einer normalen Runde bleiben ein preisfreier, festgeschriebener Übergang. Danach wird genau die gespeicherte normale Vorschau beziehungsweise manuelle Vorgabe veröffentlicht. Normale Vorgaben werden ausschließlich durch diese normale Runde verbraucht.

### Sofortkorrektur

In **„Die nächsten Kurse“** bekommt der aktuelle Preis jedes Getränks einen eigenen Bearbeitungsbereich mit Eingabe und **„Jetzt setzen“**. Die Eingabe ist von „Manueller Preis für die nächste Runde“ getrennt.

- Veröffentlichung sofort nach erfolgreicher Speicherung; keine zehnsekündige Animation.
- Nur das gewählte Getränk ändert sich. Es gelten dieselben Preisgrenzen und Cent-Schritte.
- Vorgaben für normale Runde und Crash werden nicht verbraucht oder überschrieben.
- Im laufenden normalen Markt bleibt die bereits gespeicherte normale Zufallsvorschau erhalten. Die Crashvorschau des korrigierten Getränks wird aus dessen neuem Preis aktualisiert; andere Crashvorschläge bleiben unverändert.
- Während des Crashs wird stattdessen die Erholungsvorschau dieses Getränks passend aktualisiert.
- In der Vorbereitung werden normale und Crashvorschau dieses Getränks aktualisiert.
- Während einer festgeschriebenen Preiswechselanimation sind Sofortkorrekturen gesperrt. Außerhalb dieser Animation sind sie auch während eines Crashs möglich.
- Ein identischer Preis erzeugt keinen zusätzlichen Verlaufspunkt und keine neue Preisänderung.
- Die Oberfläche bestätigt nur gespeicherte Änderungen. Bei Fehler oder Konflikt bleibt der Eingabeentwurf erhalten.

## 4. Breaking News: Ablauf und Planung

### Ablauf eines Specials

Ein Special besteht aus eindeutiger ID, Getränk-ID, Richtung, Prozentwirkung, Überschrift und Begründung. Standardwirkung: **+40 % oder −40 %** auf den zum Auslösen gültigen Preis, ohne zusätzlichen Zufallsanteil. Anschließend wird auf den Getränkeschritt gerundet und auf dessen Grenzen begrenzt.

Beim Auslösen wird das Ergebnis festgeschrieben und gespeichert. Es folgt eine **zehnsekündige BREAKING-NEWS-Einblendung** mit betroffenen Getränk und satirischer Börsenmeldung. In dieser Zeit sind sämtliche Preise, Änderungszahlen und tatsächlichen Kursdiagramme auf beiden Gästeanzeigen verborgen. Die Einblendung zeigt keine zukünftigen Eurobeträge oder numerischen Preisänderungen.

Nach erfolgreicher Veröffentlichung ändert sich ausschließlich dieses Getränk. Dessen Kurskarte beziehungsweise Tickerzeile wird kurz hervorgehoben. Die anderen Preise und deren letzte Änderungszahlen bleiben erhalten. Die normale Vorschau und normale Vorgaben bleiben erhalten; die Crashvorschau des betroffenen Getränks wird passend zum neuen Preis aktualisiert.

Der Specialpreis wird in der nächsten regulären Runde durch die ohnehin geplante normale Preisrunde ersetzt. Es gibt keinen eigenen Rücksprung und keinen zusätzlichen Erholungstimer für Specials.

Der Admin sieht vor dem Auslösen den aktuell erwarteten Specialpreis und die tatsächliche Änderung nach Rundung/Grenzen. Diese Vorschau passt sich an zwischenzeitliche aktuelle Preisänderungen an und wird beim Auslösen verbindlich. Erreichte Grenzen können die Wirkung reduzieren oder ganz verhindern; dies ist im Admin sichtbar. Die Meldung erscheint trotzdem einmal, der Gast sieht anschließend gegebenenfalls „Preisgrenze erreicht“. Ohne tatsächliche Preisänderung entsteht kein zusätzlicher Diagrammpunkt.

### Zeitplan und Warteschlange

Beim Marktstart werden ein gespeicherter zufälliger Zeitplan und eine Reihenfolge für alle aktiven Specials angelegt. Die aktuelle konfigurierte Reihenfolge wird verwendet; die erste Standardreihenfolge wird einmal zufällig gemischt und ist bereits in der Vorbereitung umsortierbar.

Die standardmäßigen fünf Stunden werden in 16 Verteilungsbereiche aufgeteilt. Innerhalb der Bereiche werden zufällige Zeitpunkte gewählt, statt alle Ereignisse am Anfang zu häufen. Die letzten 20 Minuten dienen als Reserve für Verschiebungen. Die automatische Planung berücksichtigt preisfreie Übergänge und einen standardmäßigen Mindestabstand von zwei Minuten nach einem Special sowie mindestens zwei Minuten sichtbarer Specialpreise vor dem nächsten regulären Übergang.

Der Admin sieht Getränk, Richtung, Meldung, erwartete Preiswirkung, Reihenfolge und geplanten Zeitpunkt. Vor Marktstart werden Zeitpunkte relativ zum Start angezeigt, anschließend als Uhrzeit/Countdown. Die Liste bietet Verschieben nach oben/unten; Ziehen ist zusätzlich möglich, die Bedienung darf aber nicht davon abhängen.

- Umsortieren verändert die Zuordnung der Specials zu den verbleibenden Zeitplätzen, nicht die Zeitplätze selbst.
- „Jetzt auslösen“ entfernt nach erfolgreicher Preisveröffentlichung genau dieses Special und dessen zugeordneten zukünftigen Zeitplatz. Es erscheint später nicht erneut.
- Während der Einblendung wird das Special als laufend angezeigt; es darf weder erneut ausgelöst noch umsortiert werden. Ein fehlgeschlagener Speicherzugriff verbraucht es nicht.
- Bereits verbrauchte Specials sind getrennt als erledigt sichtbar.
- Während Crash, Erholung oder einer anderen Preiswechselanimation startet kein Special.
- Eine normale Runde hat bei einer Terminkollision Vorrang. Das Special wartet und wird zum nächsten geeigneten Zeitpunkt ausgelöst.
- Ein manueller Sofortstart darf den automatischen Mindestabstand unterschreiten, benötigt aber Platz für seine ganze Einblendung und mindestens eine Sekunde sichtbarer Specialpreise vor dem nächsten regulären Übergang. Bei zu wenig verbleibender Zeit ist die Aktion gesperrt und der Grund sichtbar.
- Pausen oder länger blockierte Termine verwerfen keine Nachrichten. Verspätete Ereignisse bleiben sichtbar und werden nacheinander nachgeholt, ohne eine Nachrichtenkette auf einmal abzuspielen. Die fünf Stunden sind das Planungsziel und beenden den Markt nicht automatisch.

Für neu hinzugefügte Getränke entstehen zwei editierbare allgemeine Nachrichten. Beim Entfernen eines Getränks in der Vorbereitung werden seine beiden Specials entfernt. Die Standardzahl 16 folgt somit den acht Standardgetränken; ein angepasstes Sortiment bekommt weiterhin zwei Specials pro Getränk.

### Standardmeldungen

Alle Texte sind erfundene, satirische Marktmeldungen. Auf der Einblendung steht dezent **„Satirische Marktmeldung“**. Getränkenamen, Texte und Prozentwirkung sind im Admin editierbar.

| Getränk | Wirkung | Überschrift | Begründung |
| --- | --- | --- | --- |
| Bier | −40 % | Bier-Futures im freien Fall | Söder kündigt eine Bierpreisbremse an. Händler werfen Maß-Kontrakte auf den Markt – der Bierkurs rauscht ab. |
| Bier | +40 % | Kaufpanik am Gerstenmarkt | Die Maß wird zur strategischen Reserve erklärt. Bierfonds sichern sich die Restbestände und treiben den Kurs nach oben. |
| Radler | −40 % | Radler-Index verliert den Halt | Der Fahrradverband empfiehlt plötzlich stilles Wasser. Anleger steigen aus Zitrus-Kontrakten aus – Radler gerät unter Verkaufsdruck. |
| Radler | +40 % | Zitronen-OPEC verknappt das Angebot | Die Zitrusmächte drosseln ihre Förderung. Radler-Futures ziehen an, während Händler hektisch Fahrradklingeln läuten. |
| Cola | −40 % | Cola-Markt von Liquidität geflutet | Eine Mensa eröffnet die Cola-Flatrate. Das Überangebot löst einen Ausverkauf im Koffein-Sektor aus. |
| Cola | +40 % | Koffein wird zur Leitwährung | Die Nachtschicht entdeckt Cola als krisenfeste Anlage. Fonds schichten um, der Brausekurs schießt nach oben. |
| Wasser | −40 % | Brunnen erhält Spitzenrating AAA | Die Ratingagentur bescheinigt dem Dorfbrunnen unbegrenzte Liquidität. Wasser-Anleger verkaufen, der Kurs tropft in den Keller. |
| Wasser | +40 % | Durstige Fonds suchen sicheren Hafen | Luxusinvestoren erklären Leitungswasser zum blauen Gold. Trockene Kehlen treiben die Nachfrage – der Wasserindex steigt. |
| Gin Tonic | −40 % | Wacholder-Lager brechen alle Rekorde | Der Gartenverein meldet eine historische Wacholderernte. Gin-Produzenten fluten den Markt, der Tonic-Sektor knickt ein. |
| Gin Tonic | +40 % | Wacholder-Futures mit Kurssprung | Ein Trendbericht erklärt Gin Tonic zum Pflichtbestandteil jedes Start-ups. Hipster-Fonds kaufen alles, was nach Botanicals klingt. |
| Cuba Libre | −40 % | Rum-Reserven überraschend freigegeben | Ein Hafen findet vergessene Rumcontainer. Das Überangebot setzt Cuba-Libre-Kontrakte unter massiven Verkaufsdruck. |
| Cuba Libre | +40 % | Karibik-Rally erfasst den Longdrinkmarkt | Ein Reisefonds tauscht Flugtickets gegen Rum-Kontrakte. Cuba Libre profitiert von der Flucht in liquide Urlaubsanlagen. |
| Wodka Orange | −40 % | Saftfonds löst Orangenreserve auf | Tiefgekühlte Orangenvorräte kommen gleichzeitig auf den Markt. Wodka-Orange-Futures verlieren ihren frisch gepressten Aufschlag. |
| Wodka Orange | +40 % | Orangen-Kartell dreht den Hahn zu | Die Frühstückslobby sichert sich die Orangenernte. Longdrink-Händler bieten gegeneinander – Wodka Orange legt kräftig zu. |
| Whisky Cola | −40 % | Kellerfund erschüttert den Fassmarkt | Der Hausmeister entdeckt vergessene Whiskybestände. Händler sprechen von einem Liquiditätsschock, Whisky Cola rutscht ab. |
| Whisky Cola | +40 % | Fass-Futures werden zum Spekulationsobjekt | Sammler kaufen plötzlich jedes schottische Holzfass. Das knappe Angebot zieht auch Whisky-Cola-Kontrakte steil nach oben. |

## 5. Crash und vorzeitiges Ende

Standardwerte bleiben fünf Minuten Crash, −10 % Zieltrend und doppelte normale Schwankungsbreite. Die Erholung verwendet +10 % Zieltrend und normale Schwankungsbreite. Diese Werte sind im Admin einstellbar.

**„Crash beenden“** leitet während der veröffentlichten Crashphase sofort den normalen preisfreien Erholungsübergang ein. Nach dessen zehn Sekunden werden die gespeicherten Erholungspreise veröffentlicht. Danach beginnt ein neuer voller 20-Minuten-Timer. Normale manuelle Vorgaben bleiben erhalten; es gibt keine Wiederherstellung der Preise vor dem Crash.

Wird der Crash bereits während seiner Einleitungsanimation abgebrochen, wurde noch kein Crashpreis veröffentlicht: Die bisherigen Preise bleiben, Crashvorgaben werden nicht verbraucht, die gesicherte normale Vorschau wird wiederhergestellt und ein voller 20-Minuten-Timer beginnt. Eine bereits laufende Erholungsanimation wird nicht nochmals abgebrochen oder neu gestartet.

Während Crash und Erholung warten Specials. Ein vorzeitig beendeter Crash löst keine zusätzlichen Nachrichten oder normalen Preisrunden aus.

## 6. Kursverlauf und Gästeanzeigen

Jedes Getränk erhält einen eigenen gespeicherten Verlauf mit Zeitstempel, Centpreis und Herkunft (`Start`, `Runde`, `Crash`, `Erholung`, `Special`, `Korrektur`). Nur tatsächliche Preisänderungen erzeugen neue Punkte. Startpreise bilden den ersten Bezugspunkt.

Standardanzeige: die **letzten zehn Änderungen plus deren Ausgangspunkt**, also höchstens elf Punkte. Bei weniger Änderungen werden nur vorhandene Punkte gezeigt. Die Zeitachse verwendet die wirklichen Abstände der Marktzeit; in Simulation ist das die simulierte Zeit. Gleiche Zeitstempel werden in Veröffentlichungsreihenfolge behandelt, nicht zusammengewürfelt.

In der Übersicht bekommt jede Kurskarte ein kompaktes SVG-Liniendiagramm. In der Laufliste bekommt jede Getränkzeile dieselben Daten als kleines Diagramm. Der zuletzt sichtbare Änderungsbetrag und die Prozentzahl stehen deutlich größer als bisher, bei 1920 × 1080 ungefähr 30–34 px statt bisher ungefähr 18–20 px. Farben und Pfeile bleiben grün/rot/neutral.

Ein Einzeleingriff verändert nur den Verlauf und die letzte Änderungsbasis des betroffenen Getränks. Andere Getränke behalten ihre letzte tatsächliche Veränderung; sie springen nicht auf „0 %“, weil ein anderes Getränk geändert wurde. Ohne bisherige Änderung wird ein neutraler Strich angezeigt.

Preisfreie Übergänge verbergen auch die echten Verlaufskurven. Die dekorative Börsenanimation darf weiterhin abstrakte Linien zeigen, enthält aber keine historischen oder zukünftigen Preiswerte.

Bei verlorener Liveverbindung werden Preise und Diagramme ausgeblendet, bis wieder ein aktueller verbindlicher Stand empfangen wurde. Öffentliche vollständige Zustandsnachrichten mindestens alle fünf realen Sekunden ermöglichen zusätzlich die Erkennung einer stillstehenden Verbindung; nach 15 Sekunden ohne solche Nachricht gilt die Anzeige als veraltet. Ein bekannter Veröffentlichungstermin blendet Preise weiterhin unabhängig davon rechtzeitig aus. Die Geräteuhr entscheidet keinen Markttermin.

Reduzierte Bewegung zeigt weiter alle Getränke in diskreten, synchronisierten Schritten. Die Diagramme bleiben lesbar; die Einblendung verzichtet auf unnötige Bewegung, verbirgt jedoch weiterhin Preise.

## 7. Simulation auf dem echten Markt

Simulation ist aus der Vorbereitung auswählbar. Beide Gästeanzeigen bekommen ein deutlich sichtbares **SIMULATION**-Kennzeichen. Anmeldung und Sitzungslaufzeit verwenden weiterhin die echte Zeit.

Steuerung:

- Geschwindigkeit `1×`, `10×`, `60×`, `120×`, Standard `60×` beim Simulationsstart.
- Pause/Fortsetzen der Marktzeit.
- **„Zum nächsten Ereignis“**: zur nächsten Einleitung eines Preiswechsels beziehungsweise nächsten Nachricht springen, nicht stundenweise alle Veröffentlichungen überspringen.

Normale Wartezeiten und die veröffentlichte Crashdauer laufen mit dem gewählten Faktor. Preisfreie Übergänge und Breaking-News-Einblendungen laufen automatisch mit **1×**, damit sie realistisch geprüft werden können. Danach wird die gewählte Geschwindigkeit wieder aufgenommen. Eine ausdrückliche Pause hält auch eine laufende Einblendung an. Während einer Einblendung ist der Ereignissprung gesperrt.

Die beschleunigte Marktuhr hält exakt an der nächsten Ereignisgrenze, bevor sie in den 1×-Übergang wechselt. Ein Server-Tick darf somit auch bei 120× weder eine Einblendung überspringen noch einen Specialstart über eine normale Rundengrenze hinwegziehen.

Der Server ist die einzige Quelle für Marktzeit, wirksame Geschwindigkeit und Pause. Diese Zeitmetadaten werden an beide Ansichten verteilt; ihre lokalen Uhren verwenden `performance.now()` und den Serveranker. Verspätete Nachrichten dürfen weder Preise noch Zeitsprünge rückgängig machen.

Ein Neustart stellt einen Simulationsmarkt pausiert wieder her, ohne während der Downtime viele virtuelle Ereignisse nachzuholen. Ein echter Markt behält den bisherigen Wiederanlauf mit höchstens einer überfälligen Veröffentlichung. Eine ausstehende Breaking News wird mit ihrer Einblendung nachgeholt; vorbereitete, bereits abgelaufene Übergänge veröffentlichen ihre gespeicherten Preise genau einmal. Falls ein verspätet beendetes Special den alten normalen Termin überschritten hat, beginnt ab seiner Veröffentlichung ein neuer normaler Timer, statt sofort wieder alte Preise zu zeigen.

Für den tatsächlichen Abend wird **„Abend neu starten“** verwendet: Simulation aus, Geschwindigkeit 1×, reale Marktzeit, Startpreise, leere Verläufe bis auf den Startpunkt, unbenutzte Specials und Vorbereitungsmodus. Anschließend wird der echte Markt ausdrücklich gestartet.

## 8. Einstellbare Parameter und Admin-Oberfläche

Alle **geschäftlichen Marktparameter** sind ohne Quellcodeänderung im Admin einstellbar. Netzwerkbindung, Serverport und Anmeldegeheimnisse bleiben Serverkonfiguration in `.env`.

| Parameter | Standard | Validierung |
| --- | --- | --- |
| Normales Rundenintervall | 20 Minuten | 1–180 Minuten; ausreichend Platz für Übergang und Special-Sichtzeit |
| Crashdauer | 5 Minuten | 30 Sekunden bis 30 Minuten; länger als Erholungsübergang |
| Preiswechselanimation | 10 Sekunden | 1–60 Sekunden; kürzer als betroffene Runde |
| Breaking-News-Einblendung | 10 Sekunden | 1–60 Sekunden |
| Geplante Abenddauer | 5 Stunden | 30 Minuten bis 24 Stunden; genug Platz für alle Specials |
| Automatischer Mindestabstand/Sichtzeit von Specials | 2 Minuten | 0–10 Minuten; muss mit Intervall und Anzahl vereinbar sein |
| Crash-Zieltrend | −10 % | −90 bis 0 % |
| Crash-Schwankungsfaktor | 2 | 1–5 |
| Erholungs-Zieltrend | +10 % | 0 bis +100 % |
| Normale Schwankung, Startpreis, Grenzen und Rundung | Bisherige Getränkewerte | Pro Getränk wie bisher; ganze Cent, Grenzen und Schritt gültig |
| Specialwirkung | ±40 % | Je Special; Abwärtswirkung −90 bis −1 %, Aufwärtswirkung +1 bis +200 % |
| Specialtexte und Reihenfolge | Tabelle in Abschnitt 4 | Nicht leer; eindeutige gültige Zuordnung zu Getränken |
| Angezeigte Preisänderungen | 10 | 1–50; gespeicherter Verlauf hält mindestens die letzten 50 Änderungen plus Ausgangspunkt |
| Laufzeit pro Tickerzeile | 6 Sekunden | 1–30 Sekunden |
| Simulationsgeschwindigkeit | 60× | 1×, 10×, 60× oder 120× |

Zeitparameter werden in ganzen Sekunden gespeichert. Das normale Intervall muss länger sein als Wechselanimation plus Nachrichteneinblendung plus automatische Special-Sichtzeit. Bei der Vorbereitung wird außerdem geprüft, ob sich die konfigurierte Anzahl an Nachrichten mit diesen Dauern innerhalb der Abendplanung unterbringen lässt. Unvereinbare Kombinationen werden vor dem Speichern mit Hinweis auf die betroffenen Felder abgewiesen; es entsteht kein unvollständiger Zeitplan. Bei kurzen Abenden wird die Reserve auf höchstens zehn Prozent der Abenddauer begrenzt.

Getränkedefinitionen, Nachrichteninhalte und allgemeine Marktparameter werden in der Vorbereitung bearbeitet. Im laufenden Markt bleiben manuelle Vorgaben, Sofortkorrekturen, Ereignisreihenfolge, Direktstarts, Crash-Abbruch, Ansicht und Simulationssteuerung bedienbar. So verändern Einstellungen keine bereits festgeschriebene Runde. Die Oberfläche zeigt die Sperre und ihren Grund.

Die bisherige Preistabelle bleibt der Kern. Weitere Bereiche sind **Breaking News** mit geplant/laufend/erledigt, **Simulation**, **Markteinstellungen** und **Reset**. Auf schmalen Geräten bleiben Tabellen horizontal verschiebbar; Aktionen sind auch ohne Drag-and-drop zugänglich. Gespeicherte Vorschauen, tatsächliche Prozentänderung und Grenzen werden weiterhin angezeigt.

## 9. Reset

Beide Aktionen besitzen eine klare Bestätigung mit Beschreibung dessen, was zurückgesetzt wird. Sie sind auch während eines Crashs oder Übergangs möglich und stoppen dessen ausstehende Veröffentlichung.

**Abend neu starten:** behält Getränke, Parameter, bearbeitete Nachrichten, konfigurierte Reihenfolge und gewählte Gästeansicht. Setzt Preise auf konfigurierte Startwerte, entfernt einmalige Vorgaben, Verlauf und erledigte Ereignisse, erzeugt neue Vorschauen und setzt alle Specials auf unbenutzt. Kein laufender Timer, keine Pause oder Simulation: Zustand ist Vorbereitung.

**Werkseinstellungen:** dieselbe Rücksetzung plus ursprüngliche acht Getränke, alle Standardparameter, die 16 Standardmeldungen und Übersicht als Gästeansicht. Zugangsdaten bleiben erhalten.

Die globale Zustandsrevision und die Generation der Zeitmetadaten werden bei keinem Reset auf null gesetzt. Verbundene Anzeigen müssen den Reset unmittelbar als neueren Zustand akzeptieren. Späte Antworten aus dem vorherigen Abend dürfen keine Eingabefelder oder Preise zurückbringen.

## 10. Speicherung, Migration und öffentliche Daten

Das gespeicherte Format wird auf Schema 2 erweitert: konfigurierbare Marktparameter, Specialkatalog und konfigurierte Reihenfolge, geplanter Abend und noch offene/verbrauchte Specialplätze, aktiver Übergang einschließlich festgeschriebenem Ergebnis, Verlauf je Getränk und Simulations-/Zeitmetadaten.

Schema-1-Dateien werden nach vollständiger Validierung migriert. Vor dem ersten Ersetzen wird das Original als separate Sicherungsdatei erhalten; vorhandene Sicherungen werden nicht überschrieben. Getränke, Preise, vorhandene Vorschauen, Vorgaben, bisherige Termine und Ansicht bleiben erhalten. Bereits laufende alte Termine werden nicht während der Migration verkürzt; nach der nächsten Veröffentlichung gilt das neue 20-Minuten-Intervall.

Verläufe werden nur aus vorhandenen veröffentlichten Zeitpunkten rekonstruiert. Fehlende historische Werte oder Zeitstempel werden nicht erfunden. Neue Specials sind zunächst unbenutzt. Bei einem laufenden alten Markt wird ihre Planung ab dem Migrationszeitpunkt angelegt, bei Vorbereitung erst ab Marktstart.

Beschädigte oder nicht unterstützte Dateien bleiben erhalten und führen zu einer verständlichen Startfehlermeldung. Alle Änderungen einschließlich Reset, Sofortkorrektur, Specialverbrauch und Simulation werden vor ihrer Veröffentlichung atomar gespeichert. Fehlgeschlagene Speicherung lässt bisherige Preise und Einmalvorgaben unberührt.

Gäste erhalten veröffentlichte Preise und Verläufe, notwendige Zeit-/Anzeigemetadaten und nur die aktuell laufende Nachricht. Zukünftige Specialtexte, Warteschlange, manuelle Vorgaben und zukünftige Preisvorschauen sind ausschließlich im authentifizierten Admin verfügbar. Alle neuen Bedienbefehle benötigen Sitzung, Herkunftsprüfung und erwartete Revision wie bisher.

## 11. Konkrete Abnahme

1. Marktstart plant die erste normale Runde exakt 20 Minuten später; Special und Sofortkorrektur verändern diesen Termin nicht.
2. Eine normale Vorgabe wird genau einmal in einer normalen Runde veröffentlicht und geleert; Specials, Korrekturen, Crash und Erholung verbrauchen sie nicht.
3. Eine Sofortkorrektur verändert nur ein Getränk, bestätigt erst nach Speicherung und bleibt bei Fehler/Revisionkonflikt als Entwurf erhalten.
4. Jede Veröffentlichung aktualisiert nur die tatsächlich geänderten Getränkeverläufe und deren Änderungsbasis.
5. Zehn Änderungen ergeben elf richtige zeitbezogene Punkte; unveränderte Preise erzeugen keinen künstlichen Punkt.
6. Diagramme und vergrößerte Zahlen sind in Übersicht und Laufliste bei 1920 × 1080 lesbar. Laptop, Tablet und Handy bleiben bedienbar.
7. Alle 16 Standardmeldungen besitzen unterschiedliche IDs und je Getränk genau eine positive und eine negative Wirkung.
8. Kontrollierte Zufallswerte erzeugen einen reproduzierbaren verteilten Zeitplan. Ohne Eingriffe und Kollisionen erscheinen alle Specials einmal innerhalb der geplanten Abenddauer.
9. Umsortieren verändert den nächsten Specialinhalt, ein Direktstart verbraucht genau das gewählte Special samt künftigem Platz, ein Neustart wiederholt es nicht.
10. BREAKING NEWS laufen synchron auf beiden Anzeigen. Währenddessen sind sämtliche Preise, Änderungszahlen und echte Diagramme verborgen; danach ändert sich nur das betroffene Getränk.
11. Grenzen und Rundung gelten auch für Specials; begrenzte oder wirkungslose Ergebnisse werden korrekt dargestellt.
12. Normale Runden gewinnen Terminkollisionen; während Crash/Erholung wartet die Warteschlange und wird nicht verloren.
13. Crash-Abbruch in der aktiven Crashphase verwendet gespeicherte Erholungspreise und startet danach einen neuen 20-Minuten-Timer.
14. Abbruch vor Crashpreis-Veröffentlichung verbraucht keine Crashvorgaben und stellt die normale Vorschau wieder her.
15. Simulationsgeschwindigkeit wirkt auf beide Anzeigen; Übergänge laufen 1×, Pause wirkt zuverlässig, Sprung zeigt das nächste einzelne Ereignis.
16. Simulationszeit verlängert oder verkürzt keine Anmeldung. Neustart der Simulation führt zu einem pausierten aktuellen Stand.
17. Beide Reset-Arten funktionieren auch mit verbundenen Anzeigen und während Übergängen. Sie unterscheiden sich genau in erhaltenen Einstellungen und stoppen alte Veröffentlichungen.
18. Ein Schema-1-Markt wird mit Sicherung und ohne Verlust vorhandener Vorschauen/Vorgaben übernommen; beschädigte Daten werden nicht überschrieben.
19. Öffentliche HTTP-/WebSocket-Daten enthalten keine zukünftigen Preiswerte, Nachrichtenwarteschlange oder Bedienrechte, auch bei vorhandenem Admincookie.
20. Zwei konkurrierende Steuergeräte, verspätete Zeit-/Preisnachrichten und misslungene Speicherung erzeugen keine doppelte Veröffentlichung und überschreiben keine neueren Entwürfe.
21. Verbindungsverlust oder ausbleibende Zustandsnachrichten verbergen veraltete Preise und Diagramme. Falsche Geräteuhren ändern keinen Countdown.
22. Ein vollständiger beschleunigter fünfstündiger Ablauf mit normaler Runde, allen Specials, Crash, Abbruch, Sofortkorrektur, Serverneustart und anschließendem Abendreset wird ohne reale Fünfstundenwartezeit geprüft.

## 12. Übergabe zur Umsetzung

Nach Zustimmung zu dieser schriftlichen Spezifikation wird ein konkreter Implementierungsplan erstellt. Die bereits gewählte Ausführung bleibt **inline/direkt**. Produktcode und Datenmigration werden erst nach Prüfung des Plans umgesetzt.
