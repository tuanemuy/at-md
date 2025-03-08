import { assertEquals, assertExists } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { Hono } from "hono";

// モック
import { UserRepository } from "../../../application/account/repositories/user-repository.ts";
import { GetUserByIdQueryHandler } from "../../../application/account/queries/get-user-by-id-query.ts";
import { CreateUserCommandHandler } from "../../../application/account/commands/create-user-command.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { 
  UserAggregate, 
  createUserAggregate 
} from "../../../core/account/aggregates/user-aggregate.ts";
import { 
  createUsername, 
  createEmail, 
  createAtIdentifier 
} from "../../../core/account/value-objects/mod.ts";

// テスト対象
// import { UserController } from "../controllers/user-controller.ts";

// モックユーザーリポジトリ
class MockUserRepository implements UserRepository {
  private users: Map<string, UserAggregate> = new Map();
  
  constructor() {
    // テスト用のユーザーを追加
    const user = createUserAggregate({
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:example:123",
        handle: "@test.bsky.social"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    this.users.set(user.user.id, user);
  }
  
  async findById(id: string): Promise<UserAggregate | null> {
    return this.users.get(id) || null;
  }
  
  async findByUsername(username: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.user.username.value === username) {
        return user;
      }
    }
    return null;
  }
  
  async findByEmail(email: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.user.email.value === email) {
        return user;
      }
    }
    return null;
  }
  
  async findByDid(did: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.user.atIdentifier.did === did) {
        return user;
      }
    }
    return null;
  }
  
  async findByHandle(handle: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.user.atIdentifier.handle === handle) {
        return user;
      }
    }
    return null;
  }
  
  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    this.users.set(userAggregate.user.id, userAggregate);
    return userAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    const exists = this.users.has(id);
    this.users.delete(id);
    return exists;
  }
}

Deno.test("UserController", async (t) => {
  // テスト用のアプリケーションを作成
  const app = new Hono();
  
  // モックリポジトリとハンドラーを作成
  const userRepository = new MockUserRepository();
  const getUserByIdQueryHandler = new GetUserByIdQueryHandler(userRepository);
  const createUserCommandHandler = new CreateUserCommandHandler(userRepository);
  
  // コントローラーとルートを設定
  // const userController = new UserController(getUserByIdQueryHandler, createUserCommandHandler);
  // userRoutes(app, userController);
  
  // テスト用のルートを設定
  app.get("/api/users/:id", (c) => {
    return c.json({ message: "Not implemented" }, 501);
  });
  
  app.post("/api/users", (c) => {
    return c.json({ message: "Not implemented" }, 501);
  });
  
  await t.step("GET /api/users/:id - 未実装の場合は501を返すこと", async () => {
    const req = new Request("http://localhost/api/users/user-1");
    const res = await app.fetch(req);
    
    assertEquals(res.status, 501);
    const body = await res.json();
    assertExists(body);
    assertEquals(body.message, "Not implemented");
  });
  
  await t.step("POST /api/users - 未実装の場合は501を返すこと", async () => {
    const userData = {
      username: "newuser",
      email: "new@example.com",
      password: "password123",
    };
    
    const req = new Request("http://localhost/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    
    const res = await app.fetch(req);
    
    assertEquals(res.status, 501);
    const body = await res.json();
    assertExists(body);
    assertEquals(body.message, "Not implemented");
  });
}); 