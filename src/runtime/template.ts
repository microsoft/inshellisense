// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fsAsync from "fs/promises";
import process from "node:process";

const filepathsTemplate = async (): Promise<Fig.Suggestion[]> => {
  const files = await fsAsync.readdir(process.cwd(), { withFileTypes: true });
  return files.filter((f) => f.isFile() || f.isDirectory()).map((f) => ({ name: f.name, priority: 90 }));
};

const foldersTemplate = async (): Promise<Fig.Suggestion[]> => {
  const files = await fsAsync.readdir(process.cwd(), { withFileTypes: true });
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

export const runTemplates = async (template: Fig.TemplateStrings[] | Fig.Template): Promise<Fig.Suggestion[]> => {
  const templates = template instanceof Array ? template : [template];
  return (
    await Promise.all(
      templates.map(async (t) => {
        switch (t) {
          case "filepaths":
            return await filepathsTemplate();
          case "folders":
            return await foldersTemplate();
          case "history":
            return historyTemplate();
          case "help":
            return helpTemplate();
        }
      }),
    )
  ).flat();
};
