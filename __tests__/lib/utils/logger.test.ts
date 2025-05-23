import { logger, LogLevel, configureLogger } from "@/lib/utils/logger";

describe("Logger", () => {
  let consoleSpy: {
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      info: jest.spyOn(console, "info").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
      debug: jest.spyOn(console, "debug").mockImplementation(),
    };

    // Reset logger configuration
    configureLogger({
      minLevel: LogLevel.DEBUG,
      colorize: false,
      includeTimestamps: false,
    });
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe("log levels", () => {
    it("logs debug messages", () => {
      logger.debug("Debug message");
      expect(consoleSpy.debug).toHaveBeenCalledWith("[DEBUG] Debug message");
    });

    it("logs info messages", () => {
      logger.info("Info message");
      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Info message");
    });

    it("logs warn messages", () => {
      logger.warn("Warning message");
      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] Warning message");
    });

    it("logs error messages", () => {
      logger.error("Error message");
      expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] Error message");
    });
  });

  describe("log level filtering", () => {
    it("filters out debug messages when level is INFO", () => {
      configureLogger({ minLevel: LogLevel.INFO });

      logger.debug("Debug message");
      logger.info("Info message");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Info message");
    });

    it("filters out info and debug when level is WARN", () => {
      configureLogger({ minLevel: LogLevel.WARN });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] Warning message");
    });

    it("only logs errors when level is ERROR", () => {
      configureLogger({ minLevel: LogLevel.ERROR });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] Error message");
    });
  });

  describe("timestamps", () => {
    it("includes timestamp when enabled", () => {
      configureLogger({ includeTimestamps: true });

      logger.info("Test message");

      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).toMatch(
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message/,
      );
    });

    it("excludes timestamp when disabled", () => {
      configureLogger({ includeTimestamps: false });

      logger.info("Test message");

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Test message");
    });
  });

  describe("multiple arguments", () => {
    it("logs multiple arguments", () => {
      const obj = { key: "value" };
      const arr = [1, 2, 3];

      logger.info("Message", "", obj, arr);

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Message", obj, arr);
    });
  });

  describe("error objects", () => {
    it("logs error objects with stack trace", () => {
      const error = new Error("Test error");

      logger.error("Error occurred:", "", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Error occurred:",
        error,
      );
    });
  });

  describe("configuration", () => {
    it("can be disabled completely", () => {
      configureLogger({ enabled: false });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("can add custom prefix", () => {
      configureLogger({
        prefix: "MyApp",
        includeTimestamps: false,
        colorize: false,
        minLevel: LogLevel.DEBUG,
        enabled: true,
      });

      logger.info("Test message", "");

      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledWith(
        "[INFO] [MyApp] Test message",
      );
    });
  });
});
