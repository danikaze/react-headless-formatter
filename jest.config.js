const { join } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const tsConfig = require('./tsconfig.json');

const compilerOptionsPaths = tsConfig.compilerOptions?.paths;

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '@alex_neo/jest-expect-message',
    '@testing-library/jest-dom',
  ],

  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/.coverage',
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*',
    '!<rootDir>/src/**/__test/**',
    '!**/*.d.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/jest.config.js',
    '<rootDir>/jest',
  ],
  moduleNameMapper: {
    ...(compilerOptionsPaths
      ? pathsToModuleNameMapper(compilerOptionsPaths, {
          prefix: '<rootDir>/',
        })
      : {}),

    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': join(__dirname, 'mock-style.js'),

    // Handle static assets
    // https://jestjs.io/docs/webpack#handling-static-assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      join(__dirname, 'jest/mock-file.js'),
  },

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest'],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};
