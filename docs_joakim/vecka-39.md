# Vecka 39 – Routing, State och CI

**Kursmål:** Fullstack 5 | Cloud 3

## Vad jag förstått

**Fullstack:** Vue Router konfigureras som en ren objekt-array i stället för Reacts JSX-träd, vilket gör det enkelt att filtrera routes och köra logik (tex auth guards via meta-fält).

En annan fiffig grej med routing i Vue är hur man använder props. Genom att låta routern skicka URL-parametrar direkt som vanliga props slipper komponenten vara hårdkodad mot routing-biblioteket. Det gör den enklare att återanvända och smidigare att enhetstesta då du inte behöver mocka routerns tillstånd. En tredje bra grej är router.beforeEach som fungerar som en inbyggd middleware före sidbyten. OBS! Endast för användarupplevelsen. Inte en säkerhetsgrej.

**State:** Vues egna Zustand heter Pinia och används som en store för data som flera komponenter behöver dela på i Vues reaktivitetssystem: State (ref), Getters (computed) och Actions (funktioner som ändrar tillstånd eller hanterar asynkrona anrop).

**Cloud 3:** CI eller continuous integration är vad det låter: regelbunden integration av koden till main. CI är en objektiv, isolerad och strikt maskin som testar koden i en egen miljö i stället för i teammedlemmarnas lokala datorer där miljövariabler och versioner kan ge falska positiva resultat.

Den automatiserade processen definieras i en .github/workflows.yml-fil där Job är en samling steg som körs på en specifik maskin och Step är en enskild uppgift i ett jobb och Runner är den virtuella container som kör jobbet. I CI kör man npm instal ci i ställer för npm install. Då installerar man strikt mot package-lock.json. Detta för att undvika nya versioner på olika dependencies

## Var det syns i mitt arbete

Här kan jag inte adressera några ändringar som jag själv handgripligen gjort. På workshopen fick Miran påbörja piplinen som Andreas avslutade och skickade in.
