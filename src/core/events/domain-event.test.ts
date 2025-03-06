import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { DomainEvent } from "./domain-event.ts";

// テスト用のドメインイベントクラス
class TestEvent extends DomainEvent {
  constructor(readonly data: string) {
    super();
  }
  
  get eventName(): string {
    return "TestEvent";
  }
}

describe("ドメインイベント", () => {
  it("正しく作成されること", () => {
    // 期待する結果
    const eventData = "test data";
    const eventName = "TestEvent";
    
    // 操作
    const event = new TestEvent(eventData);
    
    // アサーション
    // 抽象クラスのインスタンスチェックはできないため、プロトタイプチェーンで確認
    expect(Object.getPrototypeOf(Object.getPrototypeOf(event)).constructor.name).toBe("DomainEvent");
    expect(event.eventName).toBe(eventName);
    expect(event.data).toBe(eventData);
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.id).toBeDefined();
  });
  
  it("異なるドメインイベントは異なるIDを持つこと", () => {
    // 操作
    const event1 = new TestEvent("data1");
    const event2 = new TestEvent("data2");
    
    // アサーション
    expect(event1.id).not.toBe(event2.id);
  });
}); 