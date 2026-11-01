// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parse } from "smol-toml";

// Bound work on each keystroke, including accidental non-project files.
const maxPyprojectSize = 1024 * 1024;
const projectDisabled = ["--no-project", "--script", "-s", "--gui-script", "--module", "-m"];

const expandHome = (value: string): string => (value === "~" ? os.homedir() : value.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value);

/** Apply uv's --directory and --project options to find where project discovery starts. */
export const getProjectDirectory = (cwd: string, tokens: string[]): string | undefined => {
  let working = cwd;
  let project: string | undefined;
  for (let index = 1; index < tokens.length; index++) {
    const [option, inlineValue] = tokens[index].split(/=(.*)/s);
    if (option !== "--project" && option !== "--directory") continue;
    const value = inlineValue ?? tokens[++index];
    if (!value) return;
    if (option === "--project") project = expandHome(value);
    else working = path.resolve(working, expandHome(value));
  }
  return project ? path.resolve(working, project) : working;
};

/** Read the nearest pyproject.toml as data, searching parent directories like uv does. */
export const readPyproject = async (directory: string): Promise<Record<string, unknown> | undefined> => {
  for (;;) {
    const file = path.join(directory, "pyproject.toml");
    try {
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size > maxPyprojectSize) return;
      return parse(await fs.readFile(file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return;
    }
    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
};

const isTable = (value: unknown): value is Record<string, unknown> => value != null && typeof value === "object" && !Array.isArray(value);

const requirementName = (requirement: unknown): string | undefined =>
  typeof requirement === "string" ? requirement.match(/^\s*([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)/)?.[1] : undefined;

const fromProject = async (tokens: string[], context: Fig.GeneratorContext): Promise<Record<string, unknown> | undefined> => {
  const directory = getProjectDirectory(context.currentWorkingDirectory, tokens);
  return directory ? readPyproject(directory) : undefined;
};

/** Entry points from [project.scripts]. Never imports the project or runs uv. */
export const projectScripts: Fig.Generator = {
  // Re-read pyproject.toml so edits apply without restarting the shell.
  cache: { strategy: "max-age", ttl: 1000, cacheByDirectory: true },
  // A token containing a path separator is a file path, so no script name should match it.
  getQueryTerm: (token) => (/[/\\]/.test(token) ? "\u0000" : token),
  custom: async (tokens, _executeShellCommand, context) => {
    if (tokens.some((token) => projectDisabled.includes(token))) return [];
    const project = (await fromProject(tokens, context))?.project;
    const scripts = isTable(project) ? project.scripts : undefined;
    if (!isTable(scripts)) return [];
    return Object.entries(scripts)
      .filter(([name, target]) => /^\w[\w.-]*$/.test(name) && typeof target === "string")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, target]) => ({ name, description: `Project script: ${target}`, icon: "fig://icon?type=command", priority: 75 }));
  },
};

/** Dependencies declared in pyproject.toml, for uv remove. */
export const projectDependencies: Fig.Generator = {
  cache: { strategy: "max-age", ttl: 1000, cacheByDirectory: true },
  custom: async (tokens, _executeShellCommand, context) => {
    const data = await fromProject(tokens, context);
    if (data == null) return [];
    const project = isTable(data.project) ? data.project : {};
    const groups: [string, unknown][] = [["project", project.dependencies]];
    if (isTable(project["optional-dependencies"]))
      groups.push(...Object.entries(project["optional-dependencies"]).map(([extra, list]): [string, unknown] => [`extra ${extra}`, list]));
    if (isTable(data["dependency-groups"]))
      groups.push(...Object.entries(data["dependency-groups"]).map(([group, list]): [string, unknown] => [`group ${group}`, list]));

    const suggestions = new Map<string, Fig.Suggestion>();
    for (const [source, list] of groups) {
      if (!Array.isArray(list)) continue;
      for (const name of list.map(requirementName)) {
        if (name && !suggestions.has(name.toLowerCase()))
          suggestions.set(name.toLowerCase(), { name, description: `Dependency (${source})`, icon: "📦", priority: 75 });
      }
    }
    return [...suggestions.values()];
  },
};

/** Files for uv run, with Python scripts ranked above other files. */
export const runnableFiles: Fig.Generator = {
  template: "filepaths",
  filterTemplateSuggestions: (suggestions) =>
    suggestions.map((suggestion) =>
      suggestion.type === "file" && typeof suggestion.name === "string" && /\.pyw?$/i.test(suggestion.name)
        ? { ...suggestion, description: "Python script", priority: 70 }
        : suggestion,
    ),
};
