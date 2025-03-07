import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { IdGenerator, UUIDv4Generator, UUIDv7Generator, generateId } from "./id.ts";

describe("ID生成", () => {
  it("UUIDv4Generatorが有効なUUIDを生成すること", () => {
    const generator = new UUIDv4Generator();
    const id = generator.generate();
    
    // UUIDの形式を確認（正規表現）
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("UUIDv7Generatorが有効なUUIDを生成すること", () => {
    const generator = new UUIDv7Generator();
    const id = generator.generate();
    
    // UUIDの形式を確認（正規表現）
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("generateId関数が有効なUUIDを生成すること", () => {
    const id = generateId();
    
    // UUIDの形式を確認（正規表現）
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("異なる呼び出しで異なるIDが生成されること", () => {
    const generator = new UUIDv7Generator();
    const id1 = generator.generate();
    const id2 = generator.generate();
    
    expect(id1).not.toBe(id2);
  });

  it("カスタムジェネレータを実装できること", () => {
    // カスタムジェネレータの実装
    class CustomGenerator implements IdGenerator {
      private prefix: string;
      private counter: number;
      
      constructor(prefix: string = "custom", startCounter: number = 1) {
        this.prefix = prefix;
        this.counter = startCounter;
      }
      
      generate(): string {
        return `${this.prefix}-${this.counter++}`;
      }
    }
    
    const generator = new CustomGenerator("test");
    const id1 = generator.generate();
    const id2 = generator.generate();
    
    expect(id1).toBe("test-1");
    expect(id2).toBe("test-2");
  });
}); 