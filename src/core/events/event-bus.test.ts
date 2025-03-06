import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { DomainEvent } from "./domain-event.ts";
import { EventBus, EventHandler } from "./event-bus.ts";

// テスト用のイベントクラス
class TestEvent extends DomainEvent {
  constructor(readonly data: string) {
    super();
  }
  
  get eventName(): string {
    return "TestEvent";
  }
}

class AnotherTestEvent extends DomainEvent {
  constructor(readonly value: number) {
    super();
  }
  
  get eventName(): string {
    return "AnotherTestEvent";
  }
}

describe("イベントバス", () => {
  it("イベントを購読者に配信すること", async () => {
    // 準備
    const eventBus = new EventBus();
    const event = new TestEvent("test data");
    
    // モックハンドラーの作成
    let handlerCalled = false;
    let receivedEvent: TestEvent | null = null;
    
    const handler: EventHandler<TestEvent> = (e: TestEvent) => {
      handlerCalled = true;
      receivedEvent = e;
    };
    
    // イベントの購読
    eventBus.subscribe<TestEvent>("TestEvent", handler);
    
    // 操作: イベントの発行
    await eventBus.publish(event);
    
    // アサーション
    expect(handlerCalled).toBe(true);
    expect(receivedEvent).toBe(event);
  });
  
  it("購読解除したハンドラーがイベントを受け取らないこと", async () => {
    // 準備
    const eventBus = new EventBus();
    const event = new TestEvent("test data");
    
    // モックハンドラーの作成
    let handlerCalled = false;
    
    const handler: EventHandler<TestEvent> = () => {
      handlerCalled = true;
    };
    
    // イベントの購読と購読解除
    eventBus.subscribe<TestEvent>("TestEvent", handler);
    eventBus.unsubscribe("TestEvent", handler);
    
    // 操作: イベントの発行
    await eventBus.publish(event);
    
    // アサーション
    expect(handlerCalled).toBe(false);
  });
  
  it("複数のハンドラーが同じイベントを受け取れること", async () => {
    // 準備
    const eventBus = new EventBus();
    const event = new TestEvent("test data");
    
    // モックハンドラーの作成
    let handler1Called = false;
    let handler2Called = false;
    
    const handler1: EventHandler<TestEvent> = () => {
      handler1Called = true;
    };
    
    const handler2: EventHandler<TestEvent> = () => {
      handler2Called = true;
    };
    
    // イベントの購読
    eventBus.subscribe<TestEvent>("TestEvent", handler1);
    eventBus.subscribe<TestEvent>("TestEvent", handler2);
    
    // 操作: イベントの発行
    await eventBus.publish(event);
    
    // アサーション
    expect(handler1Called).toBe(true);
    expect(handler2Called).toBe(true);
  });
  
  it("ハンドラーが例外を投げても他のハンドラーが実行されること", async () => {
    // 準備
    const eventBus = new EventBus();
    const event = new TestEvent("test data");
    
    // モックハンドラーの作成
    let handler1Called = false;
    let handler2Called = false;
    
    const handler1: EventHandler<TestEvent> = () => {
      handler1Called = true;
      throw new Error("Handler error");
    };
    
    const handler2: EventHandler<TestEvent> = () => {
      handler2Called = true;
    };
    
    // コンソールエラーをモック化して、テスト出力をクリーンに保つ
    const originalConsoleError = console.error;
    console.error = () => {};
    
    try {
      // イベントの購読
      eventBus.subscribe<TestEvent>("TestEvent", handler1);
      eventBus.subscribe<TestEvent>("TestEvent", handler2);
      
      // 操作: イベントの発行
      await eventBus.publish(event);
      
      // アサーション
      expect(handler1Called).toBe(true);
      expect(handler2Called).toBe(true);
    } finally {
      // コンソールエラーを元に戻す
      console.error = originalConsoleError;
    }
  });
  
  it("異なるイベントタイプのハンドラーが適切に呼び出されること", async () => {
    // 準備
    const eventBus = new EventBus();
    const testEvent = new TestEvent("test data");
    const anotherEvent = new AnotherTestEvent(42);
    
    // モックハンドラーの作成
    let testHandlerCalled = false;
    let anotherHandlerCalled = false;
    
    const testHandler: EventHandler<TestEvent> = () => {
      testHandlerCalled = true;
    };
    
    const anotherHandler: EventHandler<AnotherTestEvent> = () => {
      anotherHandlerCalled = true;
    };
    
    // イベントの購読
    eventBus.subscribe<TestEvent>("TestEvent", testHandler);
    eventBus.subscribe<AnotherTestEvent>("AnotherTestEvent", anotherHandler);
    
    // 操作: 最初のイベントの発行
    await eventBus.publish(testEvent);
    
    // アサーション
    expect(testHandlerCalled).toBe(true);
    expect(anotherHandlerCalled).toBe(false);
    
    // リセット
    testHandlerCalled = false;
    
    // 操作: 2番目のイベントの発行
    await eventBus.publish(anotherEvent);
    
    // アサーション
    expect(testHandlerCalled).toBe(false);
    expect(anotherHandlerCalled).toBe(true);
  });
}); 