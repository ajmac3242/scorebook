import { describe, it, expect } from "vitest";
import { formatDisplayTime } from "./datetime";

describe("formatDisplayTime", () => {
  it("returns empty string for null or undefined", () => {
    expect(formatDisplayTime(null)).toBe("");
    expect(formatDisplayTime(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(formatDisplayTime("")).toBe("");
    expect(formatDisplayTime("   ")).toBe("");
  });

  it("formats HH:mm strings correctly", () => {
    expect(formatDisplayTime("14:30")).toBe("2:30 PM");
    expect(formatDisplayTime("09:15")).toBe("9:15 AM");
    expect(formatDisplayTime(" 18:00 ")).toBe("6:00 PM");
  });

  it("formats ISO datetime strings correctly", () => {
    expect(formatDisplayTime("2023-01-01T15:45:00Z")).toBe("3:45 PM");
  });

  it("returns the original string if parsing fails", () => {
    expect(formatDisplayTime("invalid-time")).toBe("invalid-time");
    // Dayjs might actually parse 99:99 in some environments or versions,
    // but the regex should catch HH:mm.
    // If it doesn't match the regex AND is invalid to dayjs, it returns original.
    expect(formatDisplayTime("not-a-time")).toBe("not-a-time");
  });
});
