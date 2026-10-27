# Utpost

Plattform för friluftsdestinationer. Redaktionella guider, användarnas egna turer och bilder.

## Branchstrategi

GitHub Flow: `main` är alltid deploybar, feature-branches hålls korta och går
via PR innan de mergas tillbaka. `main` har en aktiv branch-ruleset som
blockerar direktpush, så PR är redan ett tekniskt krav och kräver minst 1
review. Codeowner fil är på plats i `.github/CODEOWNERS`. Just nu kan alla
medlemmar godkänna alla PRs men filen kommer att fyllas på under projektets
gång.

Vi väljer GitHub Flow för enkelhetens skull just nu. Git Flows extra grenar
(develop/release) löser problem vi inte har. Vi är ett litet team som kommer att
committa och deploya ofta och Git Flow är väl lämplig för det. Vi avser dock utforska feature flags och röra oss mot trunk-based som ett lärande inom projektet.

## Working agreement

- **Pushfrekvens**: Minst en gång per arbetsdag / vid slutet av varje arbetspass.
- **Godkänna en PR**: 1 godkännande från en annan utvecklare krävs. När CI-pipelinen landar (väntas nästa vecka) läggs krav på grön pipeline till.
- **Hur vi når varandra**: Discord.
- **När någon fastnar**: Timeboxa ~30 min egen diagnos. Fortfarande fast → sammanställ nuläget till en tydlig kontext + fråga, posta i Discord och tagga @alla.

*Det här avsnittet kommer att uppdateras under projektets gång.*

---

## Kom igång

Det finns två sätt. Båda kräver Docker.

### A. Allt i Docker

Kräver bara Docker, inte Node.

```bash
docker compose up --build -d
docker compose exec api npm run seed
```

Har du Node installerat gör `npm start` samma sak som första raden och `npm stop`
samma sak som `docker compose down` (med podman om Docker saknas).

Compose startar fyra tjänster i bakgrunden: `postgres`, `mongo`, `api` och `client`.
Vue-klienten (nginx) ligger på http://localhost:3001. API:et har ingen egen publicerad port utan nås
via nginx-proxyn i klienten: http://localhost:3001/api/health och GraphiQL på http://localhost:3001/graphql.
Seeden behövs bara första gången, eftersom datan ligger kvar i volymerna. Följ
loggarna med `docker compose logs -f`. Stoppa med `docker compose down` (lägg till
`-v` för att tömma databaserna).

### Docker-images och storlek (M4)

Klienten byggs med multi-stage build (`client/Dockerfile`) där steg 1 bygger med Node och steg 2 serverar `dist/` via `nginx:1.27-alpine`:

| Image | Bas / Metod | DISK USAGE | CONTENT SIZE |
| --- | --- | --- | --- |
| `client` (före M4) | `node:22-alpine` + Vite preview + node_modules | ~369 MB (539 MB) | ~131 MB |
| `client` (efter M4) | `nginx:1.27-alpine` multi-stage | **~74 MB** | **21 MB** |

Client-imagen minskade med ~80 % och ligger väl under gränsen på 100 MB.

### B. Databaserna i Docker, appen på din dator

Kräver **Node 22.18 eller senare**. API:et är delvis skrivet i TypeScript och körs
direkt av Node, som tar bort typerna själv (inget byggsteg). CI kör Node 24.

```bash
npm install
npm run db:up      # docker compose up -d postgres mongo
npm run seed
npm run dev
```

`npm run dev` startar databaserna (om de inte redan kör) och sen API:et, React-appen
och Vue-klienten samtidigt med omladdning vid ändringar. React-appen ligger sen på
http://localhost:3000, Vue-klienten på http://localhost:3001 och API:et på
http://localhost:4000. Var för sig:
`npm run dev:api`, `npm run dev:web` och `npm run dev:client`. Stoppa databaserna
med `npm run db:down`.

API:et når databaserna på `localhost:5433` och `localhost:27017`, som är de portar
compose publicerar på värden. Inne i compose (A) heter de i stället `postgres:5432`
och `mongo:27017`.

## Kommandon

Körs från roten. Alla fem körs även i CI (se [`docs/pipeline.md`](docs/pipeline.md)).

| Kommando | Gör |
| --- | --- |
| `npm run lint` | ESLint på `client/` |
| `npm run format:check` | Prettier kollar formateringen i `client/src/` (ändrar inget) |
| `npm run typecheck` | Typkontroll: `vue-tsc` i `client/` och `tsc --noEmit` i `api/` (ändrar inget) |
| `npm test` | Vitest kör testerna i `client/` en gång och avslutar |
| `npm run build` | Vite bygger `client/` till `client/dist` |

Formatera koden lokalt med `npm run format --workspace=client`.

## Struktur

- `api/` – Express + Postgres (Drizzle) + MongoDB (driver). REST under `/api` och GraphQL (graphql-yoga) på `/graphql`, med GraphiQL i webbläsaren på `GET /graphql` i utveckling (`api/src/graphql/`)
- `web/` – React + Vite (den gamla appen, vyerna portas över till `client/`)
- `client/` – Vue 3 + Vue Router + Pinia + Vite (port 3001). Multi-stage build med Nginx serverar statiska filer och proxar `/api` och `/graphql` till `api:4000`.
- `shared/` – `@utpost/shared`, API-kontraktet: typerna för det som går mellan `api/` och `client/`. Ren TypeScript, inget bygge. Ändras ett API-svar ändras typen här i samma PR.

## Mätning före/efter (M5)

### N+1 i GraphQL

Den tyngsta frågan är turlistan med exakt de fält som turlistan i klienten visar (`ToursView`):

```graphql
query Turer {
  tours {
    id
    title
    distanceM
    startedAt
    user { displayName }
    guide { title slug }
    photos { id }
  }
}
```

Mätt före DataLoader, med API:et startat från `main` mot seedad Postgres och frågan skickad med namn.
Siffran kommer ur API-loggen (`graphql Turer: 135 databasfrågor`).

| Fråga   | Databasfrågor före | Efter |
| ------- | ------------------ | ----- |
| `Turer` | 135                |       |

135 = 1 (turerna) + 50 (`user`, en per tur) + 34 (`guide`, en per tur som har en guide) + 50 (`photos`, en per tur).
Seeden slumpar om en tur har en guide (ca 75 %), så före-siffran varierar lite mellan databaser – formeln är densamma.

## Deploy

Fråga Marcus. TODO: update
