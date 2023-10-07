export type Suggestion = {
  name: string;
  description?: string;
  icon: string;
};

export type SuggestionBlob = {
  suggestions: Suggestion[];
  argumentDescription?: string;
};
