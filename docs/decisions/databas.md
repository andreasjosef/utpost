# Beslutsdokument: databasval

*Ett av teamets sex beslutsdokument. Skrivs i M3, hålls levande. Samma mall som `docs/testing.md`. Fyll i varje rubrik – en sida räcker, men varje påstående ska gå att försvara muntligt på onsdag.*

**Datum:** 2026-10-
**Beslut:** *(en eller två meningar: vad ligger i Postgres, vad ligger i MongoDB, och varför just den gränsen)*

## Bakgrund
*(Vad ärvde ni? Vilken skuld betalar det här av? Vad kostar `/api/tours` i dag – mät: storlek på svaret, antal databasfrågor, antal rader i `tour_logs`.)*

## Dokumentmodellen för turer
> **FÖRSLAG – ej godkänt av teamet.** Två öppna frågor längst ner i avsnittet.

En tur blir ett dokument i collectionen `tours`. Mätpunkterna bäddas in i turen; användare, guider och foton refereras och stannar i Postgres.

```json
{
  "_id": "ObjectId(...)",
  "tour_id": 1,
  "user_id": 4,
  "guide_id": 12,
  "title": "Kebnekaise västra leden",
  "started_at": "2026-08-14T06:30:00Z",
  "distance_m": 18400,
  "notes": "Dimma efter fjällstationen",
  "stats": {
    "points": 300,
    "duration_s": 25200,
    "elevation_gain_m": 1840,
    "max_hr": 172,
    "avg_hr": 128
  },
  "logs": [
    { "t": "2026-08-14T06:30:00Z", "lat": 67.85, "lon": 18.60, "elevation_m": 690, "heart_rate": 96, "note": null }
  ]
}
```

**Inbäddat: `logs`.** Mätpunkterna läses alltid tillsammans med sin tur, tillhör bara den turen och ändras aldrig efter att de spelats in. Det är fallet dokumentmodellen är gjord för: allt som läses ihop ligger ihop, och en tur blir en läsning i stället för en fråga mot `tours` plus en mot `tour_logs`.

**Refererat: `user_id`, `guide_id`.** Användare och guider delas av många turer och ändras oberoende av dem. Kopierar vi in namnet i varje tur måste vi uppdatera alla turer när någon byter namn.

**Utanför dokumentet: foton.** De har en egen livscykel (uppladdning, borttagning) och ligger kvar i Postgres med `tour_id`.

**Förberäknat: `stats`.** Loggarna skrivs en gång och läses många gånger, så summeringarna räknas ut när turen sparas, inte vid varje läsning. `elevation_gain_m` räknas i dag i klienten (`client/src/lib/elevation.ts`) och flyttar till skrivningen. Eftersom loggarna aldrig ändras kan `stats` inte bli inaktuell.

**`tour_id`** är Postgres-id:t. Det följer med tills migreringen är verifierad (M5), så att vi kan jämföra tur för tur. Därefter tas det bort.

**Storlek och gräns.** Den största turen har i dag *__* mätpunkter (seeden: 20–39 per tur, en var 5:e minut), vilket blir *__ kB* per dokument (mätt med `mongo:smoke`). Gränsen 16 MB motsvarar då ungefär *__* punkter – en tur med en punkt per sekund i *__* timmar. Vi är långt från gränsen; om den någon gång närmar sig delar vi loggarna i bitar (bucket-mönstret), men det bygger vi inte nu.

**Listan hämtar inte loggarna.** `GET /api/tours` frågar med en projektion som utesluter `logs` (`{ logs: 0 }`). Listvyn visar titel, användare, guide och längd, inte mätpunkter. Det här betalar av skulden: i dag skickar listan alla mätpunkter för 50 turer (84 % av ett svar på 286 kB) och ställer 186 frågor (1 + 3 per tur + 1 per tur med guide).

**Index**, utifrån de frågor klienten ställer:

| Index | Fråga |
|---|---|
| `{ tour_id: 1 }` unikt | Uppslag och verifiering under migreringen |
| `{ started_at: -1 }` | `/api/tours` och `/api/tours/latest` – senaste först |
| `{ user_id: 1, started_at: -1 }` | En användares turer, senaste först |

`/api/tours/:id` använder `_id`, som alltid har ett index.

**Öppna frågor till teamet**
1. **Användare och guide i listan.** `ToursView` visar `user.display_name` och `guide.title`. Förslag: hämta dem ur Postgres i *en* fråga (`where id = any($1)`) för alla turer i listan, så att det blir 1 Mongo-fråga och 2 Postgres-frågor i stället för 1 + 4 × 50. Alternativet är att kopiera in namnen i dokumentet. Det ger färre frågor, men namnen blir inaktuella när någon byter namn.
2. **Antal foton.** Listan visar `photos.length`. Ska `stats.photo_count` förberäknas? Då måste den uppdateras i Mongo varje gång ett foto läggs till eller tas bort i Postgres, och det finns ingen transaktion över båda databaserna. Förslag: räkna antalet i samma Postgres-fråga (`group by tour_id`) och inte förberäkna det.

## Vad som stannar i Postgres
*(Guider, användare, foton? Motivera per tabell: relationer, transaktioner, sökning.)*

## Så här ska migreringen gå till (genomförs i M5)
*(Steg för steg: skript som läser ur Postgres och skriver till Mongo · hur `/api/tours` byter källa · hur ni verifierar att inget tappats (antal turer, antal punkter, stickprov) · vad som händer med `tour_logs`-tabellen efteråt.)*

## Alternativ vi jämförde
*(Minst två: t.ex. behålla allt i Postgres men med `jsonb`-kolumn för loggarna · allt till MongoDB · MongoDB för loggarna, Postgres för resten. För varje: vad talar för, vad talar emot.)*

## Konsekvenser
*(Två databaser att drifta och backa upp. Två anslutningssträngar i miljön. Vad kräver det av compose, av pipelinen, av molnet i M6?)*

**Skrivet av:** *(namn – den som signerar ska kunna försvara det)*
