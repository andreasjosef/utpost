# Projektion i MongoDB – hur den ser ut i kod

Hör till stycket "Listan hämtar inte loggarna" i `docs/decisions/databas.md`.

En projektion är **kolumnlistan i `SELECT`, fast för dokument**: du säger vilka fält Mongo ska skicka tillbaka. Dagens `select * from tours` är samma problem i SQL, för den hämtar allt oavsett om det behövs.

Det finns redan en projektion i repot, i `api/src/db/mongo-smoke.js`:

```js
tours.findOne({ tour_id: tour.id }, { projection: { logs: { $slice: 2 } } })
//            ^ filter (WHERE)       ^ projektion (vilka fält)
```

## Utesluta ett fält: `0`
```js
import { toursCollection } from '../db/mongo.js';

const tours = await toursCollection()
  .find({}, { projection: { logs: 0 } })   // allt utom logs
  .sort({ started_at: -1 })                // använder indexet { started_at: -1 }
  .limit(50)
  .toArray();
```

## Ta med fält: `1`
```js
.find({}, { projection: { title: 1, user_id: 1, guide_id: 1, distance_m: 1, started_at: 1, stats: 1 } })
// _id följer alltid med, om du inte skriver _id: 0
```

**1:or och 0:or går inte att blanda** i samma projektion; enda undantaget är `_id: 0`. Välj en stil:
- **`{ logs: 0 }`** är kort. Varje nytt fält som läggs till senare följer också med automatiskt, och det är ett problem om det nya fältet är stort.
- **Att lista fälten med `1`** är tydligt och fungerar som ett kontrakt: listan skickar exakt det `ToursView` visar. Den här stilen för listan, av samma skäl som man skriver kolumnnamn i stället för `select *`.

## En del av en array: `$slice`
```js
{ projection: { logs: { $slice: 2 } } }    // de 2 första punkterna
{ projection: { logs: { $slice: -1 } } }   // bara den sista punkten
```

## Varför det spelar roll: datan lämnar aldrig Mongo
Projektionen körs **i databasen**. Att ta bort fältet i JavaScript efteråt ger samma svar men hjälper inte:

```js
// Fel: alla loggar skickas över nätverket till API:et och slängs sedan
const all = await tours.find({}).toArray();
const out = all.map(({ logs, ...rest }) => rest);
```

Det är det `jq 'map(del(.logs))'` i `scripts/measure-tours.sh` simulerar. 45 kB är **svaret till klienten**. En projektion sparar lika mycket mellan Mongo och API:et också.

## Hela listrouten, skissad (M5 – inget ändrat än)
Med förslaget till öppen fråga 1 (slå upp namnen i en omgång i Postgres):

```js
toursRouter.get('/', async (req, res) => {
  // 1 Mongo-fråga: 50 turer, utan logs
  const tours = await toursCollection()
    .find({}, { projection: { title: 1, user_id: 1, guide_id: 1, distance_m: 1, started_at: 1, stats: 1 } })
    .sort({ started_at: -1 })
    .limit(50)
    .toArray();

  // 2 Postgres-frågor: alla namn på en gång, i stället för en per tur
  const userIds = [...new Set(tours.map((t) => t.user_id))];
  const guideIds = [...new Set(tours.map((t) => t.guide_id).filter(Boolean))];
  const users = await pool.query('select id, display_name from users where id = any($1)', [userIds]);
  const guides = await pool.query('select id, title from guides where id = any($1)', [guideIds]);

  const userById = new Map(users.rows.map((u) => [u.id, u]));
  const guideById = new Map(guides.rows.map((g) => [g.id, g]));

  res.json(tours.map((t) => ({
    ...t,
    user: userById.get(t.user_id),
    guide: guideById.get(t.guide_id) ?? null,
  })));
});
```

3 frågor i stället för 186, och ca 45 kB i stället för 286.

Lägg märke till att Postgres-frågorna också projicerar: `select id, display_name`, inte `select *`.

## Kopplingen till skuldlistan (`docs/debt.md`)
Det här betalar av mer än storleken. Användbart i "Bakgrund" ("vilken skuld betalar det här av?"):

| Skuld | Vad | Hur M3-modellen hjälper |
|---|---|---|
| **#8** | N+1-frågor i `GET /api/tours` | 186 → 3 frågor |
| **#1** | `/api/tours` skickar hela `users`-raden, inklusive `password_hash`. Kontrollerat 2026-10-08: svaret innehåller `"plaintext:hemligt123"` (skuld #2 – lösenorden ligger i klartext) | `select id, display_name` skickar bara namnet |
| **#10** | Inga främmande nycklar, föräldralösa rader | Loggar och foton inbäddade i turen; tas turen bort försvinner allt (foton blir i dag kvar) |

Var ärlig: #1 betalas av **projektionen mot Postgres**, inte av Mongo. Den rättelsen kan (och bör) göras redan nu, oberoende av databasvalet.
