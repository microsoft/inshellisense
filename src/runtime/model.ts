export type Suggestion = {
  name: string;
  allNames: string[];
  description?: string;
  icon: string;
};

export type SuggestionBlob = {
  suggestions: Suggestion[];
  argumentDescription?: string;
};
