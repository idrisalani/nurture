module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/firebase.config.js',
  ],
  // Thresholds reflect current 2-file coverage (auth + nlp).
  // Raise to 70/75/75/75 once all controller tests are added.
  coverageThreshold: {
    global: { branches: 15, functions: 10, lines: 40, statements: 40 }
  },
  setupFiles: [],
  testTimeout: 10000,
  verbose: true,
};
