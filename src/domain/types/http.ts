import type { ClientRequest, IncomingMessage, ServerResponse } from "node:http";

export type RequestContext = {
  req: IncomingMessage;
  res: ServerResponse<IncomingMessage>;
};
