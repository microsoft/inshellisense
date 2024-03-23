// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { defineConfig } from "@microsoft/tui-test";
export default defineConfig({
  testMatch: "src/tests/ui/**/*.@(spec|test).?(c|m)[jt]s?(x)",
  retries: 3,
  expect: {
    timeout: 10_000,
  },
});
