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
Vue-klienten ligger på http://localhost:3001 och API:et på http://localhost:4000.
Seeden behövs bara första gången, eftersom datan ligger kvar i volymerna. Följ
loggarna med `docker compose logs -f`. Stoppa med `docker compose down` (lägg till
`-v` för att tömma databaserna).

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

- `api/` – Express + Postgres (Drizzle)
- `web/` – React + Vite (den gamla appen, vyerna portas över till `client/`)
- `client/` – Vue 3 + Vue Router + Pinia + Vite (den nya klienten, TypeScript)
- `shared/` – `@utpost/shared`, API-kontraktet: typerna för det som går mellan `api/` och `client/`. Ren TypeScript, inget bygge. Ändras ett API-svar ändras typen här i samma PR.

## Deploy

Fråga Marcus. TODO: update
