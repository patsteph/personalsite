import {
  clientCookies,
  serverCookies,
  parseCookieFromString,
  hasCookieInString,
  setAuthCookie,
  removeAuthCookie,
  hasAuthCookie,
  setFirebaseTokenCookie,
  getFirebaseTokenCookie,
  removeFirebaseTokenCookie,
  AUTH_COOKIE_NAME,
  FB_TOKEN_COOKIE_NAME,
  DEFAULT_EXPIRY_DAYS,
} from "@/lib/utils/cookies";

// Mock js-cookie
jest.mock("js-cookie", () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

import Cookies from "js-cookie";

describe("Cookie Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid test noise
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("clientCookies", () => {
    describe("set", () => {
      it("sets cookie with default options", () => {
        clientCookies.set("test-cookie", "test-value");

        expect(Cookies.set).toHaveBeenCalledWith("test-cookie", "test-value", {
          path: "/",
          secure: false, // NODE_ENV is 'test' in Jest
          sameSite: "lax",
          expires: DEFAULT_EXPIRY_DAYS,
        });
      });

      it("sets cookie with custom options", () => {
        const customOptions = { httpOnly: true, expires: 1 };
        clientCookies.set("test-cookie", "test-value", customOptions);

        expect(Cookies.set).toHaveBeenCalledWith("test-cookie", "test-value", {
          path: "/",
          secure: false,
          sameSite: "lax",
          expires: 1,
          httpOnly: true,
        });
      });

      it("handles errors gracefully", () => {
        (Cookies.set as jest.Mock).mockImplementation(() => {
          throw new Error("Cookie error");
        });

        expect(() => clientCookies.set("test", "value")).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          "Error setting cookie 'test':",
          expect.any(Error),
        );
      });
    });

    describe("get", () => {
      it("gets cookie value", () => {
        (Cookies.get as jest.Mock).mockReturnValue("test-value");

        const result = clientCookies.get("test-cookie");

        expect(Cookies.get).toHaveBeenCalledWith("test-cookie");
        expect(result).toBe("test-value");
      });

      it("returns undefined for non-existent cookie", () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);

        const result = clientCookies.get("non-existent");

        expect(result).toBeUndefined();
      });

      it("handles errors gracefully", () => {
        (Cookies.get as jest.Mock).mockImplementation(() => {
          throw new Error("Cookie error");
        });

        const result = clientCookies.get("test");

        expect(result).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Error getting cookie 'test':",
          expect.any(Error),
        );
      });
    });

    describe("remove", () => {
      it("removes cookie with default options", () => {
        clientCookies.remove("test-cookie");

        expect(Cookies.remove).toHaveBeenCalledWith("test-cookie", {
          path: "/",
        });
      });

      it("removes cookie with custom options", () => {
        const customOptions = { domain: ".example.com" };
        clientCookies.remove("test-cookie", customOptions);

        expect(Cookies.remove).toHaveBeenCalledWith("test-cookie", {
          path: "/",
          domain: ".example.com",
        });
      });

      it("handles errors gracefully", () => {
        (Cookies.remove as jest.Mock).mockImplementation(() => {
          throw new Error("Cookie error");
        });

        expect(() => clientCookies.remove("test")).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          "Error removing cookie 'test':",
          expect.any(Error),
        );
      });
    });

    describe("exists", () => {
      it("returns true when cookie exists", () => {
        (Cookies.get as jest.Mock).mockReturnValue("some-value");

        const result = clientCookies.exists("test-cookie");

        expect(result).toBe(true);
      });

      it("returns false when cookie does not exist", () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);

        const result = clientCookies.exists("test-cookie");

        expect(result).toBe(false);
      });
    });
  });

  describe("serverCookies", () => {
    describe("serialize", () => {
      it("serializes cookie with default options", () => {
        const result = serverCookies.serialize("test-cookie", "test-value");

        expect(result).toContain("test-cookie=test-value");
        expect(result).toContain("Path=/");
        expect(result).toContain("HttpOnly");
        expect(result).toContain("SameSite=Lax");
      });

      it("serializes cookie with custom options", () => {
        const customOptions = { httpOnly: false, secure: true };
        const result = serverCookies.serialize(
          "test-cookie",
          "test-value",
          customOptions,
        );

        expect(result).toContain("test-cookie=test-value");
        expect(result).toContain("Secure");
        expect(result).not.toContain("HttpOnly");
      });
    });

    describe("clear", () => {
      it("creates clear cookie instruction", () => {
        const result = serverCookies.clear("test-cookie");

        expect(result).toContain("test-cookie=");
        expect(result).toContain("Max-Age=0");
        expect(result).toContain("Expires=Thu, 01 Jan 1970");
      });
    });
  });

  describe("parseCookieFromString", () => {
    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "name=value; test=123; auth=token",
    });

    it("parses cookie from document.cookie", () => {
      const result = parseCookieFromString("name");
      expect(result).toBe("value");
    });

    it("returns undefined for non-existent cookie", () => {
      const result = parseCookieFromString("nonexistent");
      expect(result).toBeUndefined();
    });

    it("returns undefined on server-side", () => {
      const originalDocument = global.document;
      delete (global as any).document;

      const result = parseCookieFromString("name");
      expect(result).toBeUndefined();

      global.document = originalDocument;
    });
  });

  describe("hasCookieInString", () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "name=value; test=123; auth=token",
    });

    it("returns true when cookie exists", () => {
      const result = hasCookieInString("name");
      expect(result).toBe(true);
    });

    it("returns false when cookie does not exist", () => {
      const result = hasCookieInString("nonexistent");
      expect(result).toBe(false);
    });

    it("returns false on server-side", () => {
      const originalDocument = global.document;
      delete (global as any).document;

      const result = hasCookieInString("name");
      expect(result).toBe(false);

      global.document = originalDocument;
    });
  });

  describe("Auth cookie helpers", () => {
    describe("setAuthCookie", () => {
      it("sets auth cookie with default value", () => {
        setAuthCookie();

        expect(Cookies.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          "true",
          expect.any(Object),
        );
      });

      it("sets auth cookie with custom value", () => {
        setAuthCookie("custom-value");

        expect(Cookies.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          "custom-value",
          expect.any(Object),
        );
      });
    });

    describe("removeAuthCookie", () => {
      it("removes auth cookie", () => {
        removeAuthCookie();

        expect(Cookies.remove).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          expect.any(Object),
        );
      });
    });

    describe("hasAuthCookie", () => {
      it("returns true when auth cookie exists", () => {
        (Cookies.get as jest.Mock).mockReturnValue("true");

        const result = hasAuthCookie();

        expect(result).toBe(true);
      });

      it("returns false when auth cookie does not exist", () => {
        (Cookies.get as jest.Mock).mockReturnValue(undefined);

        const result = hasAuthCookie();

        expect(result).toBe(false);
      });
    });
  });

  describe("Firebase token cookie helpers", () => {
    describe("setFirebaseTokenCookie", () => {
      it("sets Firebase token cookie", () => {
        setFirebaseTokenCookie("firebase-token-123");

        expect(Cookies.set).toHaveBeenCalledWith(
          FB_TOKEN_COOKIE_NAME,
          "firebase-token-123",
          expect.any(Object),
        );
      });
    });

    describe("getFirebaseTokenCookie", () => {
      it("gets Firebase token cookie", () => {
        (Cookies.get as jest.Mock).mockReturnValue("firebase-token-123");

        const result = getFirebaseTokenCookie();

        expect(Cookies.get).toHaveBeenCalledWith(FB_TOKEN_COOKIE_NAME);
        expect(result).toBe("firebase-token-123");
      });
    });

    describe("removeFirebaseTokenCookie", () => {
      it("removes Firebase token cookie", () => {
        removeFirebaseTokenCookie();

        expect(Cookies.remove).toHaveBeenCalledWith(
          FB_TOKEN_COOKIE_NAME,
          expect.any(Object),
        );
      });
    });
  });
});
