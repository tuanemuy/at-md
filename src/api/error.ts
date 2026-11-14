import type { AnyError } from "@/lib/error";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { core } from "zod";

export type ErrorResponse = {
  error: {
    message: string;
  };
};

export function handleError(error: AnyError, c: Context) {
  return c.json(
    {
      error: {
        message: error.message,
      },
    },
    500,
  );
}

export const HTTPExceptionCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
export type HTTPExceptionCode =
  (typeof HTTPExceptionCode)[keyof typeof HTTPExceptionCode];

export const handleHTTPException = (err: Error, c: Context): Response => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          message: err.message,
        },
      },
      err.status,
    );
  }

  return c.json(
    {
      error: {
        message: err.message,
      },
    },
    500,
  );
};

export const handleZodError = (
  result:
    | {
        success: true;
        data: unknown;
      }
    | {
        success: false;
        error: core.$ZodError;
      },
  c: Context,
) => {
  if (!result.success) {
    return c.json(
      {
        error: {
          message: parseZodErrorMessage(result.error),
        },
      },
      400,
    );
  }
};

function parseZodErrorMessage(err: core.$ZodError) {
  const issue = err.issues[0];
  if (!issue) {
    return err.message;
  }
  return `${issue.path.join(".")}: ${issue.message}`;
}
