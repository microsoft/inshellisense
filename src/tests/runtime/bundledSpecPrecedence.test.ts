// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getConfig } from "../../utils/config.js";
import { getSuggestions, loadLocalSpecsSet } from "../../runtime/runtime.js";
import type { Shell } from "../../utils/shell.js";

test("a spec in specs.path overrides the bundled spec of the same name", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "inshellisense-spec-precedence-"));
  try {
    await fs.writeFile(path.join(directory, "package.json"), '{"type":"module"}');
    await fs.writeFile(path.join(directory, "index.js"), 'export default ["uv"]; export const diffVersionedCompletions = [];');
    await fs.writeFile(path.join(directory, "uv.js"), 'export default { name: "uv", subcommands: [{ name: "from-local" }] };');
    getConfig().specs = { path: [directory] };
    await loadLocalSpecsSet();
    const result = await getSuggestions("uv ", directory, "zsh" as Shell);
    expect(result?.suggestions.map((suggestion) => suggestion.name)).toEqual(["from-local"]);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
