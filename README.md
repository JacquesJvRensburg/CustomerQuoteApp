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

## Project layout

```
src/app/
  core/          # Database and external API services
  features/      # Customers and quotes (UI + NgRx)
  models/        # Shared TypeScript interfaces
  shared/        # Reusable components, pipes, utils
```
