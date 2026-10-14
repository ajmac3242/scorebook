import { describe, it, expect } from "vitest";
import { sanitizeRemoteData } from "./syncSanitizer";

describe("syncSanitizer", () => {
  it("returns null and primitive values unchanged", () => {
    expect(sanitizeRemoteData(null)).toBeNull();
    expect(sanitizeRemoteData(undefined)).toBeUndefined();
    expect(sanitizeRemoteData(42)).toBe(42);
    expect(sanitizeRemoteData("hello")).toBe("hello");
    expect(sanitizeRemoteData(true)).toBe(true);
  });

  it("filters forbidden prototype pollution keys from objects", () => {
    const unsafeData = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": "bad", "prototype": "bad", "safeKey": "ok"}',
    );
    const sanitized = sanitizeRemoteData(unsafeData) as Record<string, unknown>;

    expect(sanitized.safeKey).toBe("ok");
    expect(sanitized).not.toHaveProperty("__proto__");
    expect(sanitized.constructor).toBe(Object.prototype.constructor);
    expect(Object.keys(sanitized)).toEqual(["safeKey"]);
  });

  it("sanitizes arrays recursively", () => {
    const unsafeArray = [
      "item1",
      JSON.parse('{"__proto__": "bad", "valid": 123}'),
    ];
    const sanitized = sanitizeRemoteData(unsafeArray) as any[];

    expect(sanitized[0]).toBe("item1");
    expect(sanitized[1].valid).toBe(123);
    expect(Object.keys(sanitized[1])).toEqual(["valid"]);
  });

  it("handles depth limit greater than 10 for objects and arrays", () => {
    const createDeepObject = (depth: number): any => {
      if (depth === 0) return { key: "bottom" };
      return { nested: createDeepObject(depth - 1) };
    };

    const deepObj = createDeepObject(12);
    const sanitizedObj = sanitizeRemoteData(deepObj) as any;

    let current = sanitizedObj;
    for (let i = 0; i < 11; i++) {
      current = current.nested;
    }
    expect(current).toEqual({});

    const createDeepArray = (depth: number): any => {
      if (depth === 0) return ["bottom"];
      return [createDeepArray(depth - 1)];
    };

    const deepArr = createDeepArray(12);
    const sanitizedArr = sanitizeRemoteData(deepArr) as any;

    let currArr = sanitizedArr;
    for (let i = 0; i < 11; i++) {
      currArr = currArr[0];
    }
    expect(currArr).toEqual([]);
  });
});
