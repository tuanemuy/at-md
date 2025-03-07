import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createPublishStatus, PublishStatusType } from "./publish-status.ts";

describe("PublishStatus値オブジェクト", () => {
  it("下書き状態を作成できること", () => {
    const status = createPublishStatus({
      type: "draft"
    });
    
    expect(status.type).toBe("draft");
    expect(status.scheduledAt).toBeUndefined();
    expect(status.publishedAt).toBeUndefined();
    expect(status.archivedAt).toBeUndefined();
  });
  
  it("公開予定状態を作成できること", () => {
    const scheduledAt = new Date("2023-01-01T12:00:00Z");
    const status = createPublishStatus({
      type: "scheduled",
      scheduledAt
    });
    
    expect(status.type).toBe("scheduled");
    expect(status.scheduledAt).toEqual(scheduledAt);
    expect(status.publishedAt).toBeUndefined();
    expect(status.archivedAt).toBeUndefined();
  });
  
  it("公開済み状態を作成できること", () => {
    const publishedAt = new Date("2023-01-01T12:00:00Z");
    const status = createPublishStatus({
      type: "published",
      publishedAt
    });
    
    expect(status.type).toBe("published");
    expect(status.scheduledAt).toBeUndefined();
    expect(status.publishedAt).toEqual(publishedAt);
    expect(status.archivedAt).toBeUndefined();
  });
  
  it("アーカイブ済み状態を作成できること", () => {
    const archivedAt = new Date("2023-01-01T12:00:00Z");
    const status = createPublishStatus({
      type: "archived",
      archivedAt
    });
    
    expect(status.type).toBe("archived");
    expect(status.scheduledAt).toBeUndefined();
    expect(status.publishedAt).toBeUndefined();
    expect(status.archivedAt).toEqual(archivedAt);
  });
  
  it("公開状態の種類が指定されていない場合はエラーになること", () => {
    expect(() => {
      createPublishStatus({
        type: "" as PublishStatusType
      });
    }).toThrow();
  });
  
  it("無効な公開状態の場合はエラーになること", () => {
    expect(() => {
      createPublishStatus({
        type: "invalid" as PublishStatusType
      });
    }).toThrow();
  });
  
  it("公開予定の場合に公開予定日時が指定されていない場合はエラーになること", () => {
    expect(() => {
      createPublishStatus({
        type: "scheduled"
      });
    }).toThrow();
  });
  
  it("公開済みの場合に公開日時が指定されていない場合はエラーになること", () => {
    expect(() => {
      createPublishStatus({
        type: "published"
      });
    }).toThrow();
  });
  
  it("アーカイブ済みの場合にアーカイブ日時が指定されていない場合はエラーになること", () => {
    expect(() => {
      createPublishStatus({
        type: "archived"
      });
    }).toThrow();
  });
  
  it("オブジェクトが不変であること", () => {
    const status = createPublishStatus({
      type: "draft"
    });
    
    expect(() => {
      (status as any).type = "published";
    }).toThrow();
  });
}); 