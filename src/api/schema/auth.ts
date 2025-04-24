import { z } from "zod";

export const signInRequestSchema = z.object({
  handle: z.string().min(1),
});
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const connectGitHubRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type ConnectGitHubRequest = z.infer<typeof connectGitHubRequestSchema>;
