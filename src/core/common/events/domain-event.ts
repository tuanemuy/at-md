/**
 * ドメインイベントモジュール
 * 
 * このモジュールは、ドメインイベントの基盤を提供します。
 * ドメインイベントは、ドメインモデル内の重要な変更を通知するために使用されます。
 */

/**
 * ドメインイベントの基底インターフェース
 * すべてのドメインイベントが実装する必要があるインターフェース
 */
export interface DomainEvent {
  /** イベントの種類を示す一意の識別子 */
  readonly eventType: string;
  
  /** イベントが発生した日時 */
  readonly occurredAt: Date;
}

/**
 * イベントバス
 * ドメインイベントの発行と購読を管理するシングルトンクラス
 */
export class EventBus {
  /** シングルトンインスタンス */
  private static instance: EventBus;
  
  /** イベントタイプごとのリスナーを管理するマップ */
  private listeners: Map<string, ((event: DomainEvent) => void)[]> = new Map();
  
  /** プライベートコンストラクタ（シングルトンパターン） */
  private constructor() {}
  
  /**
   * イベントバスのインスタンスを取得する
   * @returns EventBusのシングルトンインスタンス
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * イベントタイプに対するリスナーを登録する
   * @param eventType 購読するイベントタイプ
   * @param listener イベント発生時に呼び出されるリスナー関数
   */
  subscribe(eventType: string, listener: (event: DomainEvent) => void): void {
    const eventListeners = this.listeners.get(eventType) || [];
    eventListeners.push(listener);
    this.listeners.set(eventType, eventListeners);
  }
  
  /**
   * イベントを発行する
   * 登録されたすべてのリスナーに通知する
   * @param event 発行するドメインイベント
   */
  publish(event: DomainEvent): void {
    const eventListeners = this.listeners.get(event.eventType) || [];
    for (const listener of eventListeners) {
      listener(event);
    }
  }
  
  /**
   * イベントタイプに対するリスナーを解除する
   * @param eventType 解除するイベントタイプ
   * @param listener 解除するリスナー関数（省略時は全てのリスナーを解除）
   */
  unsubscribe(eventType: string, listener?: (event: DomainEvent) => void): void {
    if (!listener) {
      // リスナーが指定されていない場合は、そのイベントタイプのすべてのリスナーを解除
      this.listeners.delete(eventType);
      return;
    }
    
    const eventListeners = this.listeners.get(eventType) || [];
    const filteredListeners = eventListeners.filter(l => l !== listener);
    
    if (filteredListeners.length === 0) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.set(eventType, filteredListeners);
    }
  }
  
  /**
   * すべてのリスナーを解除する
   * 主にテスト用途で使用
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
} 