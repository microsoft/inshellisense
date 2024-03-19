// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { truncateText } from "../../ui/utils";

describe("truncateText", () => {
  test("handling chinese wide characters", () => {
    expect(truncateText("美国人", 10)).toBe("美国人    ");
  });

  test("truncates too long wide characters when exact", () => {
    expect(truncateText("美国人 人人", 10)).toBe("美国人 人…");
  });

  test("truncates too long wide characters when split", () => {
    expect(truncateText("美国人美国人", 10)).toBe("美国人美… ");
  });
});
