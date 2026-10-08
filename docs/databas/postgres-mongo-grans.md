# Vad stannar i Postgres – gränsen mellan databaserna

Underlag till avsnittet "Vad som stannar i Postgres" i `docs/decisions/databas.md`. **Ej inskrivet i beslutsdokumentet än.**

## Regeln
> **Allt som tillhör en enda tur ligger i turdokumentet. Det som delas av många turer stannar i Postgres. Mongo får referera till Postgres (`user_id`, `guide_id`), men Postgres refererar aldrig till Mongo.**

Den svarar på "varför just den gränsen?" för varje tabell. Referenserna pekar bara åt ett håll, mot stabila heltals-id:n i Postgres.

## Tabell för tabell

| Tabell | Var | Varför |
|---|---|---|
| `users` | **Postgres** | Inloggning slår upp på e-post. E-posten måste vara unik och datan är säkerhetskritisk. Refereras från både guider (`author_id`) och turer. Delad, konsekvent data, det en relationsdatabas är gjord för. |
| `guides` | **Postgres** | `/search` filtrerar på två kolumner, `/regions` använder `distinct`, `/:slug` slår upp på slug, `/popular` filtrerar på `published`. Vanlig SQL. Bara 40 rader och inget uppmätt problem. |
| `tours` | **Mongo** | Redan beslutat. |
| `tour_logs` | **Mongo**, inbäddat i turen | Redan beslutat. Tabellen tas bort efter verifieringen i M5. |
| `photos` | **Mongo**, inbäddat i turen | Ändrat från första utkastet, se nedan. |

## Varför foton flyttar

När turerna ligger i Mongo skulle `photos.tour_id` i Postgres peka på **ett dokument i en annan databas**. Den referensen kan ingenting kontrollera.

Foton har samma form som loggarna:
- de finns bara som en del av en tur
- de läses bara ihop med den (`/photos/tour/:tourId`, plus antalet i listvyn)
- de är få (0–3 per tur)
- de är bara metadata (filnamn, bredd, höjd); själva filerna ligger i `uploads/`

Inbäddning löser också **öppen fråga 2** (`photo_count`). Uppladdning blir `$push` till `photos` plus `$inc` på `stats.photo_count` i **en enda `updateOne`**, som är atomisk. Inget problem mellan två databaser kvar.

Det rättar också en bugg som finns i dag: `DELETE /tours/:id` tar bort loggarna och turen men **lämnar fotona kvar som föräldralösa rader**. Med allt i ett dokument tar borttagningen av turen bort allt.

## Svagheter i Postgres-argumentet (var ärlig om dem)

Mallen vill ha motivering med **relationer, transaktioner och sökning**. Schemat stöder det bara delvis i dag:
- **Inga constraints alls.** Inga främmande nycklar, ingen `unique` på `users.email` eller `guides.slug`. "Relationer" är ett argument för constraints vi **borde** ha, inte sådana vi har. Lägg till dem i M5, eller ta upp dem under Konsekvenser.
- **Appen använder inga transaktioner i dag.** Argumentet gäller det som kommer (ta bort en användare, publicering hos redaktionen).
- **Vår Mongo klarar inte transaktioner över flera dokument.** `mongo:8.2` i compose kör fristående, inte som replica set. Uppdateringar av ett enskilt dokument är fortfarande atomiska. Ännu ett skäl att allt för en tur ska ligga i **ett** dokument.
- **Sökningen är öppen för SQL-injektion.** `/search` sätter in söktermen direkt i SQL-strängen (`'%${q}%'`). Den skulden finns oavsett databasval och hör inte hemma här, men ha en länk till `debt.md` redo.
- **"Kunde ni inte bara rätta frågan?"** För listan mest ja: en join och att utesluta `logs` löser det mesta av de 186 frågorna och 286 kB. Mongo-argumentet är att `tour_logs` växer med varje inspelad tur, och att läsa en tur blir att läsa ett dokument. Ha det redo, och ta med det under "Alternativ vi jämförde".

## Om det skrivs in i beslutsdokumentet
1. Fyll i "Vad som stannar i Postgres" med users och guides, enligt regeln ovan.
2. Uppdatera dokumentmodellen: lägg till `photos: [{ filename, width, height, created_at }]` och `stats.photo_count`, och ta bort "Utanför dokumentet: foton".
3. Byt ut öppen fråga 2 mot det nya beslutet. Öppen fråga 1 (användar- och guidenamn i listan) står kvar.
