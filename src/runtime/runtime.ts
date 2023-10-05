import speclist, {
  diffVersionedCompletions as versionedSpeclist,
  // @ts-ignore
} from "@withfig/autocomplete/build/index.js";

const specs = (await Promise.all(
  speclist.map(async (spec: string) => {
    const prefix = versionedSpeclist.includes(spec) ? "/index.js" : `.js`;
    return (await import(`@withfig/autocomplete/build/${spec}${prefix}`))
      .default;
  })
)) as Fig.Spec[];

export const getSuggestions = (cmd: string) => {
  const suggestions: Fig.Suggestion[] = [
    {
      name: "test",
      description:
        "test this is a very long description that i'd expect to wrap",
    },
    { name: "test1", description: "test" },
    { name: "test2", description: "test" },
    { name: "test3", description: "test" },
    { name: "test4", description: "test" },
    { name: "test5", description: "test" },
  ];

  return suggestions;
};
