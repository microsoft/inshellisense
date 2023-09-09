import * as fsAsync from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";

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
  await Promise.all(
    [directoryItems[10]].map(async (directoryItem) => {
      if (!directoryItem.isFile()) {
        return;
      }

      const spec: Fig.Spec = (
        await import(path.join(basePath, directoryItem.name))
      ).default;

      if (typeof spec === "function") {
        return;
      }

      const subcommand = spec as unknown as Fig.Subcommand;
      console.log(subcommand?.description);
    })
  );
};

const generateGolang = (subcommand: Fig.Subcommand) => {};

main();
