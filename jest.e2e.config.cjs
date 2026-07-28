// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const baseConfig = require("./jest.config.cjs");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseConfig,
  testMatch: ["<rootDir>/src/tests/ui/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", ".tui-test/"],
  maxWorkers: 1,
  testTimeout: 120_000,
};
