import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "../app";
import { handleError, handleZodError } from "../error";
import { githubWebhookRequestSchema } from "../schema/book";

export const bookRoutes = new Hono<HonoEnv>().post(
  "/github/webhook",
  zValidator("json", githubWebhookRequestSchema, handleZodError),
  zValidator(
    "header",
    z.object({
      "X-GitHub-Event": z.literal("push"),
      "X-Hub-Signature-256": z.string().nonempty(),
    }),
    handleZodError,
  ),
  async (c) => {
    const result = await c.var.container.noteService.pushNotes({
      owner: c.req.valid("json").repository.owner.login,
      repo: c.req.valid("json").repository.name,
      installationId: c.req.valid("json").installation.id,
      commits: c.req.valid("json").commits,
    });

    if (result.isErr()) {
      return handleError(result.error, c);
    }

    const { synced, added } = result.value;

    if (added.length < 1) {
      return c.json({ synced, added: [] });
    }

    const [userResult, bookResult] = await Promise.all([
      c.var.container.accountService.getUserById({ userId: added[0].userId }),
      c.var.container.noteService.getBook({ bookId: added[0].bookId }),
    ]);

    if (userResult.isErr()) {
      return handleError(userResult.error, c);
    }

    if (bookResult.isErr()) {
      return handleError(bookResult.error, c);
    }

    const user = userResult.value;
    const book = bookResult.value;

    const posted = await Promise.all(
      added.map((note) =>
        c.var.container.postService
          .postNote({
            userId: note.userId,
            bookId: note.bookId,
            notePath: note.path,
            did: user.did,
            text: `${note.title}

Posted on @md!
${process.env.NEXT_PUBLIC_URL}/${user.handle}/${book.owner}/${book.repo}/${note.path}`,
          })
          .unwrapOr(null),
      ),
    );

    return c.json({
      synced,
      added: added.map((note) => note.id),
      posted: posted.filter((post) => post !== null).map((post) => post.id),
    });
  },
);
