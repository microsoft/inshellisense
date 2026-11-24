// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { spawnSync } from "node:child_process";
import { Shell, supportedShells as shells, getShellExecutable, getShellLoginArgs } from "../utils/shell.js";
import { inferShell } from "../utils/shell.js";
import { loadConfig } from "../utils/config.js";
import { Command, CommanderError } from "commander";
import log from "../utils/log.js";
import { checkUnpackedVersion, refreshResources } from "../utils/node.js";
import { endTiming, startTiming } from "../utils/performance.js";
import { resetToInitialState } from "../utils/ansi.js";

export const supportedShells = shells.join(", ");

type RootCommandOptions = {
  shell: Shell | undefined;
  verbose: boolean | undefined;
  check: boolean | undefined;
  test: boolean | undefined;
  login: boolean | undefined;
};

const ensureResources = async () => {
  if (await checkUnpackedVersion()) return;
  const refreshTiming = startTiming();
  log.debug({ msg: "unpacked resources are out of date, refreshing" });
  await refreshResources();
  endTiming("startup.refreshResources", refreshTiming);
};

// The shell plugins exit the parent shell once `is` returns, so failing to start would immediately close the terminal.
// Instead, report the failure and hand the terminal over to the plain shell. ISTERM is set to a non-empty value other
// than "1" so the shell plugin doesn't start inshellisense again, while a manual `is` can still retry.
const runFallbackShell = async (shell: Shell, login: boolean, error: unknown): Promise<never> => {
  const { renderStartupFailure } = await import("../ui/ui-status.js");
  const message = error instanceof CommanderError ? undefined : error instanceof Error ? error.message : String(error);
  process.stderr.write(renderStartupFailure(message));

  try {
    const result = spawnSync(await getShellExecutable(shell), getShellLoginArgs(shell, login), {
      stdio: "inherit",
      env: { ...process.env, ISTERM: "0" },
    });
    if (result.error != null) throw result.error;
    process.exit(result.status ?? 1);
  } catch (e) {
    process.stderr.write(`unable to start ${shell}: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }
};

// Stops a session whose UI failed to set up and gives the terminal back in its original state for the fallback shell.
const abandonSession = (term: { kill: () => void }) => {
  try {
    term.kill();
  } catch {
    /* the shell may have already exited */
  }
  process.stdin.removeAllListeners("data");
  process.stdin.pause();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdout.write(resetToInitialState);
};

const startSession = async (program: Command, shell: Shell, underTest: boolean, login: boolean) => {
  // settle both before failing so a resource refresh is never left half-written behind the fallback shell
  const results = await Promise.allSettled([ensureResources(), loadConfig(program)]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure != null) throw failure.reason;
  log.overrideConsole();

  const [{ initializeRuntime }, { render }, isterm] = await Promise.all([
    import("../runtime/initialize.js"),
    import("../ui/ui-root.js"),
    import("../isterm/index.js"),
  ]);
  await initializeRuntime(shell);
  const term = await isterm.default.spawn(program, { shell, rows: process.stdout.rows, cols: process.stdout.columns, underTest, login });
  return { term, render };
};

export const action = (program: Command) => async (options: RootCommandOptions) => {
  const startupTiming = startTiming();
  const inISTerm = process.env.ISTERM === "1";
  if (options.check || inISTerm) {
    const { renderConfirmation } = await import("../ui/ui-status.js");
    process.stdout.write(renderConfirmation(inISTerm));
    endTiming("startup.check", startupTiming);
    process.exit(0);
  }

  if (options.verbose) await log.enable();

  const shell = (options.shell ?? (await inferShell())) as Shell | undefined;
  if (shell == null) {
    program.error(`Unable to identify shell, use the -s/--shell option to provide your shell`, { exitCode: 1 });
  }
  if (!shells.map((s) => s.valueOf()).includes(shell)) {
    program.error(`Unsupported shell: '${shell}', supported shells: ${supportedShells}`, { exitCode: 1 });
  }
  const login = options.login ?? false;

  // from here on, errors (including commander's program.error, e.g. for an invalid config) fall back to the plain shell
  program.exitOverride();
  let session: Awaited<ReturnType<typeof startSession>>;
  try {
    session = await startSession(program, shell, options.test ?? false, login);
  } catch (error) {
    log.debug({ msg: "inshellisense failed to start", error: error instanceof Error ? error.message : error });
    return runFallbackShell(shell, login, error);
  }
  endTiming("startup.beforeRender", startupTiming);
  try {
    await session.render(session.term, shell);
  } catch (error) {
    log.debug({ msg: "inshellisense failed to render", error: error instanceof Error ? error.message : error });
    abandonSession(session.term);
    return runFallbackShell(shell, login, error);
  }
};
