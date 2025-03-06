/**
 * ドメインイベントの基底クラス
 * ドメイン内で発生した重要な出来事を表す
 */
export abstract class DomainEvent {
  readonly id: string;
  readonly timestamp: Date;
  
  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }
  
  /**
   * イベント名を返す
   * 継承先で実装する必要がある
   */
  abstract get eventName(): string;
} 