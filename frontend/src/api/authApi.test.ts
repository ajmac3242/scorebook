import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { getCurrentUser, getAccessToken } from "./authApi";
import { UserPool } from "../UserPool";

// Mock UserPool
vi.mock("../UserPool", () => ({
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
  describe("getAccessToken", () => {
    it("returns the token when session is valid", async () => {
      const token = await getAccessToken();
      expect(token).toBe("test-token");
    });

    it("returns null when no user is logged in", async () => {
      vi.mocked(UserPool.getCurrentUser).mockReturnValueOnce(null);
      const token = await getAccessToken();
      expect(token).toBeNull();
    });

    it("returns null when session is invalid", async () => {
      vi.mocked(UserPool.getCurrentUser).mockReturnValueOnce({
        getSession: vi.fn((cb) =>
          cb(null, {
            isValid: () => false,
          }),
        ),
      } as any);
      const token = await getAccessToken();
      expect(token).toBeNull();
    });

    it("returns null when getSession returns error", async () => {
      vi.mocked(UserPool.getCurrentUser).mockReturnValueOnce({
        getSession: vi.fn((cb) => cb(new Error("Session error"), null)),
      } as any);
      const token = await getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns the current user on a successful response", async () => {
      const user = await getCurrentUser();
      expect(user.email).toBe("test@example.com");
      expect(user.userId).toBeDefined();
    });

    it("throws an error when the API returns 401", async () => {
      server.use(
        http.get("*/user", () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 },
          );
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
