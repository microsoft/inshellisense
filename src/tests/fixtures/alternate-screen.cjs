// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

let started;

process.stdin.setRawMode(true);
process.stdin.on("data", (data) => {
  for (const byte of data) {
    if (byte === 0x73) {
      started = performance.now();
    } else if (byte === 0x1b && started != null) {
      process.stdout.write(`ESCAPE RECEIVED ${Math.round(performance.now() - started)}ms\r\n`);
    } else if (byte === 0x71) {
      process.stdin.setRawMode(false);
      process.stdout.write("\x1b[?1049l");
      process.exit(0);
    }
  }
});
process.stdout.write("\x1b[?1049h\x1b[2J\x1b[HALTERNATE SCREEN READY\r\n");
