import DataLoader from "dataloader";

// M5: N+1-lösningen. En DataLoader samlar alla .load(id) som görs under samma varv i Node
// och gör EN databasfråga för hela listan: `where id = any($1)` i stället för en fråga per rad.
// Loaders skapas per anrop (i context), aldrig globalt – annars delar alla anrop och alla
// användare samma cache, och något som ändrats hämtas aldrig om.
//
// Kontraktet för en batchfunktion: in = lista med nycklar, ut = lista med svar i SAMMA ordning
// och SAMMA längd (saknas raden: null, eller [] för en lista). Postgres lovar ingen ordning,
// så raderna läggs i en Map och plockas ut i nycklarnas ordning.
const byId = (rows, ids) => {
  const map = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => map.get(id) ?? null);
};

const groupBy = (rows, key, ids) => {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row[key])) map.set(row[key], []);
    map.get(row[key]).push(row);
  }
  return ids.map((id) => map.get(id) ?? []);
};

export const createLoaders = ({ query, mongoFind }) => ({
  // Tour.user: 50 turer → EN fråga, inte 50
  user: new DataLoader(async (ids) =>
    byId(
      (await query("select * from users where id = any($1)", [ids])).rows,
      ids,
    ),
  ),
  guide: new DataLoader(async (ids) =>
    byId(
      (await query("select * from guides where id = any($1)", [ids])).rows,
      ids,
    ),
  ),
  // Tour.photos: en-till-många – gruppera på tour_id
  photos: new DataLoader(async (tourIds) =>
    groupBy(
      (
        await query(
          "select * from photos where tour_id = any($1) order by id",
          [tourIds],
        )
      ).rows,
      "tour_id",
      tourIds,
    ),
  ),
  // Tour.logs: mätpunkterna ligger i MongoDB sedan M5 (ett dokument per tur, logs inbäddat,
  // redan i tidsordning). Samma mönster: en fråga för alla turer i svaret.
  // Tour.id är ett tal från Postgres; dokumentets tour_id är också ett tal.
  logs: new DataLoader(async (tourIds) => {
    const docs = await mongoFind(
      "tours",
      { tour_id: { $in: tourIds } },
      { tour_id: 1, logs: 1 },
    );
    const map = new Map(docs.map((d) => [d.tour_id, d.logs]));
    return tourIds.map((id) => map.get(id) ?? []);
  }),
});
