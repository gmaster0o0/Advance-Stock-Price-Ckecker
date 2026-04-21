export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/../test/setup-test-env.ts'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
