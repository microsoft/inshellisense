const filepathsTemplate = (): Fig.Suggestion[] => {
  return [];
};

const foldersTemplate = (): Fig.Suggestion[] => {
  return [];
};

const historyTemplate = (): Fig.Suggestion[] => {
  return [];
};

const helpTemplate = (): Fig.Suggestion[] => {
  return [];
};

export const runTemplates = (template: Fig.TemplateStrings[] | Fig.Template): Fig.Suggestion[] => {
  const templates = template instanceof Array ? template : [template];
  return templates
    .map((t) => {
      switch (t) {
        case "filepaths":
          return filepathsTemplate();
        case "folders":
          return foldersTemplate();
        case "history":
          return historyTemplate();
        case "help":
          return helpTemplate();
      }
    })
    .flat();
};
