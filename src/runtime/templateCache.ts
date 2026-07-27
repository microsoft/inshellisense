// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Dirent } from "node:fs";
import fsAsync from "node:fs/promises";
import { millisecond } from "../utils/time.js";

const directoryCache = new Map<string, { expiresAt: number; entries: Dirent[] }>();
const pendingDirectoryReads = new Map<string, Promise<Dirent[]>>();
const directoryCacheTtl = 100 * millisecond;
const maxDirectoryCacheEntries = 16;

const loadDirectory = async (cwd: string): Promise<Dirent[]> => {
  const existingRead = pendingDirectoryReads.get(cwd);
  if (existingRead != null) return existingRead;

  const pendingRead = fsAsync.readdir(cwd, { withFileTypes: true });
  pendingDirectoryReads.set(cwd, pendingRead);
  try {
    const entries = await pendingRead;
    directoryCache.set(cwd, { expiresAt: Date.now() + directoryCacheTtl, entries });
    if (directoryCache.size > maxDirectoryCacheEntries) {
      const oldestDirectory = directoryCache.keys().next().value as string | undefined;
      if (oldestDirectory != null) directoryCache.delete(oldestDirectory);
    }
    return entries;
  } finally {
    pendingDirectoryReads.delete(cwd);
  }
};

export const readDirectory = async (cwd: string, signal?: AbortSignal): Promise<Dirent[]> => {
  signal?.throwIfAborted();
  const cached = directoryCache.get(cwd);
  if (cached != null && cached.expiresAt >= Date.now()) {
    // delete-set results in LRU behavior
    directoryCache.delete(cwd);
    directoryCache.set(cwd, cached);
    return cached.entries;
  }
  directoryCache.delete(cwd);

  const entries = await loadDirectory(cwd);
  signal?.throwIfAborted();
  return entries;
};
