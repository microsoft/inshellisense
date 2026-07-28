// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import log from "../utils/log.js";
import { runTemplates } from "./template.js";
import { buildExecuteShellCommand } from "./utils.js";

const getGeneratorContext = (cwd: string): Fig.GeneratorContext => {
  return {
    environmentVariables: Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null)),
    currentWorkingDirectory: cwd,
    currentProcess: "", // TODO: define current process
    sshPrefix: "", // deprecated, should be empty
    isDangerous: false,
    searchTerm: "", // TODO: define search term
  };
};

type GeneratorScript = string[] | Fig.ExecuteCommandInput | undefined;
type CachedSuggestions = { key: string; suggestions: Fig.Suggestion[]; expiresAt: number };

const defaultCacheTTL = 30_000;
const generatorCache = new WeakMap<Fig.Generator, CachedSuggestions>();

const getCacheKey = (generator: Fig.Generator, script: GeneratorScript, cwd: string): string | undefined => {
  const { cache } = generator;
  if (cache == null) return;
  const key = cache.cacheKey ?? (script != null ? JSON.stringify(script) : undefined);
  if (key == null) return;
  return cache.cacheByDirectory ? `${cwd}\u0000${key}` : key;
};

const getCachedSuggestions = (generator: Fig.Generator, script: GeneratorScript, cwd: string): Fig.Suggestion[] | undefined => {
  const key = getCacheKey(generator, script, cwd);
  const cached = generatorCache.get(generator);
  if (key == null || cached == null) return;
  if (cached.key != key || Date.now() >= cached.expiresAt) return;
  return cached.suggestions;
};

const setCachedSuggestions = (generator: Fig.Generator, script: GeneratorScript, cwd: string, suggestions: Fig.Suggestion[]) => {
  const key = getCacheKey(generator, script, cwd);
  if (key == null) return;
  generatorCache.set(generator, { key, suggestions, expiresAt: Date.now() + (generator.cache?.ttl ?? defaultCacheTTL) });
};

// TODO: add support for trigger & getQueryTerm
export const runGenerator = async (generator: Fig.Generator, tokens: string[], cwd: string, signal?: AbortSignal): Promise<Fig.Suggestion[]> => {
  // TODO: support trigger
  signal?.throwIfAborted();
  const { script, postProcess, scriptTimeout, splitOn, custom, template, filterTemplateSuggestions } = generator;

  const suggestions = [];
  try {
    const shellInput = typeof script === "function" ? script(tokens) : script;
    const cachedSuggestions = getCachedSuggestions(generator, shellInput, cwd);
    if (cachedSuggestions != null) return cachedSuggestions;

    const executeShellCommand = buildExecuteShellCommand(scriptTimeout ?? 5000, signal);
    if (shellInput) {
      const scriptOutput = Array.isArray(shellInput)
        ? await executeShellCommand({ command: shellInput.at(0) ?? "", args: shellInput.slice(1), cwd })
        : await executeShellCommand({ ...shellInput, cwd });

      const scriptStdout = scriptOutput.stdout.trim();
      if (postProcess) {
        suggestions.push(...postProcess(scriptStdout, tokens));
      } else if (splitOn) {
        suggestions.push(...scriptStdout.split(splitOn).map((s) => ({ name: s })));
      }
    }

    if (custom) {
      suggestions.push(...(await custom(tokens, executeShellCommand, getGeneratorContext(cwd))));
    }

    if (template != null) {
      const templateSuggestions = await runTemplates(template, cwd, signal);
      if (filterTemplateSuggestions) {
        suggestions.push(...filterTemplateSuggestions(templateSuggestions));
      } else {
        suggestions.push(...templateSuggestions);
      }
    }

    const generatedSuggestions = suggestions.filter((s) => s != null);
    setCachedSuggestions(generator, shellInput, cwd, generatedSuggestions);
    return generatedSuggestions;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    const err = typeof e === "string" ? e : e instanceof Error ? e.message : e;
    log.debug({ msg: "generator failed", err, script, splitOn, template });
  }
  return suggestions.filter((s) => s != null);
};
