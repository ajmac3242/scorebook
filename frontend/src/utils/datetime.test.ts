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

  it("formats HH:mm and H:mm strings correctly", () => {
    expect(formatDisplayTime("14:30")).toBe("2:30 PM");
    expect(formatDisplayTime("09:15")).toBe("9:15 AM");
    expect(formatDisplayTime(" 18:00 ")).toBe("6:00 PM");
    expect(formatDisplayTime("9:00")).toBe("9:00 AM");
    expect(formatDisplayTime("00:00")).toBe("12:00 AM");
    expect(formatDisplayTime("23:59")).toBe("11:59 PM");
  });

  it("formats ISO datetime strings correctly", () => {
    expect(formatDisplayTime("2023-01-01T15:45:00Z")).toBe("3:45 PM");
  });

  it("returns the original string if parsing fails", () => {
    expect(formatDisplayTime("invalid-time")).toBe("invalid-time");
    // If it doesn't match the regex AND is invalid to dayjs, it returns original.
    expect(formatDisplayTime("not-a-time")).toBe("not-a-time");
  });
});
