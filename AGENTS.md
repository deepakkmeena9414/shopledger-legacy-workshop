# ShopLedger

## Stack

- Node.js application using CommonJS modules.
- Express 4 with `body-parser` for its JSON API.
- Static browser UI in `public/` (plain HTML, CSS, and JavaScript).
- JSON-file persistence in `data/db.json`; there is no database server or test framework configured.

## Module map

- `server.js` starts Express, serves `public/`, mounts the API routes, and exposes the printable invoice page.
- `config.js` holds the shop, tax, inventory, and coupon configuration.
- `routes/` contains API endpoints for products, orders, customers, and reports.
- `lib/` contains store access plus pricing, tax, inventory, order, ledger, coupon, invoice, date, and reporting logic.
- `data/db.json` is the application's persistent data store.
- `public/` contains the frontend assets.

## Commands

- `npm start` — run the server (defaults to port 3000; set `PORT` to override it).
- `npm test` — currently exits with `Error: no test specified`; no automated test runner is configured.

## Change rules

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests must never touch `data/db.json`.
- Add no dependencies.
