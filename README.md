# Advanced Stock Price Checker

![CI Status](https://github.com/gmaster0o0/Advance-Stock-Price-Ckecker/actions/workflows/ci.yml/badge.svg)

NestJS + Prisma service for tracking stock prices with real-time monitoring and moving average analysis.

## Features

- **Real-time Tracking**: Register stock symbols to start periodic price fetching.

- **Moving Average Calculation**: Smart calculation of price trends based on a 10-minute sliding window.

- **Reliability Assessment**: Dynamic reliability status based on the number of data points in the moving average.

- **Automated Scheduler**: Cron-based worker that fetches prices every minute via Finnhub API.

- **Symbol Management**: Add/remove symbols and view tracked symbols with ease.
  - PUT /stock/:symbol: Start tracking a new symbol.
  - DELETE /stock/:symbol: Stop tracking a symbol.
  - GET /stock: List all currently tracked symbols.

- **Detailed Insights**: GET /stock/:symbol returns current price, moving average, and reliability status.

- **API Documentation**: Fully documented interactive Swagger UI at /api

## Key Architectural Decisions

### 1. Time-Based Moving Average (Sliding Window)

**Context**: Initially, the requirement was to use the last 10 samples. However, in scenarios like server maintenance or API downtime, those 10 samples could span hours, leading to a misleading "moving" average.

**Decision**: Switched to a 10-minute time window.

**Consequence**: The system calculates the average using only data points from the last 10 minutes. If fewer than 10 samples are found in this window (e.g., after a restart), the API returns a flag or indicator that the data is not yet statistically significant. This ensures data integrity and reliability for the end-user.

### 2. In-Memory Tracking with Persistent Storage

**Context**: We need to know which symbols to fetch.

**Decision**: Used a Set in the StockService for active tracking during runtime, while persisting every fetched price to PostgreSQL.

**Consequence**: High performance for the scheduler, while maintaining a rich historical dataset for the moving average calculations.

### 3. Separate Test Environment

**Context**: Tests should not pollute the development database.

**Decision**: Implemented a dedicated Docker service (postgres-test) using tmpfs.

**Consequence**: Extremely fast integration tests and guaranteed isolation between local development and CI runs.

## Environment Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start only the persistent development database:

```bash
npm run db:dev:up
```

3. Run Prisma commands against the development database:

```bash
npm run db:init
```

The development database uses the `postgres-dev-data` volume and survives container restarts.

## Test Database (Temporary)

Tests and CI must use `TEST_DATABASE_URL`, not the development `DATABASE_URL`.

- Jest setup maps `TEST_DATABASE_URL` to `DATABASE_URL` during test runs.
- This prevents test traffic from writing to the persistent development database.

To run a disposable local test database:

```bash
npm run db:test:up
```

The `postgres-test` service uses `tmpfs`, so its data is ephemeral.

## Cleanup Temporary Test DB

Stop and remove the temporary test database service:

```bash
npm run db:test:down
```

This removes only the `postgres-test` service and does not affect development data or the `postgres-dev` service.

## CI Pipeline

Every pull request targeting `master` or `main` runs the GitHub Actions workflow at `.github/workflows/ci.yml`.

| Job | Steps |
|-----|-------|
| **Lint · Typecheck · Test** | Checkout → Node.js LTS → Cache `node_modules` → Install → Prisma generate → Lint → Typecheck → Unit tests → Migrate test DB → E2E tests |
| **Docker Build** | Checkout → `docker build` |

The `ci` job uses a `postgres:15-alpine` service container as the test database. The `TEST_DATABASE_URL` environment variable is wired automatically so no secrets need to be configured for the standard test run.

A failing lint check, type error, broken test, or failing Docker build blocks the pull request from merging.

## Common Commands

```bash
# install dependencies
npm install

# start application
npm run start:dev

# run unit tests
npm test

# run e2e tests
npm run test:e2e
```

## Limitations & Future Improvements

**Scalability**: For a high number of tracked symbols (1000+), the in-memory Set and single-threaded cron should be moved to a distributed worker pattern (e.g., BullMQ + Redis).

**Historical Data**: Since the Finnhub free tier doesn't allow historical queries, the moving average is only available for the period the service has been running. A future improvement would be integrating a paid provider to backfill data.

**Mocked Finnhub API**: Current e2e tests are using mocked HTTP responses for the Finnhub API to avoid hitting the real API during tests. This allows us to test our application's logic without relying on external services, but it does not fully simulate real-world API interactions.

**Future improvements could include:** 
- mocked API servers to simulate more realistic API interactions avoiding rate limits and network issues.