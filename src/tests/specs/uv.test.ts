// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import uv from "../../specs/uv.js";
import uvx from "../../specs/uvx.js";
import { getConfig } from "../../utils/config.js";
import { unpackResources } from "../../utils/node.js";
import { getSuggestions, loadLocalSpecsSet } from "../../runtime/runtime.js";
import type { Shell } from "../../utils/shell.js";

const names = (option: Fig.Option | Fig.Subcommand) => (Array.isArray(option.name) ? option.name : [option.name]);
const suggest = async (command: string, cwd: string) => (await getSuggestions(command, cwd, "zsh" as Shell))?.suggestions.map((s) => s.name) ?? [];

let directory: string;
beforeAll(async () => {
  await unpackResources();
  getConfig().specs = { path: [] };
  await loadLocalSpecsSet();
});
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "inshellisense-uv-"));
});
afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true });
});

describe("uv spec", () => {
  test("declares global options once, on the root", () => {
    const root = (uv as Fig.Subcommand).options ?? [];
    const persistent = new Set(root.filter((option) => option.isPersistent).flatMap(names));
    expect([...persistent]).toEqual(expect.arrayContaining(["--directory", "--project", "--offline", "--no-cache", "--help"]));
    const visit = (command: Fig.Subcommand) => {
      expect((command.options ?? []).flatMap(names).filter((name) => persistent.has(name))).toEqual([]);
      command.subcommands?.forEach(visit);
    };
    (uv as Fig.Subcommand).subcommands?.forEach(visit);
  });

  test("has no duplicate option names within a command", () => {
    const visit = (command: Fig.Subcommand) => {
      const all = (command.options ?? []).flatMap(names);
      expect(all.length).toBe(new Set(all).size);
      command.subcommands?.forEach(visit);
    };
    visit(uv as Fig.Subcommand);
    visit(uvx as Fig.Subcommand);
  });

  test("completes through the same loader as poetry", async () => {
    expect(await suggest("poetry r", directory)).toEqual(expect.arrayContaining(["remove", "run"]));
    expect(await suggest("uv ", directory)).toEqual(expect.arrayContaining(["run", "pip", "tool", "python"]));
    expect(await suggest("uv pip install --", directory)).toEqual(expect.arrayContaining(["--requirements", "--python", "--system"]));
    expect(await suggest("uv sync --offl", directory)).toContain("--offline");
    expect(await suggest("uv --color ", directory)).toEqual(["auto", "always", "never"]);
    expect(await suggest("uvx --", directory)).toEqual(expect.arrayContaining(["--from", "--with"]));
  });
});

describe("pyproject generators", () => {
  const pyproject = `
[project]
name = "app"
dependencies = ["httpx>=0.27", "Rich[jupyter] ; python_version > '3.9'"]

[project.optional-dependencies]
docs = ["mkdocs"]

[project.scripts]
cpsdev = "app:main"
infra_manager = "infra:main"

[dependency-groups]
dev = ["pytest", { include-group = "lint" }]
`;
  beforeEach(async () => {
    await fs.writeFile(path.join(directory, "pyproject.toml"), pyproject);
    await fs.writeFile(path.join(directory, "script.py"), "");
    await fs.writeFile(path.join(directory, "notes.txt"), "");
    await fs.mkdir(path.join(directory, "src"));
    await fs.writeFile(path.join(directory, "src", "tool.py"), "");
  });

  test("uv run puts project scripts first, then Python files, then other files", async () => {
    const suggestions = await suggest("uv run ", directory);
    expect(suggestions.slice(0, 3)).toEqual(["cpsdev", "infra_manager", "script.py"]);
    expect(suggestions).toEqual(expect.arrayContaining(["notes.txt", "src", "--extra"]));
    expect(await suggest("uv run infra", directory)).toContain("infra_manager");
  });

  test("uv run finds the project from subdirectories and honours --project", async () => {
    expect(await suggest("uv run ", path.join(directory, "src"))).toContain("cpsdev");
    const other = await fs.mkdtemp(path.join(os.tmpdir(), "inshellisense-uv-other-"));
    try {
      expect(await suggest(`uv run --project ${directory} `, other)).toContain("cpsdev");
      expect(await suggest("uv run ", other)).not.toContain("cpsdev");
    } finally {
      await fs.rm(other, { recursive: true, force: true });
    }
  });

  test("uv run omits project scripts for paths and non-project runs", async () => {
    expect(await suggest("uv run src/", directory)).toEqual(expect.arrayContaining(["tool.py"]));
    expect(await suggest("uv run src/", directory)).not.toContain("cpsdev");
    expect(await suggest("uv run --no-project ", directory)).not.toContain("cpsdev");
    expect(await suggest("uv run --script ", directory)).not.toContain("cpsdev");
  });

  test("uv remove suggests declared dependencies from every table", async () => {
    expect(await suggest("uv remove ", directory)).toEqual(expect.arrayContaining(["httpx", "Rich", "mkdocs", "pytest"]));
  });
});
