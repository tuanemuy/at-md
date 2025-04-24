// import type { IncomingMessage, ServerResponse } from "node:http";

export type RequestContext = {
  // req: IncomingMessage;
  // res: ServerResponse<IncomingMessage>;
  req: Request;
  res: Response;
};
