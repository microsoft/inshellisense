// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { test, expect } from "@microsoft/tui-test";

test.describe("status checks", () => {
  test.describe("inside inshellisense session", () => {
    test.use({ program: { file: "is" } });

    test("current status", async ({ terminal }) => {
      terminal.write("is -c\r");
      await expect(terminal.getByText("live")).toBeVisible();
      await expect(terminal.getByText("live")).toHaveFgColor(2);
    });
  });

  test.describe("outside inshellisense session", () => {
    test("current status", async ({ terminal }) => {
      terminal.write("is -c\r");
      await expect(terminal.getByText("not found")).toBeVisible();
      await expect(terminal.getByText("not found")).toHaveFgColor(1);
    });
  });
});
