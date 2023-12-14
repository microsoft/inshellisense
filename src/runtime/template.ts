// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fsAsync from "node:fs/promises";
import path from "node:path";

const filepathsTemplate = async (cwd: string): Promise<Fig.Suggestion[]> => {
  const files = await fsAsync.readdir(cwd, { withFileTypes: true });
  return files.filter((f) => f.isFile() || f.isDirectory()).map((f) => ({ name: f.name, priority: 90 }));
};

const foldersTemplate = async (cwd: string): Promise<Fig.Suggestion[]> => {
  const files = await fsAsync.readdir(cwd, { withFileTypes: true });
  return files.filter((f) => f.isDirectory()).map((f) => ({ name: f.name, priority: 90 }));
};

// TODO: implement history template
const historyTemplate = (): Fig.Suggestion[] => {
  return [];
};

// TODO: implement help template
const helpTemplate = (): Fig.Suggestion[] => {
  return [];
};

export const runTemplates = async (template: Fig.TemplateStrings[] | Fig.Template, cwd: string): Promise<Fig.Suggestion[]> => {
  const t = path.resolve(cwd);
  const templates = template instanceof Array ? template : [template];
  return (
    await Promise.all(
      templates.map(async (t) => {
        switch (t) {
          case "filepaths":
            return await filepathsTemplate(cwd);
          case "folders":
            return await foldersTemplate(cwd);
          case "history":
            return historyTemplate();
          case "help":
            return helpTemplate();
        }
      }),
    )
  ).flat();
};
