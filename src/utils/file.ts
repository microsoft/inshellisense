// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import fsAsync from "node:fs/promises";

const readExistingFile = async (filePath: string): Promise<{ content: Buffer; mode: number } | undefined> => {
  try {
    const [content, stats] = await Promise.all([fsAsync.readFile(filePath), fsAsync.stat(filePath)]);
    return { content, mode: stats.mode };
  } catch {
    return undefined;
  }
};

/**
 * Writes a file by renaming a sibling temp file over the destination so concurrent writers (e.g. several terminal tabs
 * starting right after an upgrade) never observe a partially written file, and processes that already loaded the
 * previous file (e.g. a native module) keep their copy. Skips the write when the content is already up to date and keeps
 * the permissions of the file being replaced (e.g. an executable helper stays executable).
 */
export const writeFileAtomic = async (filePath: string, data: string | Uint8Array): Promise<void> => {
  const content = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  const existing = await readExistingFile(filePath);
  if (existing != null && existing.content.equals(content)) return;

  await fsAsync.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await fsAsync.writeFile(tempPath, content);
    if (existing != null) await fsAsync.chmod(tempPath, existing.mode & 0o7777);
    await fsAsync.rename(tempPath, filePath);
  } catch (e) {
    await fsAsync.rm(tempPath, { force: true });
    throw e;
  }
};
