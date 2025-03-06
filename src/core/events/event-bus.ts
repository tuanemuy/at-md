import { DomainEvent } from "./domain-event.ts";

/**
 * イベントハンドラーの型定義
 */
export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * イベントバス
 * ドメインイベントの発行と購読を管理する
 */
export class EventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();
  
  /**
   * イベントを購読する
   * @param eventName イベント名
   * @param handler イベントハンドラー
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    // 型キャストが必要
    this.handlers.get(eventName)!.push(handler as unknown as EventHandler<DomainEvent>);
  }
  
  /**
   * イベントの購読を解除する
   * @param eventName イベント名
   * @param handler イベントハンドラー
   */
  unsubscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      return;
    }
    
    const handlers = this.handlers.get(eventName)!;
    const index = handlers.findIndex(h => h === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * イベントを発行する
   * @param event ドメインイベント
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.eventName;
    const handlers = this.handlers.get(eventName) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventName}:`, error);
      }
    }
  }
} 