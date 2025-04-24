import { Hono } from "hono";
import type { HonoEnv } from "../app";
import { authRoutes } from "./auth";
import { bookRoutes } from "./book";

export const routes = new Hono<HonoEnv>()
  .route("/auth", authRoutes)
  .route("/book", bookRoutes);
export type Routes = typeof routes;
