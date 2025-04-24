import { createApp } from "@/api/app";
import { routes } from "@/api/routes";
import { handle } from "hono/vercel";

const app = createApp("/api");
app.route("/", routes);

export const GET = handle(app);
export const POST = handle(app);
