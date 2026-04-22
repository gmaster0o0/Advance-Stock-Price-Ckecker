# Implementation Plan — Advanced Stock Price Checker

Project setup (NestJS, TypeScript, ESLint, Prettier, Prisma schema, Docker, commitlint, husky) is already complete.
The remaining work is split into small, independently shippable PRs below.

Key environment rule:
- Use a persistent PostgreSQL database for local development.
- Use a separate temporary/deletable PostgreSQL database for tests and CI runs.

---

## PR 1 — Database Environment Setup (Completed)

**Branch:** `1-infra/db-environment`

### Tasks
- Document and implement a persistent PostgreSQL database for local development.
- Document and implement a separate temporary/deletable PostgreSQL database for tests and CI.
- Add `.env.example` entries for:
  - `DATABASE_URL` for the dev database
  - `TEST_DATABASE_URL` for the test database
- Update `docker-compose.yml` with a named service for the dev database and a temporary test database service if needed.
- Ensure tests read `TEST_DATABASE_URL` and do not modify the persistent dev database.
- Add cleanup guidance for the temporary test DB in the README or docs.

### Acceptance criteria
- Development runs against a persistent DB that survives restarts.
- Tests run against a separate temporary/deletable DB.
- The dev database and test database are clearly separated in configuration.

---

## PR 2 — CI Pipeline (Completed)

**Branch:** `2-ci/github-actions`

### Tasks
- Create `.github/workflows/ci.yml` that triggers on every pull request to `master`.
- Also allow `main` for future branch compatibility.
- Pipeline has two parallel jobs: `ci` and `docker`.
- `ci` job steps:
  1. Checkout code.
  2. Set up Node.js (LTS).
  3. Cache `node_modules` keyed on `package-lock.json` hash; skip `npm ci` on cache hit.
  4. Install dependencies (`npm ci`).
  5. Generate Prisma client (`npx prisma generate`).
  6. Run `npm run lint`.
  7. Run `npm run typecheck`.
  8. Run `npm test` (unit tests).
  9. Apply Prisma migrations to the test database (`npx prisma migrate deploy`).
  10. Run `npm run test:e2e` with a PostgreSQL service container (`postgres:15-alpine`).
- `docker` job steps:
  1. Checkout code.
  2. Build Docker image (`docker build`) to validate the `Dockerfile` compiles end-to-end.

### Acceptance criteria
- CI passes green on a clean branch.
- A failing lint, type error, unit test, or e2e test causes the pipeline to fail and blocks the PR.
- A broken `Dockerfile` causes the `docker` job to fail.
- All subsequent PRs are validated automatically by this pipeline.

---

## PR 3 — Agentic Workflow Task (Completed)

**Branch:** `3-feat/agentic-workflow`

### Tasks
- Add an agentic workflow task that can coordinate and execute follow-up changes, tests, or documentation updates across the repo.
- Define the task scope, decision rules, and expected output format in a markdown or config file.
- Implement a lightweight orchestration helper or script that can:
  - identify pending work items from the current branch,
  - run targeted checks,
  - propose the next PR or merge action.
- Add tests or validation for the helper if applicable.
- Document the new workflow in `docs/implementation-plan.md` or `README.md`.

### Acceptance criteria
- The repo contains a clear agentic workflow task tracked as PR 3.
- The task is described well enough to be executed or reviewed as a standalone PR.
- The new task appears in the dependency chain after PR 2.

---

## PR 4 — Prisma Service (Completed)

**Branch:** `4-feat/prisma-service`

### Tasks
- Create `src/prisma/prisma.service.ts` extending `PrismaClient` and implementing `OnModuleInit` / `OnModuleDestroy` for connection lifecycle.
- Create `src/prisma/prisma.module.ts` exporting `PrismaService` as a global module.
- Import `PrismaModule` in `AppModule`.
- Add `.env.example` with `DATABASE_URL` placeholder.
- Write a unit test `src/prisma/prisma.service.spec.ts` that mocks `$connect` / `$disconnect`.

### Acceptance criteria
- `PrismaService` is injectable in any module.
- No direct `new PrismaClient()` calls elsewhere in the codebase.

---

## PR 5 — Stock Module Scaffold (Completed)

**Branch:** `5-feat/stock-module`

### Tasks
- Generate `src/stock/stock.module.ts`, `stock.controller.ts`, `stock.service.ts` via Nest CLI.
- Define response interface `StockPriceResponse` (symbol, currentPrice, lastUpdated, movingAverage).
- Define `src/stock/interfaces/finnhub-quote.interface.ts` for the raw Finnhub API shape (`c`, `h`, `l`, `o`, `pc`, `t`).
- Register `StockModule` in `AppModule`.
- Stub `GET /stock/:symbol` and `PUT /stock/:symbol` returning `501 Not Implemented` placeholders.
- Write unit tests for the controller with a mocked `StockService`.

### Acceptance criteria
- Both routes exist and respond (even as stubs).
- TypeScript compiles with no errors.

---

## PR 6 — Finnhub API Integration (Completed)

**Branch:** `6-feat/finnhub-integration`

### Tasks
- Install `@nestjs/axios` and `axios`.
- Add `FINNHUB_API_KEY` to `.env.example`.
- Create `src/stock/finnhub.service.ts` that injects `HttpService` and calls `https://finnhub.io/api/v1/quote?symbol=<SYMBOL>&token=<KEY>`.
- Map the raw `FinnhubQuote` interface to a typed internal result.
- Handle error cases: invalid/unknown symbol (Finnhub returns `c: 0`), network errors, and non-2xx responses — throw appropriate NestJS HTTP exceptions.
- Register `HttpModule` in `StockModule`.
- Write unit tests for `FinnhubService` with a mocked `HttpService`.

### Acceptance criteria
- `FinnhubService.getQuote(symbol)` returns a typed quote or throws `NotFoundException` / `BadGatewayException`.
- No `any` types used.

---

## PR 9 — Swagger Documentation (Completed)

**Branch:** `9-feat/swagger`

### Tasks
- Install `@nestjs/swagger`.
- Configure `SwaggerModule` in `main.ts` at path `/api`.
- Add `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiResponse` decorators to `StockController`.
- Decorate the `StockPriceResponse` DTO class with `@ApiProperty`.
- Verify the Swagger UI loads at `http://localhost:3000/api`.

### Acceptance criteria
- Both endpoints are visible and documented in Swagger UI.
- No broken types or missing descriptions on required fields.

---

## PR 7 — Scheduled Price Fetching & Storage

**Branch:** `7-feat/scheduled-price-fetch`

### Tasks
- Install `@nestjs/schedule` and `node-cron` types (`@types/node-cron`).
- Enable `ScheduleModule.forRoot()` in `AppModule`.
- Add `trackedSymbols: Set<string>` state to `StockService`.
- Implement `PUT /stock/:symbol` to add the symbol to `trackedSymbols` and return `{ message: 'Tracking started for <SYMBOL>' }`.
- Add a `@Cron(CronExpression.EVERY_MINUTE)` job in `StockService` that iterates `trackedSymbols`, calls `FinnhubService.getQuote()`, and persists each result using `PrismaService.stockPrice.create()`.
- Update the Prisma schema if needed (the `StockPrice` model already exists).
- Run `prisma migrate dev` and commit the migration.
- Write unit tests for `StockService` covering: symbol registration, cron tick with a mocked `FinnhubService` and `PrismaService`.

### Acceptance criteria
- `PUT /stock/AAPL` registers AAPL for periodic fetching.
- Each cron tick stores a new `StockPrice` row for every tracked symbol.
- Duplicate symbol registrations are idempotent.

---

## PR 8 — Moving Average & GET Endpoint

**Branch:** `8-feat/moving-average`

### Tasks
- Implement `StockService.getMovingAverage(symbol)` querying the last 10 `StockPrice` rows ordered by `timestamp DESC` via `PrismaService`.
- Calculate the simple moving average: sum of prices / count.
- Implement `GET /stock/:symbol` returning:
  ```json
  {
    "symbol": "AAPL",
    "currentPrice": 175.23,
    "lastUpdated": "2026-04-21T10:00:00.000Z",
    "movingAverage": 174.50
  }
  ```
- Throw `NotFoundException` when no price data exists for the symbol.
- Write unit tests for the moving average calculation (edge cases: fewer than 10 records, exactly 10, more than 10).

### Acceptance criteria
- `GET /stock/:symbol` returns all three fields with correct values.
- Returns `404` for an untracked symbol.
- Moving average uses at most the last 10 prices.

---

## PR 10 — E2E / Integration Tests

### Tasks
- Write `test/stock.e2e-spec.ts` using `supertest` and an in-memory SQLite DB (or a test PostgreSQL container via `docker-compose`).
- Test cases:
  - `PUT /stock/AAPL` → 200 with tracking confirmation.
  - `PUT /stock/AAPL` a second time → still 200 (idempotent).
  - `GET /stock/AAPL` before any price is stored → 404.
  - Seed a `StockPrice` row and `GET /stock/AAPL` → 200 with correct fields.
  - `GET /stock/INVALID` → 404.
- Mock `FinnhubService` in E2E context to avoid real HTTP calls.

### Acceptance criteria
- All E2E tests pass with `npm run test:e2e`.
- No real network calls made during the test suite.

---

## Dependency Order

```
PR 1 (DB environment setup — merged first)
  └─ PR 2 (CI pipeline)
       └─ PR 3 (Agentic workflow)
            └─ PR 4 (Prisma)
                 └─ PR 5 (Stock scaffold)
                      └─ PR 6 (Finnhub)
                           └─ PR 9 (Swagger)
                                └─ PR 7 (Scheduler + storage)
                                     └─ PR 8 (Moving average + GET)
                                          └─ PR 10 (E2E tests)
```

## Additional Tasks:

### Simple Healthcheck (Completed)

**Branch:** `11-feat/healthcheck`

#### Tasks
- Replace the generic `GET /` endpoint with a health check that verifies database connectivity.
- Implement `HealthResponseDto` for structured API responses.
- Add comprehensive unit and E2E tests for the health check.
- Ensure type safety, linting compliance, and test passing.

- Later consideration: use @nestjs/terminus for a more robust health check system.

### Untrack symbol endpoint

**Branch:** `12-feat/schedule-untrack`

#### Tasks
- Implement `DELETE /stock/:symbol` to remove the symbol from `trackedSymbols` and return `{ message: 'Tracking stopped for <SYMBOL>' }`.
- Ensure idempotency: calling it multiple times for the same symbol should not cause errors.
- Write unit tests for `StockService.untrackStock` covering: symbol removal, idempotency, and cron behavior.
- Write unit tests for `StockController.untrackStock` covering: delegation to service and response handling.