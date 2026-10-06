# Teststrategi – Utpost

*Beslutsdokument. Skrivs av teamet i M2 och hålls levande: ändras strategin ändras dokumentet i samma PR.*

**Datum:** 2026-10-06

**Beslut:** Vi testar Vue-klienten med Vitest på två nivåer: enhetstester för ren logik och komponenttester med Vue Testing Library för vyerna. API:et mockas med `vi.mock('@/api')`, typat mot `@utpost/shared`. Kontraktet mellan `api/` och `client/` skyddas av typkontrollen i CI, inte av tester. Vi har inget täckningskrav. Istället kräver vi att varje vy täcker laddad data, tomt läge, API-fel och (där den finns) sökning, och att varje buggfix börjar med ett test som är rött.

## Bakgrund

Utpost är ärvd kod utan tester. Efter M1 körde pipelinen ett enda röktest (`smoke.test.js`) som bara bevisade att CI kör tester. Under M2 har vi:

- portat tre datavyer (`GuidesView`, `GuideDetailView`, `ToursView`) och inloggningen till Vue och TypeScript,
- infört ett delat kontrakt (`@utpost/shared`) och typkontroll i CI,
- en skuldinventering (`docs/debt.md`) med kända buggar, varav flera syns i klienten.

Vi behövde bestämma vad som ska testas, på vilken nivå, och vad vi medvetet lämnar, så att testerna fångar riktiga fel utan att bromsa porteringen av resten av vyerna.

## Nivåer

**Typkontroll (`vue-tsc`, `tsc --noEmit`):** Fel fältnamn, fält som kan vara `null`, routes som svarar med fel form. Körs i CI sedan #50. #51 visade att den fångar `guide.lengthKm` som lint, tester och bygget släpper igenom.

**Enhet (Vitest):** Ren logik utan DOM: `api.ts` (kastar vid fel), session-storens inloggning, och beräkningar som höjdmetrar. Snabba, inga komponenter.

**Komponent (Vitest + Vue Testing Library, jsdom):** Vyerna, testade som en användare ser dem: vad som står på sidan efter att data laddats, vid tomt svar, vid API-fel och efter en sökning. Vi frågar efter text och roller, inte klassnamn eller komponentens interna state.

**API (kommer senare):** Routes mot en riktig Postgres. Inte i M2: CI har ingen databas och routes saknar felhantering (Debt 13).

**E2E:** Inte nu. Se *Alternativ vi jämförde*.

## Karta: vad testas var

| Del av Utpost | Nivå | Varför just där? | Finns test i dag? |
|---|---|---|---|
| API-kontraktet (`@utpost/shared`) | Typkontroll | Fältnamn och `null` är typfrågor. Ett test skulle bara upprepa typen. | Ja, typkontrollen i CI (bevisad i #51) |
| `api.ts` – `get` kastar vid fel status | Enhet | Ren funktion. Om den slutar kasta visar vyerna felsvaret som data. | Nej, planerat |
| Session-storen – `login` vid fel lösenord | Enhet | Logik utan UI: kasta API:ets meddelande och spara ingen token. | Nej, planerat |
| `GuidesView` – laddad, tom, API-fel | Komponent | Det användaren ser beror på vyns tillstånd. Testas genom det som renderas. | Nej, planerat |
| `GuidesView` – sökning | Komponent | Sökningen ligger i vyn. Testas som användaren gör: skriv, klicka, läs listan. | Nej, planerat |
| `GuideDetailView` – laddad, hittas inte/API-fel | Komponent | Sluggen kommer från routen. Ska visa fel, inte fastna på "Laddar...". | Nej, planerat |
| HTML-sanering av `body_html` (Debt 7, #9) | Komponent | Felet syns först när HTML:en hamnar i DOM:en via `v-html`. | Nej, planerat regressionstest (rött före fix) |
| `ToursView` – laddad, tom, API-fel | Komponent | Som ovan. Tabellen räknar om meter till km och visar antal bilder. | Nej, planerat |
| `ToursView` – tur utan användare (Debt 10, #12) | Komponent | Utan foreign keys kan `user` saknas. Vyn ska inte krascha. | Nej, planerat |
| `LoginView` – fel lösenord | Komponent | Användaren ska se API:ets meddelande och stanna kvar på sidan. | Nej, planerat |
| Höjdmetrar (`elevationGain`) | Enhet | Ren beräkning med känd bugg vid `null`-punkter. | Nej. Öppen fråga, se nedan |
| API-routes (`api/src/routes/`) | API (senare) | Kräver databas. Svarsformen skyddas redan av `Response<T>` och typkontrollen. | Nej |

## Regler

- **En PR mergas bara när** `Quality` och `Build` är gröna (lint, format, typkontroll, tester, bygge) och en annan person har godkänt den.
- **En buggfix** börjar med ett test som är rött, i en egen commit, följt av fixen i nästa commit. Skuldnumret står i testnamnet eller en kommentar, t.ex. `// Debt 7 (#9)`.
- **Vi mockar API:et genom** `vi.mock('@/api')`. `get`/`post` ersätts med `vi.fn()` och testdatan typas med typerna från `@utpost/shared`, så att en ändring i kontraktet bryter testdatan i typkontrollen. Bara testet av `api.ts` självt stubbar `fetch`.
- **Täckning:** inget krav. Ett procentmål belönar tester som rör rader utan att kontrollera något. Kravet är istället per vy (laddad, tom, fel, sökning) och per buggfix (regressionstest).
- **Testfiler** ligger bredvid koden de testar och heter som filen plus `.test.ts`, t.ex. `GuidesView.test.ts` bredvid `GuidesView.vue`.

## Vad vi medvetet inte testar

- **Vue, Pinia och Vue Router själva:** att `ref` uppdaterar eller att en store finns. Det testar ramverket, inte oss.
- **Klassnamn, CSS och exakt markup:** testerna läser text och roller, så att en omstylning inte bryter dem.
- **`web/` (React-appen):** den ersätts vy för vy av `client/`.
- **API-routes mot databas:** kommer senare (se *Nivåer*).
- **`App.vue`, `HomeView`, routerkonfigurationen:** ingen egen logik i dag.

## Alternativ vi jämförde

- **Mockning: `vi.mock('@/api')` vs. stubbad `fetch` vs. MSW.** Stubbad `fetch` kräver att varje test bygger `Response`-objekt för hand. MSW är mest realistiskt men är ett nytt beroende och mer uppsättning än vi behöver nu. `vi.mock('@/api')` är kortast och typat. Priset är att `api.ts` inte körs i komponenttesterna, därför har den ett eget enhetstest.
- **Täckningskrav (t.ex. 70 %) vs. inget krav vs. bara rapport.** Se *Regler*. Ett krav är lätt att mäta men lätt att uppfylla med tomma tester.
- **Testfiler bredvid koden vs. en separat `tests/`-mapp.** Bredvid koden syns direkt vad som saknar test, och testerna följer med när filer flyttas.
- **Vue Testing Library vs. `@vue/test-utils` direkt.** Test-utils ger åtkomst till komponentens interna state, vilket lockar till tester som går sönder vid refaktorering. Testing Library tvingar oss att testa det användaren ser.
- **E2E (t.ex. Playwright) nu vs. senare.** E2E kräver att API och databas körs i CI. Komponenttester med mockat API ger det mesta av nyttan till en bråkdel av kostnaden just nu.

## Konsekvenser

- **Bra:** testerna är snabba och kräver varken nätverk eller databas, så de kan köras i varje PR. Testdatan är typad mot kontraktet.
- **Risk:** mocken kan skilja sig från hur API:et faktiskt beter sig
(statuskoder, tomma svar). Typkontrollen fångar fel *form* men inte fel
*beteende*. Det täcks först av API-testerna.
- **Krav på nya vyer:** varje ny portad vy får tester för laddad, tom och fel innan den mergas.

## Öppna frågor

- **Höjdmetrar:** `TourDetailView` är inte portad, så klienten har ingen höjdmeterberäkning att testa. Antingen portar vi vyn med beräkningen utbruten till en egen funktion, eller så bryter vi ut funktionen först och portar vyn senare.

## Kommandon

```bash
npm test                                   # alla tester en gång (som i CI)
npm run test:watch --workspace=client      # kör om vid ändring
```
