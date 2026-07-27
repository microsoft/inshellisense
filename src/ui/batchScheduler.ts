// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export class BatchScheduler {
  #pending = false;
  #running = false;
  #scheduled = false;
  readonly #task: () => Promise<void>;
  readonly #onError: (error: unknown) => void;

  constructor(task: () => Promise<void>, onError: (error: unknown) => void) {
    this.#task = task;
    this.#onError = onError;
  }

  request(): void {
    this.#pending = true;
    if (this.#running || this.#scheduled) return;

    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;
      void this.#drain();
    });
  }

  async #drain(): Promise<void> {
    this.#running = true;
    try {
      while (this.#pending) {
        this.#pending = false;
        try {
          await this.#task();
        } catch (error) {
          this.#onError(error);
        }
      }
    } finally {
      this.#running = false;
    }
  }
}
