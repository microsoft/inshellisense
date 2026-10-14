// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { escapePath } from "../../runtime/utils.js";
import { Shell } from "../../utils/shell.js";

describe("escapePath", () => {
  test("bash quotes paths containing spaces", () => {
    expect(escapePath("My Docs/", Shell.Bash)).toBe('"My Docs/"');
  });

  test("bash leaves plain paths unchanged", () => {
    expect(escapePath("src/", Shell.Bash)).toBe("src/");
  });

  describe.each([Shell.Pwsh, Shell.Powershell])("%s", (shell) => {
    test("leaves plain paths unchanged", () => {
      expect(escapePath("src/", shell)).toBe("src/");
      expect(escapePath("a@b/", shell)).toBe("a@b/");
    });

    test.each([
      ["My Docs/", "'My Docs/'"],
      ["a$b/", "'a$b/'"],
      ["a&b/", "'a&b/'"],
      ["a`b/", "'a`b/'"],
      ["a;b/", "'a;b/'"],
      ["a,b/", "'a,b/'"],
      ["a(b)/", "'a(b)/'"],
      ["@a/", "'@a/'"],
      ["#a/", "'#a/'"],
    ])("single-quotes %s", (value, expected) => {
      expect(escapePath(value, shell)).toBe(expected);
    });

    test("doubles embedded single quotes", () => {
      expect(escapePath("it's/", shell)).toBe("'it''s/'");
      expect(escapePath("it's dir/", shell)).toBe("'it''s dir/'");
    });

    test("keeps already quoted paths", () => {
      expect(escapePath("'My Docs/'", shell)).toBe("'My Docs/'");
    });
  });
});
