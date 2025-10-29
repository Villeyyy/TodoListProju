# Moderni TODO (Next.js)

Kevyt Next.js TODO-sovellus, jossa:
- client-puolen käyttöliittymä (src/app/page.tsx) — React 'use client' -komponentti
- tyylit CSS Modulesilla (src/app/page.module.css)
- yksinkertainen server-side API (src/app/api/todos/route.ts) — GET / POST / DELETE

## Ominaisuudet
- Kategoriapaneeli: valmiit kategoriat + mahdollisuus lisätä / poistaa omia kategorioita
- Ehdotukset (chips) kategoriakohtaisesti — lisää yksittäin tai "lisää kaikki"
- TODO-lista: lisää, poista, merkitse valmiiksi (client-tila)
- Kategoriat tallentuvat paikallisesti selaimen `localStorage`-avainteena
- TODOt pidetään serverin muistissa (dev-only, ei pysyvää tallennusta)

## Vaatimukset
- Node.js >= 16
- npm (tai pnpm / yarn)
- Next.js 13+ (App Router käytössä)

## Asennus (projektin juurissa)
PowerShell:
```powershell
npm install
npm run dev
```
Jos poistit node_modules: suorita `npm install` uudelleen.

## Kehitys
- Kehityspalvelin: `npm run dev` (http://localhost:3000)
- Rakennus: `npm run build`
- Tuotanto: `npm start` (kun build valmis)

## Tiedostorakenne (oleelliset)
- src/app/page.tsx — pää-UI (kategoriat, ehdotukset, TODO-lista)
- src/app/page.module.css — komponentin tyylit (CSS Modules)
- src/app/api/todos/route.ts — API-reitti (/api/todos)
- public/icons — projektin ikonit (favicon, kategoriaikonit)

## API
Kaikki pyynnöt polkuun `/api/todos`

- GET /api/todos  
  Palauttaa: { todos: Todo[] }

- POST /api/todos  
  Body JSON: { text: string }  
  Palauttaa päivitetyn todos-taulukon.

- DELETE /api/todos  
  Body JSON: { id: string }  
  Palauttaa päivitetyn todos-taulukon.

Esimerkit (curl):
```bash
curl http://localhost:3000/api/todos
curl -X POST -H "Content-Type: application/json" -d '{"text":"Osta maitoa"}' http://localhost:3000/api/todos
curl -X DELETE -H "Content-Type: application/json" -d '{"id":"123"}' http://localhost:3000/api/todos
```

## Persistenssi ja rajoitukset
- Kategoriat ja niiden ehdotukset: tallennetaan selaimen `localStorage`-avaimeen `mytodo:categories`. Säilyy vain samassa selaimessa ja originissa.
- TODOt: tallennetaan palvelinprosessin muistiin route.ts:n muuttujaan. Tämä katoaa, kun dev-serveri uudelleenkäynnistyy tai sovellus skaalautuu useisiin instansseihin. Ei tuotantopysyväisyyttä.

## Muokattavat kohdat / vinkit
- Favicon & kategoriakuvakkeet: lisää SVG/PNG tiedostot `public/icons` ja määritä `src/app/head.tsx`.
- Tee todos pysyviksi: lisää tietokanta (sqlite/Prisma, JSON-tiedosto tai ulkoinen DB) ja korvaa in-memory-array.
- Synkronointi useille laitteille: toteuta käyttäjä-API ja tallenna kategoriat palvelimelle.

## Vianetsintä
- Jos sivu ei lataudu: varmista että `node_modules` on asennettu (`npm install`) ja että Next.js -versio on yhteensopiva.
- CSS-moduulia ei löydy: varmista polku `src/app/page.module.css` ja että import on `import styles from './page.module.css'`.
- API-virheet: tarkista dev-serverin konsoli (terminaali) ja selaimen Network-tab.

## Kehitysehdotukset (priorisoitu)
1. Pysyvä tallennus todosille (DB)
2. Synkronointi käyttäjäkohtaisesti (auth + DB)
3. Käytä SWR/React Queryä fetchin hallintaan ja cacheen
4. Lisää yksikkö- ja integraatiotestit
