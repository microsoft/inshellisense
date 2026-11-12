// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeFileAtomic } from "../../utils/file.js";

let directory: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "is-file-test-"));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

const listTempFiles = () => fs.readdirSync(directory, { recursive: true }).filter((file) => String(file).endsWith(".tmp"));

describe("writeFileAtomic", () => {
  test("creates missing parent directories", async () => {
    const filePath = path.join(directory, "nested", "file.txt");
    await writeFileAtomic(filePath, "content");
    expect(fs.readFileSync(filePath, "utf-8")).toBe("content");
    expect(listTempFiles()).toEqual([]);
  });

  test("replaces an outdated file", async () => {
    const filePath = path.join(directory, "file.txt");
    fs.writeFileSync(filePath, "old");
    await writeFileAtomic(filePath, new Uint8Array(Buffer.from("new")));
    expect(fs.readFileSync(filePath, "utf-8")).toBe("new");
    expect(listTempFiles()).toEqual([]);
  });

  test("leaves an up to date file untouched", async () => {
    const filePath = path.join(directory, "file.txt");
    fs.writeFileSync(filePath, "same");
    const inode = fs.statSync(filePath).ino;
    await writeFileAtomic(filePath, "same");
    expect(fs.statSync(filePath).ino).toBe(inode);
  });

  if (process.platform !== "win32") {
    test("keeps the permissions of the replaced file", async () => {
      const filePath = path.join(directory, "helper");
      fs.writeFileSync(filePath, "old");
      fs.chmodSync(filePath, 0o755);
      await writeFileAtomic(filePath, "new");
      expect(fs.statSync(filePath).mode & 0o777).toBe(0o755);
    });
  }

  test("supports concurrent writers", async () => {
    const filePath = path.join(directory, "file.txt");
    fs.writeFileSync(filePath, "old");
    await Promise.all(Array.from({ length: 10 }, () => writeFileAtomic(filePath, "new")));
    expect(fs.readFileSync(filePath, "utf-8")).toBe("new");
    expect(listTempFiles()).toEqual([]);
  });
});
