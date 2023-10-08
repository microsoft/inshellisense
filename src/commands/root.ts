import { render } from "../ui/ui-root.js";
import { executeShellCommandTTY } from "../runtime/utils.js";

const shells = ["bash", "powershell", "pwsh"];
export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: string | undefined;
  command: string | undefined;
};

export const action = async (options: RootCommandOptions) => {
  const shell = options.shell ?? "";
  if (!shells.includes(shell)) {
    console.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`);
    process.exit(1);
  }

  const commandToExecute = await render(options.command);
  const result = await executeShellCommandTTY(shell, commandToExecute);
  if (result.code) {
    process.exit(result.code);
  } else {
    process.exit(0);
  }
  // TODO: cache executed command to add to history
};
