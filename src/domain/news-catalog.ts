import type { DrinkConfig, SpecialDefinition } from './model.js';
import {hasVariablePrice} from './prices.js';
const STANDARD: SpecialDefinition[] = [
  {
    "id": "bier-down",
    "drinkId": "bier",
    "direction": "down",
    "headline": "Bier-Futures im freien Fall",
    "body": "Söder kündigt eine Bierpreisbremse an. Händler werfen Maß-Kontrakte auf den Markt – der Bierkurs rauscht ab."
  },
  {
    "id": "bier-up",
    "drinkId": "bier",
    "direction": "up",
    "headline": "Kaufpanik am Gerstenmarkt",
    "body": "Die Maß wird zur strategischen Reserve erklärt. Bierfonds sichern sich die Restbestände und treiben den Kurs nach oben."
  },
  {
    "id": "radler-down",
    "drinkId": "radler",
    "direction": "down",
    "headline": "Radler-Index verliert den Halt",
    "body": "Der Fahrradverband empfiehlt plötzlich stilles Wasser. Anleger steigen aus Zitrus-Kontrakten aus – Radler gerät unter Verkaufsdruck."
  },
  {
    "id": "radler-up",
    "drinkId": "radler",
    "direction": "up",
    "headline": "Zitronen-OPEC verknappt das Angebot",
    "body": "Die Zitrusmächte drosseln ihre Förderung. Radler-Futures ziehen an, während Händler hektisch Fahrradklingeln läuten."
  },
  {
    "id": "cola-down",
    "drinkId": "cola",
    "direction": "down",
    "headline": "Cola-Markt von Liquidität geflutet",
    "body": "Eine Mensa eröffnet die Cola-Flatrate. Das Überangebot löst einen Ausverkauf im Koffein-Sektor aus."
  },
  {
    "id": "cola-up",
    "drinkId": "cola",
    "direction": "up",
    "headline": "Koffein wird zur Leitwährung",
    "body": "Die Nachtschicht entdeckt Cola als krisenfeste Anlage. Fonds schichten um, der Brausekurs schießt nach oben."
  },
  {
    "id": "wasser-down",
    "drinkId": "wasser",
    "direction": "down",
    "headline": "Brunnen erhält Spitzenrating AAA",
    "body": "Die Ratingagentur bescheinigt dem Dorfbrunnen unbegrenzte Liquidität. Wasser-Anleger verkaufen, der Kurs tropft in den Keller."
  },
  {
    "id": "wasser-up",
    "drinkId": "wasser",
    "direction": "up",
    "headline": "Durstige Fonds suchen sicheren Hafen",
    "body": "Luxusinvestoren erklären Leitungswasser zum blauen Gold. Trockene Kehlen treiben die Nachfrage – der Wasserindex steigt."
  },
  {
    "id": "gin-tonic-down",
    "drinkId": "gin-tonic",
    "direction": "down",
    "headline": "Wacholder-Lager brechen alle Rekorde",
    "body": "Der Gartenverein meldet eine historische Wacholderernte. Gin-Produzenten fluten den Markt, der Tonic-Sektor knickt ein."
  },
  {
    "id": "gin-tonic-up",
    "drinkId": "gin-tonic",
    "direction": "up",
    "headline": "Wacholder-Futures mit Kurssprung",
    "body": "Ein Trendbericht erklärt Gin Tonic zum Pflichtbestandteil jedes Start-ups. Hipster-Fonds kaufen alles, was nach Botanicals klingt."
  },
  {
    "id": "cuba-libre-down",
    "drinkId": "cuba-libre",
    "direction": "down",
    "headline": "Rum-Reserven überraschend freigegeben",
    "body": "Ein Hafen findet vergessene Rumcontainer. Das Überangebot setzt Cuba-Libre-Kontrakte unter massiven Verkaufsdruck."
  },
  {
    "id": "cuba-libre-up",
    "drinkId": "cuba-libre",
    "direction": "up",
    "headline": "Karibik-Rally erfasst den Longdrinkmarkt",
    "body": "Ein Reisefonds tauscht Flugtickets gegen Rum-Kontrakte. Cuba Libre profitiert von der Flucht in liquide Urlaubsanlagen."
  },
  {
    "id": "wodka-orange-down",
    "drinkId": "wodka-orange",
    "direction": "down",
    "headline": "Saftfonds löst Orangenreserve auf",
    "body": "Tiefgekühlte Orangenvorräte kommen gleichzeitig auf den Markt. Wodka-Orange-Futures verlieren ihren frisch gepressten Aufschlag."
  },
  {
    "id": "wodka-orange-up",
    "drinkId": "wodka-orange",
    "direction": "up",
    "headline": "Orangen-Kartell dreht den Hahn zu",
    "body": "Die Frühstückslobby sichert sich die Orangenernte. Longdrink-Händler bieten gegeneinander – Wodka Orange legt kräftig zu."
  },
  {
    "id": "whisky-cola-down",
    "drinkId": "whisky-cola",
    "direction": "down",
    "headline": "Kellerfund erschüttert den Fassmarkt",
    "body": "Der Hausmeister entdeckt vergessene Whiskybestände. Händler sprechen von einem Liquiditätsschock, Whisky Cola rutscht ab."
  },
  {
    "id": "whisky-cola-up",
    "drinkId": "whisky-cola",
    "direction": "up",
    "headline": "Fass-Futures werden zum Spekulationsobjekt",
    "body": "Sammler kaufen plötzlich jedes schottische Holzfass. Das knappe Angebot zieht auch Whisky-Cola-Kontrakte steil nach oben."
  }
];
const BAR_NEWS:Record<string,[[string,string],[string,string]]>={
  wein:[['Traubenmarkt unter Verkaufsdruck','Der Winzerverband meldet eine Rekordernte. Wein-Kontrakte schwemmen die Börse – selbst Schorle-Fonds verkaufen hektisch.'],['Trauben-OPEC dreht den Hahn zu','Die Weinberge begrenzen ihre Ausschüttung. Anleger sichern sich die letzten Rebensaft-Futures und treiben den Kurs nach oben.']],
  aperol:[['Orangenfonds schütten Sonderdividende aus','Ein Tanker voller Bitterorange trifft ein. Aperol-Händler sprechen von einem Liquiditätsschock und verkaufen ihre Spritz-Bestände.'],['Sonnenindex löst Aperol-Kaufrausch aus','Der Wetterbericht meldet drei Sonnenstrahlen. Terrassenfonds kaufen Spritz-Kontrakte, als gäbe es morgen nur noch Regen.']],
  'wodka-energy':[['Koffein-Sektor rutscht in die Ruhephase','Die Uni verschiebt alle Prüfungen. Wachmacher-Fonds lösen ihre Wodka-Energy-Positionen auf – der Kurs fällt in den Powernap.'],['Nachtschicht hebt Energy-Rating auf AAA','Eine spontane Verlängerung der Party sorgt für Kaufpanik. Der Wodka-Energy-Index erhält das Prädikat systemrelevant.']],
  'rum-cola':[['Piratenkasse flutet den Rum-Markt','Ein Schatzfund besteht überraschend aus Rumfässern. Die Karibik-Börse meldet Überangebot – Rum Cola gerät unter Druck.'],['Karibikfonds bunkern flüssiges Gold','Piraten erklären Rum zur offiziellen Reservewährung. Anleger kaufen Fass-Kontrakte und schicken Rum Cola auf Rekordkurs.']],
  'lillet-wildberry':[['Beeren-Bubble platzt nach Gartenfund','Der Kleingartenverein entdeckt einen Brombeerüberschuss. Wild-Berry-Fonds verlieren ihre Exklusivität und werfen Kontrakte auf den Markt.'],['Beerenkartell verknappt die Sommerreserve','Die letzte Brombeere wird zur Luxusanlage erklärt. Lillet-Fonds sichern sich den süßen Rohstoff – Wild Berry zieht kräftig an.']],
  limo:[['Zitronenbank senkt den Brause-Leitzins','Ein Zitronenbaum erzielt eine Rekordrendite. Limonaden-Anleger verkaufen, der Markt wird von frischer Liquidität überschwemmt.'],['Brause-Futures steigen nach Eiswürfelkrise','Die Kühltruhe streikt und kalte Limo wird zum knappen Gut. Erfrischungsfonds kaufen jede verfügbare Flasche.']],
  spezi:[['Spezi-Index verliert das Mischungsverhältnis','Eine Überproduktion von Cola und Orange drückt auf die Margen. Mischgetränke-Fonds geraten in einen wilden Ausverkauf.'],['Orange und Cola fusionieren zum Börsenstar','Die Übernahmefantasie elektrisiert Anleger. Spezi-Kontrakte werden zur begehrtesten Mischung im Erfrischungssektor.']],
  mate:[['Mate-Fonds wechseln in den Energiesparmodus','Das WLAN fällt aus und alle Start-ups machen Feierabend. Die Mate-Nachfrage bricht ein, der Koffeinkurs sackt ab.'],['Start-up-Börse treibt Mate auf Wachstumskurs','Ein Inkubator eröffnet direkt neben der Bar. Gründerfonds investieren ihre gesamte Liquidität in Mate-Futures.']],
  apfelschorle:[['Streuobst-Offensive drückt Apfel-Futures','Der Dorfverein schüttelt gleichzeitig alle Bäume. Das Überangebot setzt Schorle-Kontrakte unter massiven Verkaufsdruck.'],['Apfelrating steigt nach Sprudel-Fusion','Die Verbindung von Obst und Kohlensäure überzeugt Anleger. Schorle-Fonds feiern eine prickelnde Wachstumsstory.']],
  shots:[['Kurze Kontrakte geraten unter Verkaufsdruck','Ein Influencer empfiehlt plötzlich lange Gespräche statt kurzer Drinks. Shot-Fonds verkaufen ihre hochprozentigen Positionen.'],['Shot-Markt erlebt spontane Übernahmewelle','Eine Geburtstagsrunde kauft den gesamten Kurzdrink-Sektor. Händler melden Kaufpanik und ungewöhnlich hohe Ausschüttungen.']],
  berentzen:[['Apfel-Futures fallen nach Rekordernte','Die Obstbörse meldet einen historischen Überschuss. Berentzen-Händler werfen Apfel-Kontrakte auf den Markt – der Kurs fällt vom Baum.'],['Apfel-Renditen steigen am kurzen Ende','Anleger schichten ihre flüssigen Reserven in Berentzen um. Die Nachfrage wächst schneller als ein Apfelbaum im Geschäftsbericht.']],
  pfeffi:[['Minzbank senkt den Frische-Leitzins','Eine neue Minzreserve flutet den Markt. Pfeffi-Fonds verlieren ihren Frischeaufschlag und geraten unter Verkaufsdruck.'],['Minz-Rating klettert auf AAA','Frischer Atem wird zur begehrtesten Sicherheit am Markt. Pfeffi-Anleger melden einen außergewöhnlich grünen Kaufrausch.']],
  tequila:[['Agaven-OPEC hebt die Förderquote an','Die Agavenplantagen melden Überproduktion. Tequila-Futures verlieren ihren Salzaufschlag – selbst die Limettenlobby verkauft.'],['Agavenfonds sperren die strategische Reserve','Die letzte Agave wird zur Premiumanlage erklärt. Tequila-Händler bieten um flüssiges Gold; die Limette dient nur noch als Sicherheit.']],
  jaegermeister:[['Kräuterkartell verliert seine Marktstellung','Ein Gartenverein entdeckt eine geheime Kräuterreserve. Jägermeister-Fonds lösen ihre hochprozentigen Positionen auf – der Wald sieht rot.'],['Kräuter-Hedgefonds kaufen den Markt leer','Eine feindliche Übernahme der Kräuterbestände sorgt für Kaufpanik. Jägermeister wird vom Digestif zum systemrelevanten Engpass.']],
  ouzo:[['Anisbank flutet den Ägäis-Markt','Ein Tanker liefert überraschend frische Anis-Liquidität. Ouzo-Fonds gehen baden – diesmal allerdings nicht im Mittelmeer.'],['Sirtaki-Fonds treiben Ouzo auf Rekordkurs','Eine spontane Tanzrunde reserviert die letzten Gläser. Für Anleger gilt ab sofort: keine Rendite ohne Anisiko.']],
  rum:[['Piratenbank gibt die Fassreserven frei','Eine Schatzkarte führt direkt ins Rum-Lager. Neue Fässer drücken den Kurs; Piratenkapitäne beantragen vorsorglich Kurzarbeit.'],['Karibikfonds bunkern flüssiges Gold','Piraten erklären Rum zur Reservewährung. Händler sichern sich die letzten Fass-Futures; Dividenden werden ab sofort in Ahoi ausgeschüttet.']],
  erdbeerlimes:[['Erdbeer-Bubble platzt nach Rekordernte','Obstkisten überschwemmen die Börse. Limes-Fonds verkaufen hektisch – der süße Sektor erlebt einen saftigen Ausverkauf.'],['Erdbeerfonds feiern einen süßen Börsengang','Anleger entdecken rosa Liquidität als Wachstumsmarkt. Die letzte Erdbeerreserve erhält ein Premiumrating und der Limes-Kurs blüht auf.']],
};
export function createSpecialCatalog(drinks: DrinkConfig[]): SpecialDefinition[] {
  return drinks.filter(hasVariablePrice).flatMap(drink => (['down','up'] as const).map(direction => {
    const text=BAR_NEWS[drink.id]?.[direction==='down'?0:1];
    if(text)return{id:`${drink.id}-${direction}`,drinkId:drink.id,direction,headline:text[0],body:text[1]};
    const standard = STANDARD.find(s => s.drinkId === drink.id && s.direction === direction);
    return standard ? { ...standard } : {
      id: `${drink.id}-${direction}`, drinkId: drink.id, direction, headline: direction === 'up' ? `${drink.name}: Kaufrausch am Getränkemarkt` : `${drink.name}: Verkaufswelle trifft den Kurs`,
      body: direction === 'up' ? `Ein Trendfonds nimmt ${drink.name} ins Portfolio. Durstige Anleger kaufen, der Kurs legt kräftig zu.` : `Übervolle Lager setzen ${drink.name} unter Druck. Händler lösen ihre Bestände auf, der Kurs gibt nach.`,
    };
  }));
}
const RONCALLI_NEWS:Record<string,Partial<SpecialDefinition>>={
  'bier-down':{targetCents:150,headline:'Bene eröffnet die RageCage-Börse',body:'Der Turnierleiter flutet den Markt mit flüssiger Starthilfe. Bier erhält einen Turnierkurs von höchstens 1,50 €. Bereits günstigere Bieraktien bekommen einen zusätzlichen Abschlag. Analysten rechnen mit steigenden Becherumsätzen.'},
  'bier-up':{headline:'Johnny liquidiert die Bierreserven',body:'Ein einziger Trichterauftrag leert das Orderbuch. Das Angebot schrumpft schneller als Johnnys Durst – Bier-Futures schießen nach oben.'},
  'wein-up':{headline:'Hesham betritt den Handelsraum',body:'Die Eingangstür war noch nicht zu, da meldete der Weinmarkt bereits einen Nachfrageschock. Händler decken sich hektisch mit Trauben-Futures ein; die Preisgrenze bleibt die letzte Handelsbarriere.'},
  'wodka-energy-up':{headline:'Simone löst Wodka-Kaufpanik aus',body:'Ihr Erscheinen wird als bullisches Signal gewertet. Händler sichern hektisch ihre Bestände; der Energy-Sektor zieht solidarisch mit.'},
  'rum-cola-down':{headline:'Jana erschüttert die Roncalli-Finanzmärkte',body:'Die Barkasse meldet eine ungeklärte Differenz von 50 Cent. Anleger verlieren das Vertrauen, Rum-Cola-Fonds gehen in den panischen Ausverkauf.'},
  'rum-cola-up':{headline:'Jana verabschiedet historisches Rettungspaket',body:'Die vermissten 50 Cent sind wieder da. Die Barwirtschaft atmet auf; frische Liquidität treibt Rum-Cola-Kontrakte steil nach oben.'},
  'aperol-down':{headline:'Martin verschärft die Sauberkeitsregulierung',body:'Barchef Martin führt eine Klebrigkeitsobergrenze ein. Händler verkaufen ihre Aperol-Positionen vorsorglich, bevor die Spritz-Steuer auf ungereinigte Gläser kommt.'},
  'limo-up':{headline:'Roncalli-Küchenfonds stoppt die Eiswürfel-Lieferung',body:'Die letzte volle Eiswürfelform gilt plötzlich als strategische Reserve. Kalte Limo wird zum Luxusgut – der Erfrischungsindex steigt.'},
  'shots-up':{headline:'EZB erhöht Leitzins um 0,25 Prozentpunkte',body:'Am kurzen Ende explodieren die Renditen. Shot-Anleger verlangen höhere Ausschüttungen – die Kurse steigen kräftig.'},
  'shots-down':{headline:'EZB senkt Leitzins um 0,25 Prozentpunkte',body:'Das kurze Ende wird mit billiger Liquidität geflutet. Shot-Kontrakte fallen; Anleger empfehlen eine breit gestreute Runde.'},
  'berentzen-down':{headline:'Jana entdeckt stille Apfelreserven',body:'Bei der Roncalli-Inventur taucht eine vergessene Kiste Berentzen auf. Jana meldet überraschende Liquidität; Apfel-Fonds verkaufen, bevor die Barkasse wieder Fragen stellt.'},
  'berentzen-up':{headline:'EZB erhöht Leitzins um 0,25 Prozentpunkte',body:'Am kurzen Ende ziehen die Apfelrenditen kräftig an. Berentzen-Fonds verlangen höhere Ausschüttungen – der Kurs macht einen hochprozentigen Sprung.'},
  'pfeffi-down':{headline:'EZB senkt Leitzins um 0,25 Prozentpunkte',body:'Frische Liquidität flutet den Minz-Sektor. Pfeffi verliert seinen Zinsaufschlag; Händler empfehlen eine breit gestreute grüne Runde.'},
  'pfeffi-up':{headline:'Martin setzt Atemfrische aufs AAA-Rating',body:'Barchef Martin führt im Roncalli-Handelsraum eine Frischepflicht ein. Anleger flüchten in Pfeffi – der Minzmarkt erlebt eine regulatorisch bedingte Rally.'},
  'jaegermeister-up':{headline:'Johnny gründet den Kräuter-Hedgefonds',body:'Johnny kündigt eine feindliche Übernahme aller Jägermeister-Bestände im Roncalli an. Händler stufen jeden verbliebenen Kurzen als systemrelevanten Engpass ein.'},
};
export function createRoncalliSpecialCatalog(drinks:DrinkConfig[]):SpecialDefinition[]{return createSpecialCatalog(drinks).map(special=>({...special,...RONCALLI_NEWS[special.id]}));}
