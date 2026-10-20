import { beforeEach, afterEach, vi } from "vitest";

beforeEach((ctx) => {
    vi.useFakeTimers();
    ctx._startedAt = Date.now();
});

afterEach(async (ctx) => {
    vi.useRealTimers();
});
