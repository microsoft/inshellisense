import path from "node:path";
import os from 'node:os'
import fsAsync from "node:fs/promises";
import { Shell } from "./bindings.js";
export interface Alias {
    from: string,
    to: string
}

export const readAlias = async (shell: Shell): Promise<Alias[] | undefined> => {
    switch (shell) {
        case Shell.Zsh: {
            const zshConfigPath = path.join(os.homedir(), ".zshrc");
            const zshConfig = (await fsAsync.readFile(zshConfigPath)).toString();
            return zshConfig
                .split('\n')
                .filter(line => line.startsWith('alias'))
                .map(line => {
                    //remove `alias ` and `"`
                    const [from, to] = line.replace(/alias\s/, '')
                        .replace(/\"/g, '')
                        .split('=', 2);
                    return { from, to };
                });
        }
        //TODO more shell support
    }
}

export const replaceCommand = async (shell: Shell) => {
    const alias = await readAlias(shell);
    return (command: string) => {
        if (typeof alias === 'undefined')
            return command;
        for (const aliaPair of alias) {
            if (aliaPair.from === command)
                return aliaPair.to
        }
        return command;
    }

}

export const aliaReplace = async (shell: Shell, command: string) => {
    const replace = await replaceCommand(shell);
    return replace(command);
}