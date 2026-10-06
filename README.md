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

Kräver **Node 22.18 eller senare**. API:et är delvis skrivet i TypeScript och körs
direkt av Node, som tar bort typerna själv (inget byggsteg). CI kör Node 24.

```bash
npm install
docker compose -f docker-compose.dev.yml up -d
npm run seed
npm run dev
```

`npm run dev` startar API:et, React-appen och Vue-klienten samtidigt. React-appen
ligger sen på http://localhost:3000, Vue-klienten på http://localhost:3001 och
API:et på http://localhost:4000. Var för sig: `npm run dev:api`, `npm run dev:web`
och `npm run dev:client`.

`npm start` finns fortfarande inte i roten använd `npm run dev`.

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
