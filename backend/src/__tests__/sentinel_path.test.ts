import {
  describe,
  it,
  expect,
} from "@jest/globals";
import { normalizePath } from "../utils.js";

describe("Sentinel Path Normalization", () => {
  it("handles URL-encoded path traversal attempts", () => {
    const event: any = { rawPath: "/api/..%2f..%2fetc/passwd" };
    expect(normalizePath(event)).toBe("/");
  });

  it("handles nested URL-encoded traversal attempts", () => {
    const event: any = { rawPath: "/api/%2e%2e/%2e%2e/etc/passwd" };
    expect(normalizePath(event)).toBe("/");
  });

  it("returns root path if decodeURIComponent fails", () => {
    const event: any = { rawPath: "/api/%E0%A4%A" }; // Malformed
    expect(normalizePath(event)).toBe("/");
  });
});
