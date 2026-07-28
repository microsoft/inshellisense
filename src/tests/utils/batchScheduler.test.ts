// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BatchScheduler } from "../../ui/batchScheduler.js";

const flushTasks = async () => {
  for (let index = 0; index < 5; index++) {
    await Promise.resolve();
  }
};

test("batches requests made before work starts", async () => {
  let calls = 0;
  const task = async () => {
    calls += 1;
  };
  const scheduler = new BatchScheduler(task, () => {});

  for (let index = 0; index < 100; index++) {
    scheduler.request();
  }
  await flushTasks();

  expect(calls).toBe(1);
});

test("runs one follow-up task when requested during work", async () => {
  let release = () => {};
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  const task = async () => {
    calls += 1;
    if (calls === 1) await blocked;
  };
  const scheduler = new BatchScheduler(task, () => {});

  scheduler.request();
  await flushTasks();
  for (let index = 0; index < 100; index++) {
    scheduler.request();
  }
  release();
  await flushTasks();
  await flushTasks();

  expect(calls).toBe(2);
});

test("reports failures and continues with newer work", async () => {
  const errors: unknown[] = [];
  let calls = 0;
  const onError = (error: unknown) => errors.push(error);
  const task = async () => {
    calls += 1;
    if (calls === 1) throw new Error("failed");
  };
  const scheduler = new BatchScheduler(task, onError);

  scheduler.request();
  await flushTasks();
  scheduler.request();
  await flushTasks();

  expect(errors).toHaveLength(1);
  expect(calls).toBe(2);
});
