import { expect, test } from "vitest";
import { Logger, logger } from "../logger";

test("Loggerインスタンスを2回取得するとき、同じインスタンスが返されること", () => {
  const instance1 = logger;
  const instance2 = Logger.getInstance();

  expect(instance1).toBe(instance2);
});

test("Loggerインスタンスがすべてのログレベルのメソッドを持つこと", () => {
  expect(typeof logger.error).toBe("function");
  expect(typeof logger.warn).toBe("function");
  expect(typeof logger.info).toBe("function");
  expect(typeof logger.debug).toBe("function");
  expect(typeof logger.log).toBe("function");
});
