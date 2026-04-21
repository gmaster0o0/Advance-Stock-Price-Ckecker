# Advanced Stock Price Checker

NestJS + Prisma service for tracking stock prices.

## Environment Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start only the persistent development database:

```bash
docker compose up -d postgres-dev
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
docker compose --profile test up -d postgres-test
```

The `postgres-test` service uses `tmpfs`, so its data is ephemeral.

## Cleanup Temporary Test DB

Stop and remove the temporary test database service:

```bash
docker compose --profile test down
```

This removes only the `postgres-test` service and does not affect development data or the `postgres-dev` service.

## CI Pipeline

Every pull request targeting `main` runs the GitHub Actions workflow at `.github/workflows/ci.yml`.

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
