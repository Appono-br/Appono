import { vi } from "vitest";

export function setSystemTime(dateOrIso) {
    const date = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
    vi.setSystemTime(date);
    return date;
}

export function advanceMinutes(minutes) {
    vi.advanceTimersByTime(minutes * 60_000);
}

export function advanceSeconds(seconds) {
    vi.advanceTimersByTime(seconds * 1_000);
}

export function brasiliaTime(date, time) {
    return new Date(`${date}T${time}-03:00`);
}
