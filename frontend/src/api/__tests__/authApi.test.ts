import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { getCurrentUser } from "../authApi";

// Mock UserPool
vi.mock("../../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(() => ({
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "test-token" }),
        }),
      ),
    })),
  },
}));

describe("authApi", () => {
  describe("getCurrentUser", () => {
    it("returns the current user on a successful response", async () => {
      const user = await getCurrentUser();
      expect(user.email).toBe("test@example.com");
      expect(user.userId).toBeDefined();
    });

    it("throws an error when the API returns 401", async () => {
      server.use(
        http.get("*/user", () => {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
        }),
      );
      await expect(getCurrentUser()).rejects.toThrow();
    });

    it("sends the correct Authorization header", async () => {
      let capturedAuth: string | null = null;
      server.use(
        http.get("*/user", ({ request }) => {
          capturedAuth = request.headers.get("Authorization");
          return HttpResponse.json({
            userId: "u1",
            email: "a@b.com",
            username: "test",
          });
        }),
      );
      await getCurrentUser();
      expect(capturedAuth).toBe("Bearer test-token");
    });
  });
});
