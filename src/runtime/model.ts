// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type Suggestion = {
  name: string;
  allNames: string[];
  description?: string;
  icon: string;
  priority: number;
  insertValue?: string;
  type?: Fig.SuggestionType;
  hidden?: boolean;
};

export type SuggestionBlob = {
  suggestions: Suggestion[];
  argumentDescription?: string;
  charactersToDrop?: number;
};
