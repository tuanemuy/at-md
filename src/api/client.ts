import { hc } from "hono/client";
import type { Routes } from "./routes";

export const client = hc<Routes>(`${process.env.NEXT_PUBLIC_URL}/api`);
