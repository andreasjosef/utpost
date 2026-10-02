## Vecka 38 – Ramverket och arbetssättet

### Vad jag förstått

Vue har många likheter med React men det finns vissa skillnader. I React behöver hela sidan läsas om efter rendering för att veta vad som ändrats, medan Vue håller reda på det från början och sparar en koppling till den specifika template som ändrats. För att detta ska fungera behöver vi en .value kopplad till ref, dock endast i scriptet då den packas upp automatiskt i Template. useEffect i React kräver en lista medan watchEffect i Vue tar ingen lista utan tittar direkt på refs och ändrar de om de behövs. Man kan också använda Watch om du bara vill reagera på en sak. Kanske den största skillnaden är mellan Reacts JSX där vi skriver JavaScript och Vues Template är HTML med direktiv v-if, v-show. @click osv.

Sättet vi kommer jobba på påminner till viss del hur jag jobbade i våras med CC, men vi kommer även testa på trunk-baserat flöde.

När det kommer till skuldinventeringen satt jag och Andreas i sex timmar och gick genom fil för fil.

### Var det syns i mitt arbete

utpost\docs\[debt-original-notes.md](debt-original-notes.md)

utpost\docs\[debt.md](debt.md)

### Kvar att förstå

Då jag känner mig lite rostig på React, är det också en liten uppförsbacke att lära sig Vue. Men det tar väl sig.

## Vecka 39 – Routing, State och CI

**Kursmål:** Fullstack 5 | Cloud 3

### Vad jag förstått

**Fullstack:** Vue Router konfigureras som en ren objekt-array i stället för Reacts JSX-träd, vilket gör det enkelt att filtrera routes och köra logik (tex auth guards via meta-fält).

En annan fiffig grej med routing i Vue är hur man använder props. Genom att låta routern skicka URL-parametrar direkt som vanliga props slipper komponenten vara hårdkodad mot routing-biblioteket. Det gör den enklare att återanvända och smidigare att enhetstesta då du inte behöver mocka routerns tillstånd. En tredje bra grej är router.beforeEach som fungerar som en inbyggd middleware före sidbyten. OBS! Endast för användarupplevelsen. Inte en säkerhetsgrej.

**State:** Vues egna Zustand heter Pinia och används som en store för data som flera komponenter behöver dela på i Vues reaktivitetssystem: State (ref), Getters (computed) och Actions (funktioner som ändrar tillstånd eller hanterar asynkrona anrop).

**Cloud 3:** CI eller continuous integration är vad det låter: regelbunden integration av koden till main. CI är en objektiv, isolerad och strikt maskin som testar koden i en egen miljö i stället för i teammedlemmarnas lokala datorer där miljövariabler och versioner kan ge falska positiva resultat.

Den automatiserade processen definieras i en .github/workflows.yml-fil där Job är en samling steg som körs på en specifik maskin och Step är en enskild uppgift i ett jobb och Runner är den virtuella container som kör jobbet. I CI kör man npm instal ci i ställer för npm install. Då installerar man strikt mot package-lock.json. Detta för att undvika nya versioner på olika dependencies

### Var det syns i mitt arbete

Här kan jag inte adressera några ändringar som jag själv handgripligen gjort. På workshopen fick Miran påbörja piplinen som Andreas avslutade och skickade in.
