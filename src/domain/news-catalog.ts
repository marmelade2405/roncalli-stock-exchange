import type { DrinkConfig, SpecialDefinition } from './model.js';
import {hasVariablePrice} from './prices.js';
const STANDARD: SpecialDefinition[] = [
  {
    "id": "bier-down",
    "drinkId": "bier",
    "direction": "down",
    "percent": -40,
    "headline": "Bier-Futures im freien Fall",
    "body": "Söder kündigt eine Bierpreisbremse an. Händler werfen Maß-Kontrakte auf den Markt – der Bierkurs rauscht ab."
  },
  {
    "id": "bier-up",
    "drinkId": "bier",
    "direction": "up",
    "percent": 40,
    "headline": "Kaufpanik am Gerstenmarkt",
    "body": "Die Maß wird zur strategischen Reserve erklärt. Bierfonds sichern sich die Restbestände und treiben den Kurs nach oben."
  },
  {
    "id": "radler-down",
    "drinkId": "radler",
    "direction": "down",
    "percent": -40,
    "headline": "Radler-Index verliert den Halt",
    "body": "Der Fahrradverband empfiehlt plötzlich stilles Wasser. Anleger steigen aus Zitrus-Kontrakten aus – Radler gerät unter Verkaufsdruck."
  },
  {
    "id": "radler-up",
    "drinkId": "radler",
    "direction": "up",
    "percent": 40,
    "headline": "Zitronen-OPEC verknappt das Angebot",
    "body": "Die Zitrusmächte drosseln ihre Förderung. Radler-Futures ziehen an, während Händler hektisch Fahrradklingeln läuten."
  },
  {
    "id": "cola-down",
    "drinkId": "cola",
    "direction": "down",
    "percent": -40,
    "headline": "Cola-Markt von Liquidität geflutet",
    "body": "Eine Mensa eröffnet die Cola-Flatrate. Das Überangebot löst einen Ausverkauf im Koffein-Sektor aus."
  },
  {
    "id": "cola-up",
    "drinkId": "cola",
    "direction": "up",
    "percent": 40,
    "headline": "Koffein wird zur Leitwährung",
    "body": "Die Nachtschicht entdeckt Cola als krisenfeste Anlage. Fonds schichten um, der Brausekurs schießt nach oben."
  },
  {
    "id": "wasser-down",
    "drinkId": "wasser",
    "direction": "down",
    "percent": -40,
    "headline": "Brunnen erhält Spitzenrating AAA",
    "body": "Die Ratingagentur bescheinigt dem Dorfbrunnen unbegrenzte Liquidität. Wasser-Anleger verkaufen, der Kurs tropft in den Keller."
  },
  {
    "id": "wasser-up",
    "drinkId": "wasser",
    "direction": "up",
    "percent": 40,
    "headline": "Durstige Fonds suchen sicheren Hafen",
    "body": "Luxusinvestoren erklären Leitungswasser zum blauen Gold. Trockene Kehlen treiben die Nachfrage – der Wasserindex steigt."
  },
  {
    "id": "gin-tonic-down",
    "drinkId": "gin-tonic",
    "direction": "down",
    "percent": -40,
    "headline": "Wacholder-Lager brechen alle Rekorde",
    "body": "Der Gartenverein meldet eine historische Wacholderernte. Gin-Produzenten fluten den Markt, der Tonic-Sektor knickt ein."
  },
  {
    "id": "gin-tonic-up",
    "drinkId": "gin-tonic",
    "direction": "up",
    "percent": 40,
    "headline": "Wacholder-Futures mit Kurssprung",
    "body": "Ein Trendbericht erklärt Gin Tonic zum Pflichtbestandteil jedes Start-ups. Hipster-Fonds kaufen alles, was nach Botanicals klingt."
  },
  {
    "id": "cuba-libre-down",
    "drinkId": "cuba-libre",
    "direction": "down",
    "percent": -40,
    "headline": "Rum-Reserven überraschend freigegeben",
    "body": "Ein Hafen findet vergessene Rumcontainer. Das Überangebot setzt Cuba-Libre-Kontrakte unter massiven Verkaufsdruck."
  },
  {
    "id": "cuba-libre-up",
    "drinkId": "cuba-libre",
    "direction": "up",
    "percent": 40,
    "headline": "Karibik-Rally erfasst den Longdrinkmarkt",
    "body": "Ein Reisefonds tauscht Flugtickets gegen Rum-Kontrakte. Cuba Libre profitiert von der Flucht in liquide Urlaubsanlagen."
  },
  {
    "id": "wodka-orange-down",
    "drinkId": "wodka-orange",
    "direction": "down",
    "percent": -40,
    "headline": "Saftfonds löst Orangenreserve auf",
    "body": "Tiefgekühlte Orangenvorräte kommen gleichzeitig auf den Markt. Wodka-Orange-Futures verlieren ihren frisch gepressten Aufschlag."
  },
  {
    "id": "wodka-orange-up",
    "drinkId": "wodka-orange",
    "direction": "up",
    "percent": 40,
    "headline": "Orangen-Kartell dreht den Hahn zu",
    "body": "Die Frühstückslobby sichert sich die Orangenernte. Longdrink-Händler bieten gegeneinander – Wodka Orange legt kräftig zu."
  },
  {
    "id": "whisky-cola-down",
    "drinkId": "whisky-cola",
    "direction": "down",
    "percent": -40,
    "headline": "Kellerfund erschüttert den Fassmarkt",
    "body": "Der Hausmeister entdeckt vergessene Whiskybestände. Händler sprechen von einem Liquiditätsschock, Whisky Cola rutscht ab."
  },
  {
    "id": "whisky-cola-up",
    "drinkId": "whisky-cola",
    "direction": "up",
    "percent": 40,
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
};
export function createSpecialCatalog(drinks: DrinkConfig[]): SpecialDefinition[] {
  return drinks.filter(hasVariablePrice).flatMap(drink => (['down','up'] as const).map(direction => {
    const text=BAR_NEWS[drink.id]?.[direction==='down'?0:1];
    if(text)return{id:`${drink.id}-${direction}`,drinkId:drink.id,direction,percent:direction==='up'?40:-40,headline:text[0],body:text[1]};
    const standard = STANDARD.find(s => s.drinkId === drink.id && s.direction === direction);
    return standard ? { ...standard } : {
      id: `${drink.id}-${direction}`, drinkId: drink.id, direction, percent: direction === 'up' ? 40 : -40,
      headline: direction === 'up' ? `${drink.name}: Kaufrausch am Getränkemarkt` : `${drink.name}: Verkaufswelle trifft den Kurs`,
      body: direction === 'up' ? `Ein Trendfonds nimmt ${drink.name} ins Portfolio. Durstige Anleger kaufen, der Kurs legt kräftig zu.` : `Übervolle Lager setzen ${drink.name} unter Druck. Händler lösen ihre Bestände auf, der Kurs gibt nach.`,
    };
  }));
}
