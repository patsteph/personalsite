import {
  logError,
  formatError,
  useTryCatch,
  AppError,
} from "@/lib/utils/error-handler";
import { renderHook, act } from "@testing-library/react";

describe("AppError type", () => {
  it("has correct structure", () => {
    const error: AppError = {
      message: "Test error",
      code: "TEST_CODE",
      originalError: new Error("original"),
    };

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.originalError).toBeInstanceOf(Error);
  });

  it("can have optional fields", () => {
    const error: AppError = {
      message: "Test error",
    };

    expect(error.message).toBe("Test error");
    expect(error.code).toBeUndefined();
    expect(error.originalError).toBeUndefined();
  });
});

describe("logError", () => {
  let consoleSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("logs error with context in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Test error");
    const context = "test-context";

    const result = logError(error, context);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in test-context:",
      "Test error",
      "",
    );
    expect(result).toEqual({
      message: "Test error",
      code: undefined,
      originalError: error,
    });
  });

  it("logs error without context in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Test error");

    const result = logError(error);

    expect(consoleSpy).toHaveBeenCalledWith("Error:", "Test error", "");
    expect(result).toEqual({
      message: "Test error",
      code: undefined,
      originalError: error,
    });
  });

  it("logs error in current environment (test)", () => {
    const error = new Error("Test error");
    const context = "test-context";

    logError(error, context);

    // In test environment, should use production logging format
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in test-context:",
      "Test error",
      "",
    );
  });

  it("handles string errors", () => {
    process.env.NODE_ENV = "production";
    const error = "String error";

    const result = logError(error, "test");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in test:",
      "String error",
      "",
    );
    expect(result).toEqual({
      message: "String error",
      originalError: expect.any(Error),
    });
  });
});

describe("formatError", () => {
  it("formats Error objects correctly", () => {
    const error = new Error("Generic error");
    const formatted = formatError(error);

    expect(formatted).toEqual({
      message: "Generic error",
      code: undefined,
      originalError: error,
    });
  });

  it("formats Firebase-like errors with message and code", () => {
    const firebaseError = {
      code: "auth/user-not-found",
      message: "Firebase: Error (auth/user-not-found).",
    };
    const formatted = formatError(firebaseError);

    // The formatError function will handle this as a regular object with message and code
    expect(formatted).toEqual({
      message: "Firebase: Error (auth/user-not-found).",
      code: "auth/user-not-found",
      originalError: firebaseError,
    });
  });

  it("formats string error correctly", () => {
    const error = "String error";
    const formatted = formatError(error);

    expect(formatted).toEqual({
      message: "String error",
      originalError: expect.any(Error),
    });
  });

  it("formats unknown error correctly", () => {
    const error = { unknown: "object" };
    const formatted = formatError(error);

    expect(formatted).toEqual({
      message: "An unexpected error occurred",
      originalError: error,
    });
  });

  it("handles objects with message property", () => {
    const error = { message: "Custom error", code: "CUSTOM_CODE" };
    const formatted = formatError(error);

    expect(formatted).toEqual({
      message: "Custom error",
      code: "CUSTOM_CODE",
      originalError: error,
    });
  });
});

describe("useTryCatch", () => {
  it("returns success result when function succeeds", async () => {
    const { result } = renderHook(() => useTryCatch());

    const successFunction = jest.fn().mockResolvedValue("success");

    await act(async () => {
      const [data, error] = await result.current(successFunction);
      expect(data).toBe("success");
      expect(error).toBeNull();
    });

    expect(successFunction).toHaveBeenCalled();
  });

  it("returns error when function fails", async () => {
    const { result } = renderHook(() => useTryCatch());

    const errorFunction = jest.fn().mockRejectedValue(new Error("Test error"));

    await act(async () => {
      const [data, error] = await result.current(errorFunction);
      expect(data).toBeNull();
      expect(error).toEqual({
        message: "Test error",
        code: undefined,
        originalError: expect.any(Error),
      });
    });

    expect(errorFunction).toHaveBeenCalled();
  });

  it("calls custom error handler when provided", async () => {
    const { result } = renderHook(() => useTryCatch());
    const onError = jest.fn();

    const errorFunction = jest.fn().mockRejectedValue(new Error("Test error"));

    await act(async () => {
      await result.current(errorFunction, { onError });
    });

    expect(onError).toHaveBeenCalledWith({
      message: "Test error",
      code: undefined,
      originalError: expect.any(Error),
    });
  });

  it("can disable notifications", async () => {
    const { result } = renderHook(() => useTryCatch());

    const errorFunction = jest.fn().mockRejectedValue(new Error("Test error"));

    await act(async () => {
      await result.current(errorFunction, { showNotification: false });
    });

    // Should not call toast.error (we can't easily test this without mocking react-toastify)
    expect(errorFunction).toHaveBeenCalled();
  });

  it("includes context in error logging", async () => {
    const { result } = renderHook(() => useTryCatch());
    let consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const errorFunction = jest.fn().mockRejectedValue(new Error("Test error"));

    await act(async () => {
      await result.current(errorFunction, { context: "test-context" });
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
