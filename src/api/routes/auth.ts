import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { HonoEnv } from "../app";
import { handleError } from "../error";
import { auth } from "../middleware/auth";
import { connectGitHubRequestSchema } from "../schema/auth";

export const authRoutes = new Hono<HonoEnv>()
  .get("/client-metadata.json", (c) => {
    return c.json(c.var.container.accountService.getClientMetadata());
  })

  .get("/callback", (c) =>
    c.var.container.accountService
      .handleBlueskyAuthCallback({
        params: new URLSearchParams(c.req.url.split("?")[1]),
        context: { req: c.req.raw, res: c.res },
      })
      .match(
        (user) => c.redirect(`/${user.handle}`),
        (error) => handleError(error, c),
      ),
  )

  .get("/github/callback", auth)
  .get(
    "/github/callback",
    zValidator("query", connectGitHubRequestSchema),
    async (c) => {
      const connection = await c.var.container.accountService.connectGitHub({
        userId: c.get("user")?.id || "unreachable",
        code: c.req.valid("query").code,
        state: c.req.valid("query").state,
        context: { req: c.req.raw, res: c.res },
      });

      const user = await c.var.container.accountService
        .getUserById({
          userId: c.get("user")?.id || "unreachable",
        })
        .unwrapOr(null);

      if (connection.isErr()) {
        return c.redirect(`/${user?.handle || ""}?error=github-callback`);
      }

      return c.redirect(`/${user?.handle || ""}`);
    },
  );
