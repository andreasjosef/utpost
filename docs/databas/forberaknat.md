# Förberäknat i MongoDB (Computed Pattern)

**Förberäknat** = räkna ut ett värde **när datan skrivs** och spara det i dokumentet, i stället för att räkna ut det **varje gång någon läser**. MongoDB kallar det *Computed Pattern*.

## Grundidén

Utan förberäkning gör varje läsning jobbet:

```js
// Varje gång någon öppnar turen: hämta alla punkter, loopa
const tour = await tours.findOne({ _id })
const gain = elevationGain(tour.logs)   // loopar 39 punkter (eller 180 000)
```

Med förberäkning görs jobbet en gång, vid skrivning:

```js
// När turen sparas
const stats = { points: logs.length, elevation_gain_m: elevationGain(logs), ... }
await tours.insertOne({ ...tour, logs, stats })

// Varje läsning efter det: läs bara fältet
await tours.find({}, { projection: { logs: 0 } })   // stats följer med, logs inte
```

## Varför det spelar störst roll i dokumentdatabaser

I Postgres räknar man normalt vid läsning med `count(*)`, `sum()` och `group by`. Databasen är byggd för det, och att duplicera ett värde ses som en risk.

MongoDB utgår från något annat: **forma dokumentet efter hur det läses**. Om klienten ofta läser något ska det redan ligga färdigt i dokumentet.

För Utpost är det det som gör listvyn billig:
- Listan vill visa "39 punkter, 1840 m stigning, 7 h" för 50 turer.
- Att räkna ut det vid läsning kräver att alla loggar hämtas, och det är de 84 % av svaret som mätningen visade (286 kB → 45 kB utan logs).
- Med `stats` i dokumentet kan listan utesluta `logs` helt och ändå visa summeringarna.

**Förberäkningen är det som gör projektionen `{ logs: 0 }` möjlig.** Utan den måste loggarna hämtas ändå, bara för att räkna fram siffrorna.

## Kostnaden: en kopia som kan bli inaktuell

Ett förberäknat värde är en **kopia av information som redan finns** i annan form (loggarna). Om källan ändras och kopian inte gör det, säger de emot varandra.

Frågan att ställa är alltid: **hur ofta ändras källan, och vem uppdaterar kopian?**

| Situation | Risk | Exempel |
|---|---|---|
| Källan ändras aldrig efter att den skrivits | Ingen. Räkna en gång, klart | `stats` från `logs` (en inspelad tur är fast) |
| Källan ändras, i samma dokument | Låg. Uppdatera båda i samma `updateOne` (atomiskt inom ett dokument) | Ny punkt: `$push` till `logs` + `$inc` på `stats.points` |
| Källan ligger i ett annat dokument eller en annan databas | Hög. Inget garanterar att båda uppdateras | `photo_count`, där fotona ligger i Postgres |

Tabellen förklarar besluten i `docs/decisions/databas.md`:
- `stats` är säkert eftersom en inspelad turs loggar inte ändras.
- `photo_count` är en öppen fråga eftersom källan ligger i Postgres, och det finns ingen transaktion över båda databaserna. Läggs ett foto till i Postgres och Mongo-uppdateringen misslyckas blir antalet fel, och ingen märker det.

## Tumregel
Förberäkna när:
1. värdet **läses mycket oftare än det skrivs**,
2. det är **dyrt att räkna ut eller kräver att mycket data hämtas**, och
3. ni kan **säga exakt när och av vem** det uppdateras.

Kan ni inte svara på punkt 3: räkna vid läsning i stället.

## Troliga följdfrågor på onsdag
- **"Vad händer om någon redigerar en turs loggar?"** Räkna om `stats` i samma uppdatering. Det är ett dokument, så uppdateringen är atomisk.
- **"Varför inte räkna i klienten som i dag?"** Då måste klienten hämta alla punkter för att visa en siffra. Det är skulden som betalas av.
- **"Hur vet ni att `stats` stämmer efter migreringen?"** Räkna om från `logs` och jämför med det sparade värdet. Det är ett bra stickprov i M5.
