import { expect, test, describe } from "vitest";
import { ok, err, fromPromise, combine, combineAsync, type Result } from "../result";

describe("Result型のテスト", () => {
  test("Ok値を正しく生成して値を取得できること", () => {
    const result = ok(42);

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    
    // matchを使った値の取得
    const value = result.match<number>(
      (val: number) => val,
      () => -1
    );
    expect(value).toBe(42);
  });

  test("Err値を正しく生成してエラーを取得できること", () => {
    const error = new Error("エラーが発生しました");
    const result = err(error);

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    
    // matchを使ったエラーの取得
    const extractedError = result.match<Error | null>(
      () => null,
      (err: Error) => err
    );
    expect(extractedError).toBe(error);
  });

  test("map関数が成功時に値を変換すること", () => {
    const result = ok(42);
    const mapped = result.map((n: number) => n * 2);

    expect(mapped.isOk()).toBe(true);
    
    const value = mapped.match<number>(
      (val: number) => val,
      () => -1
    );
    expect(value).toBe(84);
  });

  test("mapErr関数がエラー時にエラーを変換すること", () => {
    const result = err("元のエラー");
    const mapped = result.mapErr((e: string) => `変換後: ${e}`);

    expect(mapped.isErr()).toBe(true);
    
    const error = mapped.match<string | null>(
      () => null,
      (err: string) => err
    );
    expect(error).toBe("変換後: 元のエラー");
  });

  test("andThen関数が成功時に次の処理を実行すること", () => {
    const result = ok(42);
    const chained = result.andThen((n: number) => ok(n * 2));

    expect(chained.isOk()).toBe(true);
    
    const value = chained.match<number>(
      (val: number) => val,
      () => -1
    );
    expect(value).toBe(84);
  });

  test("andThen関数がエラー時に次の処理を実行しないこと", () => {
    const error = new Error("エラー");
    // 型引数の順序を修正: err<E, T>
    const result: Result<number, Error> = err(error);
    const chained = result.andThen((n: number) => ok(n * 2));

    expect(chained.isErr()).toBe(true);
    
    const errorMessage = chained.match<string | null>(
      () => null,
      (e: Error) => e.message
    );
    expect(errorMessage).toBe("エラー");
  });

  test("fromPromiseが成功したPromiseからOk値を生成すること", async () => {
    const promise = Promise.resolve(42);
    const result = await fromPromise(promise, (e: unknown) => new Error(String(e)));

    expect(result.isOk()).toBe(true);
    
    const value = result.match<number>(
      (val: number) => val,
      () => -1
    );
    expect(value).toBe(42);
  });

  test("fromPromiseが失敗したPromiseからErr値を生成すること", async () => {
    const promise = Promise.reject("エラーが発生しました");
    const result = await fromPromise(promise, (e: unknown) => `変換後: ${e}`);

    expect(result.isErr()).toBe(true);
    
    const error = result.match<string | null>(
      () => null,
      (err: string) => err
    );
    expect(error).toBe("変換後: エラーが発生しました");
  });

  test("combineがすべて成功の場合に成功の配列を返すこと", () => {
    const results = [ok(1), ok(2), ok(3)];
    const combined = combine(results);

    expect(combined.isOk()).toBe(true);
    
    const value = combined.match<number[]>(
      (val: number[]) => val,
      () => []
    );
    expect(value).toEqual([1, 2, 3]);
  });

  test("combineが1つでも失敗の場合にその失敗を返すこと", () => {
    const results = [ok(1), err("エラー2"), ok(3)];
    const combined = combine(results);

    expect(combined.isErr()).toBe(true);
    
    const error = combined.match<string | null>(
      () => null,
      (err: string) => err
    );
    expect(error).toBe("エラー2");
  });

  test("combineAsyncがすべて成功の場合に成功の配列を返すこと", async () => {
    const results = [
      fromPromise(Promise.resolve(1), (e: unknown) => String(e)),
      fromPromise(Promise.resolve(2), (e: unknown) => String(e)),
      fromPromise(Promise.resolve(3), (e: unknown) => String(e)),
    ];
    const combined = await combineAsync(results);

    expect(combined.isOk()).toBe(true);
    
    const value = combined.match<number[]>(
      (val: number[]) => val,
      () => []
    );
    expect(value).toEqual([1, 2, 3]);
  });

  test("combineAsyncが1つでも失敗の場合にその失敗を返すこと", async () => {
    const results = [
      fromPromise(Promise.resolve(1), (e: unknown) => String(e)),
      fromPromise(Promise.reject("エラー2"), (e: unknown) => String(e)),
      fromPromise(Promise.resolve(3), (e: unknown) => String(e)),
    ];
    const combined = await combineAsync(results);

    expect(combined.isErr()).toBe(true);
    
    const error = combined.match<string | null>(
      () => null,
      (err: string) => err
    );
    expect(error).toBe("エラー2");
  });
}); 