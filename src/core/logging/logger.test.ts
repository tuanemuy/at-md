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
    
    let debugArgs: any[] = [];
    let infoArgs: any[] = [];
    let warnArgs: any[] = [];
    let errorArgs: any[] = [];
    
    console.debug = (...args: any[]) => { debugCalled = true; debugArgs = args; };
    console.info = (...args: any[]) => { infoCalled = true; infoArgs = args; };
    console.warn = (...args: any[]) => { warnCalled = true; warnArgs = args; };
    console.error = (...args: any[]) => { errorCalled = true; errorArgs = args; };
    
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
      
      expect(debugArgs[0]).toContain("[DEBUG]");
      expect(debugArgs[0]).toContain("[TestLogger]");
      expect(debugArgs[1]).toBe("デバッグメッセージ");
      
      expect(infoArgs[0]).toContain("[INFO]");
      expect(infoArgs[0]).toContain("[TestLogger]");
      expect(infoArgs[1]).toBe("情報メッセージ");
      
      expect(warnArgs[0]).toContain("[WARN]");
      expect(warnArgs[0]).toContain("[TestLogger]");
      expect(warnArgs[1]).toBe("警告メッセージ");
      
      expect(errorArgs[0]).toContain("[ERROR]");
      expect(errorArgs[0]).toContain("[TestLogger]");
      expect(errorArgs[1]).toBe("エラーメッセージ");
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
    
    let infoArgs: any[] = [];
    console.info = (...args: any[]) => { infoArgs = args; };
    
    try {
      // 操作
      const logger = new Logger("TestLogger");
      const context = { userId: "123", action: "login" };
      logger.info("ユーザーログイン", context);
      
      // アサーション
      expect(infoArgs.length).toBeGreaterThan(0);
      expect(infoArgs[0]).toContain("[INFO]");
      expect(infoArgs[0]).toContain("[TestLogger]");
      expect(infoArgs[1]).toBe("ユーザーログイン");
      expect(infoArgs[2]).toBe(context);
    } finally {
      // コンソールメソッドを元に戻す
      console.info = originalConsole.info;
    }
  });
}); 