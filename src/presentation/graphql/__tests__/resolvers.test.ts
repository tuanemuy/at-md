/**
 * GraphQLリゾルバーのテスト
 * 
 * リゾルバーが正しく動作するかテストします。
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { resolvers } from "../resolvers/mod.ts";
import { mockQueryHandlers, mockCommandHandlers } from "./mocks/handlers.ts";

describe("GraphQLリゾルバーのテスト", () => {
  describe("Queryリゾルバーのテスト", () => {
    it("user クエリが正しく動作すること", async () => {
      const result = await resolvers.Query.user(
        null,
        { id: "user-1" },
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("user-1");
      expect(result?.username).toBe("testuser");
    });
    
    it("存在しないユーザーIDでnullを返すこと", async () => {
      const result = await resolvers.Query.user(
        null,
        { id: "non-existent" },
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeNull();
    });
    
    it("content クエリが正しく動作すること", async () => {
      const result = await resolvers.Query.content(
        null,
        { id: "content-1" },
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("content-1");
      expect(result?.title).toBe("Example Document");
    });
    
    it("feed クエリが正しく動作すること", async () => {
      const result = await resolvers.Query.feed(
        null,
        { id: "feed-1" },
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("feed-1");
      expect(result?.name).toBe("My Blog");
    });
    
    it("page クエリが正しく動作すること", async () => {
      const result = await resolvers.Query.page(
        null,
        { id: "page-1" },
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("page-1");
      expect(result?.title).toBe("About Me");
    });
  });
  
  describe("Mutationリゾルバーのテスト", () => {
    it("createUser ミューテーションが正しく動作すること", async () => {
      const input = {
        username: "newuser",
        email: "new@example.com",
      };
      
      const result = await resolvers.Mutation.createUser(
        null,
        { input },
        { commandHandlers: mockCommandHandlers }
      );
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe("newuser");
      expect(result.user?.email).toBe("new@example.com");
    });
    
    it("updateUser ミューテーションが正しく動作すること", async () => {
      const id = "user-1";
      const input = {
        username: "updateduser",
      };
      
      const result = await resolvers.Mutation.updateUser(
        null,
        { id, input },
        { commandHandlers: mockCommandHandlers }
      );
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe("user-1");
      expect(result.user?.username).toBe("updateduser");
    });
    
    it("createContent ミューテーションが正しく動作すること", async () => {
      const input = {
        userId: "user-1",
        repositoryId: "repo-1",
        path: "docs/new.md",
        title: "New Document",
        body: "# New\n\nThis is a new document.",
        visibility: "public",
      };
      
      const result = await resolvers.Mutation.createContent(
        null,
        { input },
        { commandHandlers: mockCommandHandlers }
      );
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content?.title).toBe("New Document");
    });
  });
  
  describe("型リゾルバーのテスト", () => {
    it("Content.user リゾルバーが正しく動作すること", async () => {
      const parent = {
        id: "content-1",
        userId: "user-1",
      };
      
      const result = await resolvers.Content.user(
        parent,
        {},
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("user-1");
      expect(result?.username).toBe("testuser");
    });
    
    it("Feed.posts リゾルバーが正しく動作すること", async () => {
      const parent = {
        id: "feed-1",
      };
      
      const result = await resolvers.Feed.posts(
        parent,
        {},
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.feedId).toBe("feed-1");
    });
    
    it("Page.content リゾルバーが正しく動作すること", async () => {
      const parent = {
        id: "page-1",
        contentId: "content-1",
      };
      
      const result = await resolvers.Page.content(
        parent,
        {},
        { queryHandlers: mockQueryHandlers }
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe("content-1");
    });
  });
}); 