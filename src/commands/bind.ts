import {Command} from "commander";

const supportedShells = ["bash", "powershell", "windows-powershell"]

const action = (shell: string) => {
  if (!supportedShells.includes(shell)) {
    console.error(`Unsupported shell: ${shell}`);
    process.exit(1);
  }
  console.log(`Adding keybindings to ${shell} shell`);
};

const cmd = new Command("bind");
cmd.description(`adds keybindings to the selected shell: ${supportedShells}`);
cmd.action(action);

export default cmd