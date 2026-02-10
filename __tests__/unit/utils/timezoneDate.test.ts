import { describe, expect, it } from "vitest";
import { isSameLocalDate, toLocalDateKey } from "@/lib/utils/timezoneDate";

describe("timezoneDate utils", () => {
  it("converts UTC instant to Europe/Istanbul local date key", () => {
    const key = toLocalDateKey("2026-02-03T21:30:00.000Z", "Europe/Istanbul");
    expect(key).toBe("2026-02-04");
  });

  it("converts UTC instant to America/New_York local date key", () => {
    const key = toLocalDateKey("2026-02-04T00:30:00.000Z", "America/New_York");
    expect(key).toBe("2026-02-03");
  });

  it("returns empty key for invalid date input", () => {
    const key = toLocalDateKey("not-a-date", "UTC");
    expect(key).toBe("");
  });

  it("compares local dates in a given timezone", () => {
    const same = isSameLocalDate(
      "2026-02-03T21:30:00.000Z",
      "2026-02-04T09:00:00.000Z",
      "Europe/Istanbul",
    );

    expect(same).toBe(true);
  });

  it('keeps selected day key aligned with event day key', () => {
    const selectedDate = new Date('2026-02-04T12:00:00-08:00');
    const eventInstant = '2026-02-03T21:30:00.000Z';
    const timezone = 'Europe/Istanbul';

    const selectedKey = toLocalDateKey(selectedDate, timezone);
    const eventKey = toLocalDateKey(eventInstant, timezone);

    expect(selectedKey).toBe('2026-02-04');
    expect(eventKey).toBe('2026-02-04');
    expect(selectedKey).toBe(eventKey);
  });
});
