import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { ObsidianError } from "../obsidian-adapter.ts";
import { InfrastructureError } from "../../../../core/errors/base.ts";

Deno.test("ObsidianError", async (t) => {
  await t.step("should create an instance with a message", () => {
    const error = new ObsidianError("テストエラー");
    
    assertInstanceOf(error, ObsidianError);
    assertInstanceOf(error, InfrastructureError);
    assertEquals(error.name, "ObsidianError");
    assertEquals(error.message, "テストエラー");
    assertEquals(error.cause, undefined);
  });
  
  await t.step("should create an instance with a message and cause", () => {
    const cause = new Error("原因エラー");
    const error = new ObsidianError("テストエラー", cause);
    
    assertInstanceOf(error, ObsidianError);
    assertInstanceOf(error, InfrastructureError);
    assertEquals(error.name, "ObsidianError");
    assertEquals(error.message, "テストエラー");
    assertEquals(error.cause, cause);
  });
});