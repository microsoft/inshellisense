// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** Specs maintained in this package. They take precedence over @withfig/autocomplete specs of the same name. */
export const bundledSpecs: Record<string, () => Promise<{ default: Fig.Spec }>> = {
  uv: () => import("./uv.js"),
  uvx: () => import("./uvx.js"),
};
