// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import log from "../utils/log.js";
import { executeGenerator } from "./generator.js";

const generatorIds = new WeakMap<Fig.Generator, number>();
const generatorStates = new Map<string, GeneratorState>();
const maxGeneratorStates = 256;
let nextGeneratorId = 1;

type GeneratorState = {
  explicitCache: boolean;
  suggestions?: Fig.Suggestion[];
  generatedAt?: number;
  lastObservedToken?: string;
  needsGeneration?: boolean;
  generationVersion: number;
  inFlight?: {
    key: string;
    promise: Promise<CompletedGeneration>;
    signal?: AbortSignal;
  };
};

type GeneratorResult = {
  suggestions: Fig.Suggestion[];
  cacheable: boolean;
};

type CompletedGeneration = GeneratorResult & {
  current: boolean;
};

const getGeneratorId = (generator: Fig.Generator): number => {
  let id = generatorIds.get(generator);
  if (id == null) {
    id = nextGeneratorId++;
    generatorIds.set(generator, id);
  }
  return id;
};

const getStateKey = (generator: Fig.Generator, tokens: string[], activeToken: string, cwd: string): string => {
  const cache = generator.cache;
  const contextTokens = activeToken.length === 0 ? tokens : tokens.slice(0, -1);
  const generatorKey = cache?.cacheKey ?? getGeneratorId(generator);
  const directoryKey = cache?.cacheByDirectory === true || cache == null ? cwd : "";
  const tokenKey = cache?.cacheKey == null ? contextTokens : [];
  return JSON.stringify([generatorKey, tokenKey, directoryKey]);
};

const getState = (key: string, explicitCache: boolean): GeneratorState => {
  const existing = generatorStates.get(key);
  if (existing != null) {
    generatorStates.delete(key);
    generatorStates.set(key, existing);
    return existing;
  }

  const state: GeneratorState = { explicitCache, generationVersion: 0 };
  generatorStates.set(key, state);
  if (generatorStates.size > maxGeneratorStates) {
    const oldestKey = generatorStates.keys().next().value as string | undefined;
    if (oldestKey != null) generatorStates.delete(oldestKey);
  }
  return state;
};

const triggerMatches = (trigger: Fig.Trigger | undefined, newToken: string, oldToken: string): boolean => {
  if (trigger == null) return false;
  if (typeof trigger === "function") return trigger(newToken, oldToken);

  const matchChanged = (matches: string | string[]) => {
    const values = Array.isArray(matches) ? matches : [matches];
    return values.some((value) => newToken.lastIndexOf(value) !== oldToken.lastIndexOf(value));
  };

  if (typeof trigger === "string") return matchChanged(trigger);
  switch (trigger.on) {
    case "change":
      return newToken !== oldToken;
    case "threshold":
      return (oldToken.length < trigger.length && newToken.length >= trigger.length) || (oldToken.length >= trigger.length && newToken.length < trigger.length);
    case "match":
      return matchChanged(trigger.string);
  }
};

const waitForDebounce = async (signal?: AbortSignal): Promise<void> => {
  signal?.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const complete = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timeout = setTimeout(complete, 100);
    const abort = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
};

const executeGeneratorSafely = async (generator: Fig.Generator, tokens: string[], cwd: string, signal?: AbortSignal): Promise<GeneratorResult> => {
  try {
    return { suggestions: await executeGenerator(generator, tokens, cwd, signal), cacheable: true };
  } catch (error) {
    if (signal?.aborted) signal.throwIfAborted();
    const err = typeof error === "string" ? error : error instanceof Error ? error.message : error;
    log.debug({ msg: "generator failed", err, script: generator.script, splitOn: generator.splitOn, template: generator.template });
    return { suggestions: [], cacheable: false };
  }
};

const generate = async (
  state: GeneratorState,
  generator: Fig.Generator,
  tokens: string[],
  activeToken: string,
  cwd: string,
  debounce: boolean,
  signal?: AbortSignal,
): Promise<CompletedGeneration> => {
  const generationKey = JSON.stringify([tokens, activeToken, cwd]);
  if (state.inFlight?.key === generationKey && state.inFlight.signal?.aborted !== true) return state.inFlight.promise;

  const generationVersion = ++state.generationVersion;
  const generation = (async (): Promise<CompletedGeneration> => {
    if (debounce) await waitForDebounce(signal);
    const result = await executeGeneratorSafely(generator, tokens, cwd, signal);
    return { ...result, current: state.generationVersion === generationVersion };
  })();
  state.inFlight = { key: generationKey, promise: generation, signal };

  try {
    return await generation;
  } finally {
    if (state.inFlight?.promise === generation) state.inFlight = undefined;
  }
};

const refreshInBackground = async (state: GeneratorState, generator: Fig.Generator, tokens: string[], activeToken: string, cwd: string): Promise<void> => {
  try {
    const result = await generate(state, generator, tokens, activeToken, cwd, false);
    if (!result.cacheable || !result.current) return;
    state.suggestions = result.suggestions;
    state.generatedAt = Date.now();
  } catch (error) {
    log.debug({ msg: "generator cache refresh failed", error: error instanceof Error ? error.message : error });
  }
};

export const getGeneratorSuggestions = async (
  generator: Fig.Generator,
  tokens: string[],
  activeToken: string,
  cwd: string,
  debounce: boolean,
  signal?: AbortSignal,
): Promise<Fig.Suggestion[]> => {
  signal?.throwIfAborted();
  const state = getState(getStateKey(generator, tokens, activeToken, cwd), generator.cache != null);
  const cache = generator.cache;
  const tokenTriggered = state.lastObservedToken != null && triggerMatches(generator.trigger, activeToken, state.lastObservedToken);
  state.lastObservedToken = activeToken;
  if (tokenTriggered) state.needsGeneration = true;

  if (state.suggestions != null && state.needsGeneration !== true) {
    if (cache == null) return state.suggestions;

    const age = Date.now() - (state.generatedAt ?? 0);
    if (age <= (cache.ttl ?? 0)) return state.suggestions;
    if (cache.strategy !== "max-age") {
      if (state.inFlight == null) {
        await refreshInBackground(state, generator, tokens, activeToken, cwd);
      } 
      return state.suggestions;
    }
  }

  const result = await generate(state, generator, tokens, activeToken, cwd, debounce, signal);
  if (result.current) {
    state.needsGeneration = !result.cacheable;
    if (result.cacheable) {
      state.suggestions = result.suggestions;
      state.generatedAt = Date.now();
    }
  }
  return result.suggestions;
};

export const clearGeneratorState = (): void => {
  generatorStates.clear();
};

export const clearImplicitGeneratorState = (): void => {
  for (const [key, state] of generatorStates) {
    if (!state.explicitCache) generatorStates.delete(key);
  }
};
