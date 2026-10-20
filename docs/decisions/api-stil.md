# Beslutsdokument: API-stil

*Ett av teamets sex beslutsdokument. Skrivs i M4, hålls levande. Samma mall som `testing.md` och `databas.md`.*

**Datum:** 2026-10-20  
**Beslut:** GraphQL kompletterar REST. Startsidan och tur-vyerna hämtar sin data via GraphQL för att eliminera over-fetching och onödiga nätverksanrop, medan REST behålls för autentisering (`/api/auth`), hälsokontroller (`/api/health`) och fil/bilduppladdning.

## Bakgrund

Vi ärvde en arkitektur där startsidan i den gamla React-klienten (`web/src/pages/Home.jsx`) gör fem separata REST-anrop vid sidladdning (skuld 6), trots att sidan bara använder en bråkdel av datan som returneras. Likaså skickar turlistan (`/api/tours`) tusentals interna mätpunkter (`tour_logs`) som listvyn inte ens renderar.

Uppmätt 2026-10-20 mot vår lokala, seedade Postgres-databas (12 användare, 40 guider, 200 turer):

| Vy | REST: anrop | REST: byte | GraphQL: anrop | GraphQL: byte | Databasfrågor (API-loggen) |
|---|---|---|---|---|---|
| Startsidan | 5 | 30 937 B (~31 kB) | 1 | 5 599 B (~5.6 kB) | REST: 6 (4 exkl. health) · GraphQL: 4 |
| Turlistan | 1 | 280 393 B (~280 kB) | 1 | 7 085 B (~7.1 kB) | REST: 201 · GraphQL: 135 |

Resultatet visar att GraphQL minskar nätverksvolymen på startsidan med över 81 % och slår ihop 5 anrop till 1 enda anrop. För turlistan reduceras datamängden med 97,5 % genom att mätpunkter (`tour_logs`) inte efterfrågas.

## Schemat i korthet

Schemat i SDL (`api/src/graphql/schema.js`) definierar domänmodellerna:
- **Typer:** `Guide`, `Tour`, `User`, `Photo`, `LogPoint`.
- **Query:** `guides`, `popularGuides(limit)`, `guide(slug)`, `regions`, `tours(limit)`, `tour(id)`.
- **Mutation:** `createTour(input: CreateTourInput!): Tour!`.

Fälten är döpta enligt JavaScript/klient-standard med camelCase (`lengthKm`, `bodyHtml`, `heroImage`, `updatedAt`, `startedAt`, `distanceM`, `displayName`) i stället för Postgres-kolumnernas snake_case. Översättningen hanteras av fältresolvers i `api/src/graphql/resolvers.js`.

**Medvetet exkluderat ur schemat:**
- `User.password_hash` – finns på databasraden men exponeras inte i schemat och kan därför aldrig läcka till klienter.
- `User.email` – ingen vy i klienten behöver visa användarnas e-postadresser publikt; endast `displayName` och `id` exponeras.

## Vad som går via GraphQL och vad som stannar i REST

- **`/graphql` (GraphQL):**
  - Startsidan (`HomeView`): kombinerar guider, populära guider, regioner och senaste turer i en fråga.
  - Turer och turlistor (`ToursView`, `TourDetailView`): deklarativ hämtning av specifika fält och relationer utan att transportera tusentals tunga GPS-loggar.
  - Guider (`GuidesView`, `GuideDetailView`): filtrering och hämtning per slug.
  - Skapa turer (`createTour` mutation): mutation med JWT i context och strikt validering (`UNAUTHENTICATED`).
- **`/api/auth` (REST):** Inloggning och registrering stannar i REST. Det hanterar HTTP-statuskoder (401/400), sätter tokens och passar standardiserade webbsäkerhetsmönster utan overhead.
- **`/api/health` (REST):** Stannar i REST. Docker Compose och driftsättning kräver enkla HTTP GET-anrop som svarar med 200 eller 503 och ren JSON.
- **`/api/photos` (REST):** Filuppladdning stannar i REST. Binärdata i form av `multipart/form-data` hanteras renare och mer resurssnålt via Express-middleware än via GraphQL-mutations.

## Alternativ vi jämförde

1. **Optimera och bygga ut REST-endpointsen (BFF/sammansatta endpoints):**
   - *För:* Inga nya bibliotek (`graphql-yoga`), bekant felhantering och standard HTTP-caching.
   - *Emot:* Leder till "endpoint-explosion" där varje vy kräver egna skräddarsydda endpoints (t.ex. `/api/home-summary`). REST saknar ett deklarativt typkontrakt mellan klient och server som klienten kan specificera.
2. **Migrera precis allt till GraphQL:**
   - *För:* En enda anropsstil och ett gemensamt protokoll för all kommunikation.
   - *Emot:* Gör infrastruktur och övervakning svårare (hälsokontroller kan inte göra standard GET), skapar onödig komplexitet kring JWT-autentisering/cookies och försvårar binär filuppladdning.

**Valt:** En hybridlösning där GraphQL används för innehållshämtning och dataintensiva vyer, medan REST sköter infrastruktur, auth och filströmmar.

## Konsekvenser

- **Felhantering (200 med errors):** GraphQL svarar oftast med HTTP status 200 även om delar av frågan misslyckas. Klienten kan inte förlita sig på `response.ok` utan måste kontrollera `body.errors`, vilket vår hjälpare `gql()` i `client/src/graphql.ts` gör.
- **Cachning:** Till skillnad från REST-anrop som lätt kan cachas på URL-nivå i webbläsare eller CDN, använder GraphQL `POST`-anrop. Avancerad klientcaching och normalisering hanteras i M5 (Apollo Client/Urql).
- **N+1-frågor i resolvers:** I vår v1 slår fältresolvers upp `Tour.user` och `Tour.guide` med enskilda databasfrågor per tur (135 frågor för 50 turer). Detta problem löses i M5 när turer flyttar till MongoDB och relationer batchas med DataLoader.
- **Manuella typer före codegen:** I M4 skrivs TypeScript-gränssnitten i klienten (`HomeData`, `GuideSummary`) för hand. Detta automatiseras i M5 med GraphQL Code Generator.
- **Två klienter under migrering:** Under övergångsperioden existerar både `api.ts` (REST) och `graphql.ts` (GraphQL) sida vid sida i klienten.

**Skrivet av:** Joakim och Andreas
