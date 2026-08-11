# Customer Quote App

Angular app for managing customers (with addresses) and quotes. Data is stored in-browser with SQLite via [sql.js](https://sql.js.org/), persisted in `localStorage`. Demo customers and quotes are seeded on first run.

## Stack

- Angular 19 (standalone components, lazy-loaded routes)
- Angular Material + Tailwind CSS
- NgRx (store, effects, store-devtools)
- sql.js (SQLite in the browser)
- RxJS

## Features

- **Customers** — list, create, edit, and delete; manage addresses; optional nationality and university enrichment
- **Quotes** — list, create, edit, and delete; statuses: Draft, Sent, Accepted, Rejected
- **Nationality prediction** — [Nationalize.io](https://api.nationalize.io) from a surname
- **University search** — [Hipolabs Universities API](http://universities.hipolabs.com) filtered by country
- **Country list** — [countries.dev](https://countries.dev) for nationality selection and flags

## Prerequisites

- Node.js and npm (compatible with Angular CLI 19)

## Getting started

```bash
npm install
npm start
```

Open `http://localhost:4200/`. `ng serve` uses `proxy.conf.json` so university search (`/api/universities`) is proxied to Hipolabs and avoids mixed-content issues.

### Nationalize API key (optional)

Nationality prediction uses [Nationalize.io](https://nationalize.io). Without a key, requests share the public free-tier quota and may return 429 when that limit is exhausted.

1. Sign up at [nationalize.io](https://nationalize.io) for a free API key (2,500 names/month).
2. Set `nationalizeApiKey` in `src/environments/environment.development.ts` (local `npm start`) and/or `src/environments/environment.ts` (production builds).
3. Restart the dev server after changing the key.

Do not commit real API keys. The key is sent as the `apikey` query parameter and is visible in the browser bundle.

## Scripts

| Command       | Description                                      |
|---------------|--------------------------------------------------|
| `npm start`   | Dev server (`ng serve`) with API proxy           |
| `npm run build` | Production build → `dist/customer-quote-app/` |
| `npm run watch` | Development build in watch mode                |
| `npm test`    | Unit tests (Karma / Jasmine)                     |

## Data

- Tables: `customers`, `addresses`, `quotes` (see `src/app/core/database/database.schema.ts`)
- Persistence key: `customer-quote-app-sqlite` in `localStorage`
- In development, use **Export database** in the app to download the SQLite file, then open it with the [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) VS Code / Cursor extension to inspect table entries

### Why SQLite instead of a plain local file?

Customers, addresses, and quotes are related data. A plain JSON file (or ad hoc objects in `localStorage`) would mean hand-rolling joins, filters, and consistency checks as the app grows. SQLite (via sql.js) gives:

- **Relational structure** — foreign keys and normalized tables instead of nested arrays that drift out of sync
- **Queryable data** — filter, sort, and look up by id with SQL rather than loading everything and scanning in memory
- **Schema and integrity** — a defined schema keeps shapes consistent across seeds, migrations, and CRUD
- **Debuggability** — export a real `.db` file and inspect it with a SQLite viewer
- **A path toward a backend** — the same SQL-oriented data access maps more cleanly to a server database later

A flat local file can be enough for tiny, unstructured settings. For this domain model, SQLite is the better local store.

## Project layout

```
src/app/
  core/          # Database and external API services
  features/      # Customers and quotes (UI + NgRx)
  models/        # Shared TypeScript interfaces
  shared/        # Reusable components, pipes, utils
```
