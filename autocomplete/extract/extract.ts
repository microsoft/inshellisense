import * as fsAsync from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as child_process from "child_process";
import ProgressBar = require("progress");

const exclusions = new Set(["deno.ts", "rush.ts"]);
const renamings = {
  "-": "underscore",
};

const clearAllNewlines = (input: string): string => {
  return input.replaceAll(/[\r\n]+/g, "");
};

const escapeSpecialCharacters = (input: string): string => {
  return input.replaceAll("`", '"').replaceAll("\0", "\\\\0");
};

function chunk<T>(arr: T[], chuckSize: number): T[][] {
  const arrays: T[][] = [];
  for (let i = 0; i < arr.length; i += chuckSize)
    arrays.push(arr.slice(i, i + chuckSize));
  return arrays;
}

const main = async () => {
  const basePath = path.join(process.cwd(), ".fig");
  if (!fs.existsSync(basePath)) {
    await fsAsync.cp(path.join(process.cwd(), "fig", "src"), basePath, {
      recursive: true,
    });
  }

  const directoryItems = await fsAsync.readdir(basePath, {
    withFileTypes: true,
  });

  const progressBar = new ProgressBar(
    "extracting [:bar] :percent (:current/:total)",
    {
      total: directoryItems.length,
      complete: "=",
      incomplete: " ",
      width: 20,
    }
  );

  const dirItemChunks = chunk(directoryItems, 10);
  for (const dirChunk of dirItemChunks) {
    await Promise.all(
      dirChunk.map(async (directoryItem) => {
        if (!directoryItem.isFile()) {
          progressBar.tick();
          return;
        }
        if (exclusions.has(directoryItem.name)) {
          progressBar.tick();
          return;
        }

        const spec: Fig.Spec = (
          await import(path.join(basePath, directoryItem.name))
        ).default;

        if (typeof spec === "function") {
          progressBar.tick();
          return;
        }

        const filenameWithoutExtension = path.parse(directoryItem.name).name;
        const golangFilename =
          renamings[filenameWithoutExtension] != null
            ? renamings[filenameWithoutExtension]
            : filenameWithoutExtension;
        const subcommand = spec as unknown as Fig.Subcommand;
        const generatedCode = generateGolang(
          subcommand,
          filenameWithoutExtension
        );

        await fsAsync.writeFile(
          path.join(process.cwd(), "..", "specs", `${golangFilename}.go`),
          generatedCode
        );
        progressBar.tick();
      })
    );
  }

  const generatedFilesPath = path.join(process.cwd(), "..", "specs");
  child_process.exec(`gofmt -w ${generatedFilesPath}`);
};

const generateTemplate = (template: Fig.Template): string => {
  switch (template) {
    case "filepaths":
      return "model.TemplateFilepaths";
    case "folders":
      return "model.TemplateFolders";
    case "history":
      return "model.TemplateHistory";
    case "help":
      return "model.TemplateHelp";
  }
  throw Error("unknown template value");
};

const genName = (name: Fig.SingleOrArray<string> | undefined): string => {
  if (name == null) return "";
  return Array.isArray(name)
    ? `Name: []string{${name
        .filter((n) => n != null)
        .map((n) => `"${n}"`)
        .join(",")}},`
    : `Name: "${name}",`;
};

const genDescription = (description: string | undefined): string => {
  return description != null
    ? `Description: \`${escapeSpecialCharacters(description)}\`,`
    : "";
};

const genTemplates = (
  template: Fig.SingleOrArray<Fig.Template> | undefined
): string => {
  if (template == null) return "";
  const templates = Array.isArray(template) ? template : [template];
  return `Templates: []model.Template{${templates
    .map((t) => generateTemplate(t))
    .join(",")}},`;
};

const genOptions = (options: Fig.Option[] | undefined): string => {
  return options != null ? generateOptions(options) : "";
};

const genArgs = (args: Fig.SingleOrArray<Fig.Arg> | undefined): string => {
  return args != null ? generateArgs(args) : "";
};

const genSubcommands = (
  subcommand: Fig.SingleOrArray<Fig.Subcommand> | undefined
): string => {
  if (subcommand == null) return "";
  const subcommands = Array.isArray(subcommand) ? subcommand : [subcommand];
  return `Subcommands: []model.Subcommand{${subcommands
    .map((s) => generateSubcommand(s, false))
    .join(",")}},`;
};

const generateArgs = (args: Fig.SingleOrArray<Fig.Arg>): string => {
  const argList = Array.isArray(args) ? args : [args];
  const generatedArgs = argList
    .map((arg) => {
      return `{
      ${genTemplates(arg.template)}
      ${genName(arg.name)}
      ${genDescription(arg.description)}
    }`;
    })
    .join(",");
  return `Args: []model.Arg{${generatedArgs}},`;
};

const generateOptions = (options: Fig.Option[]): string => {
  const generatedOptions = options.map((option) => {
    return `{
      ${genName(option.name)}
      ${genDescription(option.description)}
      ${genArgs(option.args)}
    }`;
  });
  return `Options: []model.Option{${generatedOptions}},`;
};

const generateSubcommand = (
  subcommand: Fig.Subcommand,
  usePrefix = true
): string => {
  const prefix = usePrefix ? "model.Subcommand" : "";
  return `${prefix}{
    ${genName(subcommand.name)}
    ${genDescription(subcommand.description)}
    ${genArgs(subcommand.args)}
    ${genOptions(subcommand.options)}
    ${genSubcommands(subcommand.subcommands)}
  }`;
};

const generateGolang = (
  subcommand: Fig.Subcommand,
  filenameWithoutExtension: string
) => {
  return `// Code generated by autocomplete/extract/extract.ts. DO NOT EDIT.

  package specs
  
  import (
    "github.com/cpendery/clac/autocomplete/model"
  )

  func init() {
    Specs["${filenameWithoutExtension}"] = ${generateSubcommand(subcommand)}
  }`;
};

main();
