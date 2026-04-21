import 'dotenv/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (typeof testDatabaseUrl === 'string') {
  if (testDatabaseUrl.trim().length > 0) {
    process.env.DATABASE_URL = testDatabaseUrl;
  } else {
    throw new Error(
      'TEST_DATABASE_URL must be set to a non-empty value before running tests.',
    );
  }
} else {
  throw new Error(
    'TEST_DATABASE_URL must be set to a non-empty value before running tests.',
  );
}
