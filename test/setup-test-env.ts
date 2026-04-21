const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (typeof testDatabaseUrl === 'string') {
  if (testDatabaseUrl.length > 0) {
    process.env.DATABASE_URL = testDatabaseUrl;
  }
}
