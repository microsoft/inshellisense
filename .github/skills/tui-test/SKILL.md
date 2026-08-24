---
name: tui-test
description: "Drive, inspect, assert on, record, and watch a real terminal from the command line with the tui-test cli. Use when running shells (bash, zsh, fish, PowerShell, pwsh, cmd, xonsh, elvish, nushell) or TUI programs (vim, less, top, etc.) in a headless PTY; sending keystrokes, key combos, or mouse input; resizing, writing raw bytes, or signaling the child; waiting for a command to finish or the screen to settle; asserting on terminal text, colors, exit codes, output, or snapshots; capturing text or full-color SVG screenshots; recording and replaying asciinema sessions; watching a live cli session while an agent drives it; or driving process-local sessions from Rust, Python, or Node."
---

# tui-test

`tui-test` controls a real terminal from the command line. It runs shells and
TUI programs in a headless PTY behind a background daemon: a stateless cli front
end talks to a daemon that owns the PTY and renders it into a full terminal
emulator. Each call connects, acts, and exits, and they all share one live
session. With it you can spawn a session, read the rendered screen, send keys
and mouse input, wait for a condition, assert on the result, and record the
session.

## Built for agents: self-documenting commands

Three commands let an agent look up the rest of the surface instead of guessing:

- `tui-test agent-context`: versioned JSON describing every command, flag,
  enum, default, and the exit-code taxonomy. It is generated from the cli, so it
  stays in sync. Read this first when you need exact argument shapes.
- `tui-test usage`: a one-screen command cheatsheet.
- `tui-test skill`: this guide.

## Core model

- **Sessions.** `--session <name>` (default `default`, env `TUI_TEST_SESSION`)
  selects a terminal. The first command auto-starts that session's daemon; the
  session persists across calls until `close`. Sessions are independent.
- **Stateless calls.** Each invocation connects to the daemon, acts, and exits.
  State (screen, cwd, last command) lives in the daemon, not the cli.
- **JSON.** Pass `--json` on any command for machine-readable output. Data goes
  to stdout, diagnostics to stderr. On failure the JSON carries a `"kind"`
  (`assertion` / `usage` / `no_session` / `internal`).
- **Verbose.** `--verbose` / `-v` starts the daemon with a full PTY traffic log
  (see [Debugging](#debugging)). Only takes effect when the daemon starts.
- **Daemon upgrades.** A client automatically replaces a daemon from another
  `tui-test` version. Per-session locking prevents concurrent clients from
  racing the restart.
- **Defaults.** New sessions are `80x30`. Timeouts come in five classes: `text`
  and `idle` default to 5s; `command`, `exit`, and `ready` to 30s. Set a session
  default in the selected config profile or with `open --timeout-<class> <ms>`,
  or override one call with `--timeout`. `state` reports the effective values.

## Exit codes

Every command returns a stable exit code so you can branch on the failure class
without parsing text:

| Code | Meaning                                                 |
| ---- | ------------------------------------------------------- |
| `0`  | success                                                 |
| `1`  | assertion or wait condition not met (`expect` / `wait`) |
| `2`  | usage / invalid argument                                |
| `3`  | no active session (run `open` / `run` first)            |
| `4`  | daemon or IPC error                                     |
| `5`  | internal error                                          |

## Command reference

### Session & lifecycle

| Command                                                                  | Description                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `open [--shell S] [--backend B] [--cols N] [--rows N] [--cwd D] [--env K=V]... [--config F] [--profile P] [--restart]` | Spawn or reuse a shell session. `--env` is repeatable. |
| `run [--backend B] [--cols N] [--rows N] [--cwd D] [--env K=V]... [--config F] [--profile P] [--restart] <program> [args...]` | Spawn or reuse a session running a program directly. |
| `sessions`                                                               | List active sessions.                                                  |
| `close [--all]`                                                          | Close the current session (or every session with `--all`).             |
| `daemon start`                                                           | Start this session's daemon. Most commands start one on demand.        |
| `daemon status`                                                          | Inspect a session's daemon (pid, log path). Exit 3 if none is running. |
| `daemon stop --session N \| --all`                                       | Stop one session's daemon, or every daemon. Needs a target.            |

`open` and `run` reuse an existing live child for the selected session. Pass
`--restart` (or `--force`) to replace it.

### Inspection

| Command                                             | Description                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `state`                                             | cwd, size, cursor, window title, last command + exit code, bell count, timeouts, and a text snapshot. |
| `text [--full]`                                     | Rendered viewport text, or full scrollback with `--full`.                                                           |
| `screenshot [PATH] [-o FILE] [--full] [--zoom N]`   | Terminal text to stdout, or a full-color SVG scaled without changing its terminal cells.                           |
| `cells X Y [W H]`                                   | Per-cell attributes (char, fg, bg, flags) for a region.                                                             |
| `get command\|output\|exit-code\|cwd\|cursor\|size\|title\|bells\|bell-events` | One structured field.                                                                                        |

### Input

| Command                                                                    | Description                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `type "text"`                                                              | Type literal text (no return key).                                           |
| `submit ["text"]`                                                          | Type text then press the shell's return key. Omit text to just submit.       |
| `key press <Key...>`                                                       | Simulate key presses, e.g. `key press Ctrl+C`.                               |
| `key down <Key...>` / `key up <Key...>`                                    | Simulate explicit keydown and keyup events.                                  |
| `key repeat <Key...>`                                                      | Send repeat events (press-equivalent in legacy mode).                        |
| `mouse click X Y` / `mouse click --on-text "OK" [--button N] [--clicks N]` | Click by coordinates or by visible label.                                    |
| `mouse move\|down\|up\|drag\|scroll ...`                                   | Full mouse control (`--button` default 0=left, `scroll --amount` default 3). |

Key input automatically follows the Kitty keyboard protocol flags negotiated by
the child application. A `key press` sends the normal press input and adds a
release only when the child requests event-type reporting. Text-producing keys
also require report-all-keys mode before repeat and release events can be
represented. Modifiers are `Ctrl`, `Alt` / `Option`, `Shift`, `Super`, `Hyper`,
and `Meta`. Top-level `press` remains a compatibility alias for `key press`.

### PTY control

| Command                        | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `resize COLS ROWS`             | Resize the PTY and emulator.                         |
| `write <data>`                 | Write raw bytes to the PTY (no return key appended). |
| `signal INT\|TERM\|KILL\|QUIT` | Send a signal to the session's child process.        |
| `kill`                         | Kill the session's child process.                    |

### Wait (block until a condition holds)

| Command                                             | Description                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `wait text "T" [--regex --full --not --timeout MS]` | Until text/regex is (with `--not`, is not) visible. Most precise wait.                     |
| `wait title "T" [--regex --not --timeout MS]`       | Until the window title (`OSC 0`/`OSC 2`) matches. Programs announce progress there.        |
| `wait idle [--timeout MS]`                          | Until the screen stops repainting (~250ms quiet).                                          |
| `wait command [--timeout MS]`                       | Until the current foreground command finishes (needs shell integration).                   |
| `wait exit [--timeout MS]`                          | Until the session's program/shell itself exits.                                            |
| `wait ready [--timeout MS]`                         | Until the shell reports a ready prompt (needs shell integration). `open` waits by default. |
| `wait bell [--timeout MS]`                          | Until the next terminal bell event.                                                        |

### Expect (exit 0 = pass, 1 = fail)

| Command                                                                         | Description                                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `expect text "T" [--regex --full --no-strict --not --fg C --bg C --timeout MS]` | Visibility plus optional color. `--no-strict` relaxes a strict single-match.  |
| `expect title "T" [--regex --not --timeout MS]`                                 | The window title set with `OSC 0`/`OSC 2`. An unset title matches nothing.    |
| `expect exit-code N [--timeout MS]`                                             | The last command's exit code. Waits for the command to finish first.          |
| `expect output "T" [--regex]`                                                   | The last command's captured output.                                           |
| `expect bell N [--timeout MS]`                                                  | The cumulative bell count reaches at least N.                                 |
| `expect snapshot NAME [-u] [--include-colors --include-title]`                                  | Compare the screen against `__snapshots__/NAME.snap`; `-u` writes/updates it. `--include-title` records the window title in the frame; off by default because a prompt often sets it to a host and path. |

Colors accept ansi-256 (`9`), hex (`#ff0000`), or rgb (`255,0,0`).

### Recording, monitor & self-docs

| Command                             | Description                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `record start OUT [options]`        | Start APNG, GIF, MP4, or asciicast recording; `--zoom N` scales image/video output. |
| `record stop`                       | Finish the active recording.                                                 |
| `get-recording [session]`           | Print the always-on asciinema v2 cast (works even after the session stopped).|
| `monitor`                           | Watch the session live, full-color, in another terminal.                     |
| `usage` / `agent-context` / `skill` | Self-documentation (see top of guide).                                       |

## Workflow: run a command and check the result

```sh
tui-test open                       # start a shell session
tui-test submit "echo hello"        # type text + Enter
tui-test wait command               # block until the command finishes
tui-test expect text "hello"        # assert it appeared (exit 1 if not)
tui-test expect exit-code 0         # assert the command succeeded
tui-test close
```

`submit` types text then presses Enter; `type` types without Enter; `key press`
simulates key presses (`key press Escape : w q Enter`, `key press Ctrl+C`);
`key down` and `key up` simulate explicit keydown and keyup events, and
`key repeat` sends repeat events.

## Workflow: drive a TUI program

```sh
tui-test run vim file.txt
tui-test wait idle                  # let the screen finish rendering
tui-test key press i                # enter insert mode
tui-test type "some text"
tui-test key press Escape : w q Enter # save and quit
tui-test wait exit
```

## Workflow: mouse interaction

```sh
tui-test mouse click --on-text "OK"     # click a label, no coordinates needed
tui-test mouse click 10 5 --clicks 2    # double-click at column 10, row 5
tui-test mouse scroll down --amount 5   # scroll the wheel
tui-test mouse drag 2 2 20 2            # drag from (2,2) to (20,2)
```

## Workflow: assert colors

```sh
tui-test cells 0 0 10 1                       # inspect char/fg/bg/flags
tui-test expect text "ERROR" --fg "#ff0000"   # text present AND red
tui-test expect text "OK" --fg 2 --bg 0       # ansi-256 fg/bg
tui-test expect text "plain" --fg default     # asserts the cell set no color
```

## Workflow: snapshot testing

```sh
tui-test expect snapshot main-view -u                    # create/update the snapshot
tui-test expect snapshot main-view                       # later: assert it still matches
tui-test expect snapshot main-view --include-colors      # also compare per-cell colors
```

Snapshots live in `__snapshots__/<NAME>.snap` next to where you run the command.

## Waiting: pick the right one

- `wait text "T"`: waits until text/regex is visible. The most precise wait; use
  it whenever you know what output to look for. `--not` waits for it to disappear.
- `wait command`: waits until the current command finishes, via the shell's OSC
  integration markers. Use it after `submit`. Without shell integration it falls
  back to "screen idle". Bump `--timeout` for long commands (default 30s).
- `wait idle`: waits until the screen stops repainting. This tracks visual
  quiescence, not completion: a silent command like `sleep 100` counts as idle
  almost immediately. Use it to let a TUI finish drawing.
- `wait exit`: waits until the program/session itself exits. Use for
  `run <program>` sessions or after sending `exit`.
- `wait ready`: waits until the shell reports a ready prompt. `open` does this
  for you.

## Recording

Every session records automatically from the moment it opens, in asciinema v2
cast format, stored in your XDG cache by session name. The path is reported in
the `open` / `run` response. Recordings persist after the session ends; stale
ones are swept when a daemon next starts (recordings of still-running sessions
are kept).

```sh
tui-test get-recording > demo.cast    # current session's recording to stdout
tui-test get-recording work > w.cast  # a specific session by name (even if stopped)
```

Record a selected span directly to APNG, GIF, MP4, or cast:

```sh
tui-test record start demo.png --zoom 0.5
tui-test submit "echo hello"
tui-test wait command
tui-test record stop
```

APNG, GIF, and MP4 render at 2x pixel density. `--zoom` multiplies the output
dimensions without changing the rows or columns; `--zoom 0.5` produces a 1x
export. Resize events change the terminal window size inside a centered,
opaque canvas sized for the recording's largest frame. Use `--fps`, `--speed`,
and `--idle-time-limit` to tune playback. `.cast` output does not use zoom and
interoperates with the asciicast ecosystem without adding any GPL dependency
to tui-test. If a process exits before `record stop`, an APNG/GIF/MP4 capture
remains beside the target as `OUT.tui-test.cast`.

## Live monitor

Watch a session live in a second terminal while an agent drives it; both share
the same daemon. `monitor` takes over an alternate screen and streams the
session in full color at ~20fps. Press `q`, `Esc`, or `Ctrl-C` to detach.

```sh
tui-test --session work monitor   # watch the 'work' session live
```

It needs an interactive terminal (exit `2` otherwise) and an existing session
(exit `3` if none). It only reads shared screen state, so watching never blocks
the commands the agent runs; resizing the window re-fits the frame.

This works only with standalone CLI sessions.

## Programmatic use (Rust, Python, and JavaScript)

The Rust crate and the Python and JavaScript packages run the terminal engine
in-process. Session names, registries, and recordings are process-local. A
native session cannot be listed, attached to, controlled, or monitored from
another process, including by the standalone CLI.

These programmatic APIs do not install or require the `tui-test` CLI. Only
the standalone CLI uses the daemon and JSON-over-local-socket protocol
described elsewhere in this guide.

Node is the supported JavaScript runtime. Bun and Deno compatibility is best
effort and does not gate releases. Deno requires a local `node_modules`
directory and `--allow-ffi` in addition to read/write permissions.

```sh
cargo add tui-test  # Rust 1.88+
pip install tui-test              # Python 3.8+, imported as `tui_test`
npm install @microsoft/tui-test   # Node 20+ (ESM only)
bun add @microsoft/tui-test       # Bun (best effort)
deno add npm:@microsoft/tui-test  # Deno 2 (best effort)
```

Rust:

```rust
use tui_test::{OpenOptions, Operation, Session};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let session = Session::new(format!("rust-example-{}", std::process::id()));
    session.open(OpenOptions::default())?;
    session.execute(Operation::Submit {
        data: Some("echo hello".into()),
    })?;
    session.execute(Operation::WaitCommand {
        timeout_ms: Some(30_000),
    })?;
    session.execute(Operation::ExpectText {
        text: "hello".into(),
        regex: false,
        full: false,
        strict: false,
        not: false,
        fg: None,
        bg: None,
        timeout_ms: Some(5_000),
    })?;
    session.execute(Operation::ExpectExitCode {
        code: 0,
        timeout_ms: Some(5_000),
    })?;
    session.close()?;
    Ok(())
}
```

Python:

```python
import asyncio
from tui_test import TuiTest

async def main():
    async with TuiTest() as su:                     # closes the session on exit
        await su.open()
        await su.submit("echo hello")
        await su.wait_command()
        await su.expect_text("hello", strict=False)  # command echo + output both match
        await su.expect_exit_code(0)

asyncio.run(main())
```

Node (the same API may work on Bun and Deno):

```js
import { TuiTest } from "@microsoft/tui-test";

const su = new TuiTest();
await su.open();
await su.submit("echo hello");
await su.waitCommand();
await su.expectText("hello", { strict: false });
await su.expectExitCode(0);
await su.close();
```

The Rust crate exposes `Session` and `SessionRegistry` for terminal ownership,
plus the `Operation` and `OperationResult` enums for the command surface.

Python and JavaScript methods mirror the cli commands: `open` / `run`, `submit`
/ `type` / `write`, `keyboard.press|down|repeat|up`, compatibility
`press`,
`mouse.click|move|down|up|drag|scroll`,
`resize`, `signal` / `kill`, `state`, `text`, `cells`, the dedicated
`get_command` / `get_output` / `get_exit_code` / `get_cwd` / `get_cursor` /
`get_size` / `get_title` / `get_bell_count` / `get_bell_events` methods,
`screenshot`, `start_recording` / `stop_recording`, `wait_text` / `wait_title` / `wait_idle` / `wait_command` /
`wait_exit` / `wait_ready` / `wait_bell`, `expect_text` / `expect_title` /
`expect_exit_code` / `expect_output` / `expect_bell_count` / `expect_snapshot`,
and `close`. Python module-level helpers are `sessions`,
`close_all`, and `get_recording`; JavaScript exports `sessions`, `closeAll`,
and `getRecording`. The JavaScript client otherwise uses the same names in
camelCase (`startRecording`, `stopRecording`, `waitCommand`, `expectText`,
`getExitCode`, etc.).

The constructors accept a session name plus backend, profile, timeout, and
artifact options: `TuiTest(session="default", *, backend=None, timeouts=None,
profile=None, artifacts=None)` in Python and `new TuiTest(session?, {
backend?, profile?, timeouts?, artifacts? })` in JavaScript. `run` takes the
program then its arguments
(`await su.run("vim", "file.txt")` in Python, `await su.run("vim",
["file.txt"])` in JavaScript).

Python and JavaScript failures raise typed errors instead of returning exit
codes, one class per row of the applicable [exit-code table](#exit-codes):
`ExpectationError` (1), `UsageError` (2), `NoSessionError` (3), and
`InternalError` (5), all subclasses of `TuiTestError`.

## Terminal backends

`open` and `run` accept `--backend alacritty|ghostty|rio`; Alacritty is the
default. The Python and JavaScript constructors accept the same canonical
strings as a client default, and each `open`/`run` can override it.

```sh
tui-test open --backend ghostty
tui-test run --backend rio -- vim file.txt
```

Every enabled backend satisfies the same cell-grid contract. Ghostty preserves
the blink attribute, while Alacritty and Rio cannot report it. Command
boundaries, exit codes, cwd, and captured command output are parsed separately
from the raw PTY stream, so switching emulators does not change shell
integration behavior.

## Configuration

`tui-test.toml` holds named profiles; `--profile NAME` selects one and
`--config PATH` picks the file. Looked up nearest first: `./tui-test.toml`
then the platform config directory (`$XDG_CONFIG_HOME/tui-test/tui-test.toml`
on Unix), then `~/.tui-test/tui-test.toml`. No discovered file is fine;
`--config` and `TUI_TEST_CONFIG` are explicit and error when their path is
missing.

```toml
[profiles.ci]
scrollback = 500

[profiles.ci.timeouts]
text = 15000
ready = 60000

[profiles.ci.colors]
red = "#ff0000"
```

A profile sets timeout defaults, `scrollback` (default 10000), and colors:
`foreground`, `background`, `cursor`, and the 16 ANSI slots by name (`red`,
`bright_red`, ...). Indices 16-255 are spec-defined and not configurable, so
`--fg 196` is stable across profiles. Unknown settings and invalid colors are
rejected before a session starts.

Named profiles do not inherit from `[profiles.default]`; omitted fields use
tui-test's built-in defaults. The in-process APIs accept profile objects:
Rust passes `Profile` directly, Python uses `Profile` / `Colors`, and
JavaScript uses `{ scrollback, colors }`. A profile can be a client default or
a per-`open` / per-`run` override. The bindings do not load `tui-test.toml`.

The palette is what a screenshot paints **and** what `expect --fg/--bg` matches
a `#rrggbb` against, so the two always agree.

Programs can also set and query colours at runtime with `OSC 4/10/11/12` and
reset them with `OSC 104/110/111/112`. A query is answered with the colour
currently showing; a reset restores the profile's colour, which no escape
sequence can change. Note that a program setting a colour also changes what a
screenshot of that session looks like.

## Supported shells & integration

`open --shell S` accepts: `bash`, `zsh`, `fish`, `powershell`, `pwsh`, `cmd`,
`xonsh`, `elvish`, `nushell`. Omit `--shell` to use the platform default.

`tui-test` injects shell integration (standard OSC 133 semantic-prompt markers,
plus OSC 7 for cwd) so it can track command boundaries, exit codes, cwd, and
command/output text across shells. This is what powers `wait command`,
`expect exit-code`, `get cwd`, and `get command|output`.

Integration coverage varies by shell: `powershell` has no native pre-exec hook
so command/output text is best-effort (exit code and cwd still track); `cmd` is
prompt-only.

## Debugging

By default the daemon writes no log. Start it with `--verbose` to record every
byte read from and written to the PTY, plus lifecycle events, to
`~/.tui-test/<session>.log`. Logging is fixed when the daemon starts, so enable
it on a fresh daemon (close any existing one first):

```sh
tui-test --session work close            # stop any existing daemon
tui-test --session work --verbose open   # start one with logging on
tui-test --session work submit "ls"
cat ~/.tui-test/work.log
```

`tui-test daemon status` reports the active log path.

**Stuck session?** If the screen is frozen and input seems ignored (e.g. after
`git log` / `git diff`), a full-screen pager such as `less` is likely holding the
terminal, and `Ctrl+C` won't quit it. Confirm with `tui-test state`
(`"ready": false` and a stale last command). Quit the pager with
`tui-test key press q`, or avoid it with `git --no-pager <cmd>` or
`GIT_PAGER=cat`.

**Platform note.** On Windows ConPTY, `get output` and `get command` text can on some rare occasions be
unreliable due to screen repainting; grid-based checks (`expect text`,
`expect exit-code`) are unaffected. ConPTY also gives a session a window title
before anything runs (the program's path, e.g. `C:\Program Files\Git\bin\bash.EXE`),
where a unix PTY starts with none, so treat `get title` on a fresh session as
platform-dependent and assert on a title only after a program sets one.
