**Vecka 38 - Ramverket och arbetssättet**

**Vad jag förstått:**

Vue har många likheter med React men det finns vissa skillnader. I React behöver hela sidan läsas om efter rendering för att veta vad som ändrats, medan Vue håller reda på det från början och sparar en koppling till den specifika template som ändrats. För att detta ska fungera behvöer vi en .value kopplad till ref, dock endast i scriptet då den packas upp automatiskt i Template. useEffect i React kräver en lista medan watchEffect i Vue tar ingen lista utan tittar direkt på refs och ändrar de om de behövs. Man kan också använda Watch om du bara vill reagera på en sak. Kanske den största skillnaden är mellan Reacts JSX där vi skriver JavaScript och Vues Template är HTML med direktiv v-if, v-show. @click osv.

Sättet vi kommer jobba på påminner till viss del hur jag jobbade i våras med CC, men vi kommer även testa på trunk-baserat flöde.

När det kommer till skuldinventeringen satt jag och Andreas i sex timmar och gick genom fil föf fil.

**Var det syns i mitt arbete:**

utpost\docs\[debt-original-notes.md](debt-original-notes.md)

utpost\docs\[debt.md](debt.md)

**Kvar att förstå:**

Då jag känner mig lite rostig på React, är det också en liten uppförsbacke att lära sig Vue. Men det tar väl sig.
