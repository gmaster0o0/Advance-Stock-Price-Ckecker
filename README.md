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

Stop and remove the temporary test database resources:

```bash
docker compose --profile test down -v
```

This is safe for the temporary test database and does not remove development data unless you also tear down the `postgres-dev` service and its volume.

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
