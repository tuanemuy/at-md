import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../app";
import { HTTPExceptionCode } from "../error";

export const auth = createMiddleware<HonoEnv>(
  async (c: Context<HonoEnv>, next: Next) => {
    if (!c.get("user")) {
      throw new HTTPException(HTTPExceptionCode.BAD_REQUEST, {
        message: "Session not found",
      });
    }
    await next();
  },
);
