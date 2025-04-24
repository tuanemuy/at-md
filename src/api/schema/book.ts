import { gitHubCommitSchema } from "@/domain/note/dtos/github-commit";
import { z } from "zod";

export const githubWebhookRequestSchema = z.object({
  repository: z.object({
    owner: z.object({
      login: z.string().nonempty(),
    }),
    name: z.string().nonempty(),
  }),
  installation: z.object({
    id: z.number().int().positive(),
  }),
  commits: z.array(gitHubCommitSchema),
});
export type GithubWebhookRequest = z.infer<typeof githubWebhookRequestSchema>;
