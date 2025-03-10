import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Logger, LogLevel } from "./logger.ts";

describe("ロガー", () => {
  it("正しいレベルでメッセージを出力すること", () => {
    // 準備: コンソールメソッドをモック化
    const originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    let debugCalled = false;
    let infoCalled = false;
    let warnCalled = false;
    let errorCalled = false;
    
    let debugArgs: unknown[] = [];
    let infoArgs: unknown[] = [];
    let warnArgs: unknown[] = [];
    let errorArgs: unknown[] = [];
    
    console.debug = (...args: unknown[]) => { debugCalled = true; debugArgs = args; };
    console.info = (...args: unknown[]) => { infoCalled = true; infoArgs = args; };
    console.warn = (...args: unknown[]) => { warnCalled = true; warnArgs = args; };
    console.error = (...args: unknown[]) => { errorCalled = true; errorArgs = args; };
    
    try {
      // 操作
      const logger = new Logger("TestLogger");
      logger.debug("デバッグメッセージ");
      logger.info("情報メッセージ");
      logger.warn("警告メッセージ");
      logger.error("エラーメッセージ");
      
      // アサーション
      expect(debugCalled).toBe(true);
      expect(infoCalled).toBe(true);
      expect(warnCalled).toBe(true);
      expect(errorCalled).toBe(true);
      
      expect(debugArgs[0]).toContain("[TestLogger]");
      expect(debugArgs[0]).toContain("[DEBUG]");
      expect(debugArgs[0]).toContain("デバッグメッセージ");
      
      expect(infoArgs[0]).toContain("[TestLogger]");
      expect(infoArgs[0]).toContain("[INFO]");
      expect(infoArgs[0]).toContain("情報メッセージ");
      
      expect(warnArgs[0]).toContain("[TestLogger]");
      expect(warnArgs[0]).toContain("[WARN]");
      expect(warnArgs[0]).toContain("警告メッセージ");
      
      expect(errorArgs[0]).toContain("[TestLogger]");
      expect(errorArgs[0]).toContain("[ERROR]");
      expect(errorArgs[0]).toContain("エラーメッセージ");
    } finally {
      // コンソールメソッドを元に戻す
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });
  
  it("最小ログレベルが設定されている場合、それ以下のレベルのログが出力されないこと", () => {
    // 準備: コンソールメソッドをモック化
    const originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    let debugCalled = false;
    let infoCalled = false;
    let warnCalled = false;
    let errorCalled = false;
    
    console.debug = () => { debugCalled = true; };
    console.info = () => { infoCalled = true; };
    console.warn = () => { warnCalled = true; };
    console.error = () => { errorCalled = true; };
    
    try {
      // 操作: INFOレベル以上のみログを出力するロガー
      const logger = new Logger("TestLogger", LogLevel.INFO);
      logger.debug("デバッグメッセージ");
      logger.info("情報メッセージ");
      logger.warn("警告メッセージ");
      logger.error("エラーメッセージ");
      
      // アサーション
      expect(debugCalled).toBe(false); // DEBUGは出力されない
      expect(infoCalled).toBe(true);
      expect(warnCalled).toBe(true);
      expect(errorCalled).toBe(true);
    } finally {
      // コンソールメソッドを元に戻す
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });
  
  it("追加のコンテキスト情報が正しく出力されること", () => {
    // 準備: コンソールメソッドをモック化
    const originalConsole = {
      info: console.info
    };
    
    let infoArgs: unknown[] = [];
    console.info = (...args: unknown[]) => { infoArgs = args; };
    
    try {
      // 操作
      const logger = new Logger("TestLogger");
      const context = { userId: "123", action: "login" };
      logger.info("ユーザーログイン", context);
      
      // アサーション
      expect(infoArgs.length).toBeGreaterThan(0);
      expect(infoArgs[0]).toContain("[TestLogger]");
      expect(infoArgs[0]).toContain("[INFO]");
      expect(infoArgs[0]).toContain("ユーザーログイン");
      expect(infoArgs[1]).toBe(context);
    } finally {
      // コンソールメソッドを元に戻す
      console.info = originalConsole.info;
    }
  });

  it("デバッグレベルのログを出力できる", () => {
    // コンソール出力をモック化
    const originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    let debugCalled = false;
    let infoCalled = false;
    let warnCalled = false;
    let errorCalled = false;
    
    let debugArgs: unknown[] = [];
    let infoArgs: unknown[] = [];
    let warnArgs: unknown[] = [];
    let errorArgs: unknown[] = [];
    
    console.debug = (...args: unknown[]) => { debugCalled = true; debugArgs = args; };
    console.info = (...args: unknown[]) => { infoCalled = true; infoArgs = args; };
    console.warn = (...args: unknown[]) => { warnCalled = true; warnArgs = args; };
    console.error = (...args: unknown[]) => { errorCalled = true; errorArgs = args; };
    
    try {
      // 操作
      const logger = new Logger("TestLogger");
      logger.debug("デバッグメッセージ");
      
      // アサーション
      expect(debugCalled).toBe(true);
      expect(infoCalled).toBe(false);
      expect(warnCalled).toBe(false);
      expect(errorCalled).toBe(false);
      
      expect(debugArgs[0]).toContain("[TestLogger]");
      expect(debugArgs[0]).toContain("[DEBUG]");
      expect(debugArgs[0]).toContain("デバッグメッセージ");
    } finally {
      // コンソールメソッドを元に戻す
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });

  it("ログレベルに応じてログ出力を制御できる", () => {
    // コンソール出力をモック化
    const originalConsole = {
      info: console.info
    };
    
    let infoCalled = false;
    
    let infoArgs: unknown[] = [];
    console.info = (...args: unknown[]) => { infoCalled = true; infoArgs = args; };
    
    try {
      // 操作
      const logger = new Logger("TestLogger");
      logger.info("情報メッセージ");
      
      // アサーション
      expect(infoCalled).toBe(true);
      expect(infoArgs[0]).toContain("[TestLogger]");
      expect(infoArgs[0]).toContain("[INFO]");
      expect(infoArgs[0]).toContain("情報メッセージ");
    } finally {
      // コンソールメソッドを元に戻す
      console.info = originalConsole.info;
    }
  });
}); 