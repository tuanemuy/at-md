import type { ErrorResponse } from "@/api/error";
import type { ApplicationServiceError } from "@/domain/types/error";
import type { SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { ValidationTargets } from "hono";
import type { ClientRequestOptions, ClientResponse } from "hono/client";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ResultAsync } from "neverthrow";
import type { ZodSchema, z } from "zod";

export const ConformSuccessfulActionStatus = {
  Success: "success",
  Redirect: "redirect",
} as const;
export type ConformSuccessfulActionStatus =
  (typeof ConformSuccessfulActionStatus)[keyof typeof ConformSuccessfulActionStatus];

export const ConformFailedActionStatus = {
  Error: "error",
} as const;
export type ConformFailedActionStatus =
  (typeof ConformFailedActionStatus)[keyof typeof ConformFailedActionStatus];

export const ConformIdleActionStatus = {
  Idle: "idle",
} as const;
export type ConformIdleActionStatus =
  (typeof ConformIdleActionStatus)[keyof typeof ConformIdleActionStatus];

export const ConformActionStatus = {
  ...ConformSuccessfulActionStatus,
  ...ConformFailedActionStatus,
  ...ConformIdleActionStatus,
} as const;
export type ConformActionStatus =
  (typeof ConformActionStatus)[keyof typeof ConformActionStatus];

export type ConformSuccessfulHonoActionState<TResponse extends JsonObject> = {
  status: ConformSuccessfulActionStatus;
  response: TResponse;
  submission?: SubmissionResult;
};
export type ConformFailedHonoActionState = {
  status: ConformFailedActionStatus;
  response: ErrorResponse;
  submission?: SubmissionResult;
};
export type ConformIdleHonoActionState = {
  status: ConformIdleActionStatus;
  response?: undefined;
  submission?: SubmissionResult;
};
export type ConformHonoActionState<TResponse extends JsonObject> =
  | ConformSuccessfulHonoActionState<TResponse>
  | ConformFailedHonoActionState
  | ConformIdleHonoActionState;

export type HonoAction<
  TArgs,
  TTarget extends keyof ValidationTargets,
  TResponse extends JsonObject,
> = (
  args: { [key in TTarget]: TArgs },
  options?: ClientRequestOptions,
) => Promise<
  ClientResponse<TResponse | ErrorResponse, ContentfulStatusCode, "json">
>;

export function honoWithConform<
  TSchema extends ZodSchema,
  TTarget extends keyof ValidationTargets,
  TResponse extends JsonObject,
>(
  action: HonoAction<z.infer<TSchema>, TTarget, TResponse>,
  target: TTarget,
  schema: TSchema,
  options: ClientRequestOptions,
  redirectOnSuccess?: boolean,
): (
  prevState: ConformHonoActionState<TResponse>,
  formData: FormData,
) => Promise<ConformHonoActionState<TResponse>> {
  return async (
    prevState: ConformHonoActionState<TResponse>,
    formData: FormData,
  ) => {
    const submission = parseWithZod(formData, { schema });
    if (submission.status !== "success") {
      return {
        status: prevState.status,
        response: prevState.response,
        submission: submission.reply(),
      } as ConformHonoActionState<TResponse>;
    }

    let result: ClientResponse<
      TResponse | ErrorResponse,
      ContentfulStatusCode,
      "json"
    >;
    try {
      result = await action(
        { [target]: submission.value } as {
          [key in TTarget]: z.infer<TSchema>;
        },
        options,
      );
    } catch (error) {
      return {
        status: ConformFailedActionStatus.Error,
        response: {
          error: {
            message: "An error occurred while processing your request.",
          },
        },
        submission: submission.reply(),
      };
    }

    try {
      if (!result.ok) {
        const response = (await result.json()) as ErrorResponse;
        return {
          status: ConformFailedActionStatus.Error,
          response,
          submission: submission.reply(),
        };
      }

      const response = (await result.json()) as TResponse;
      if (redirectOnSuccess) {
        return {
          status: ConformSuccessfulActionStatus.Redirect,
          response,
          submission: submission.reply(),
        };
      }

      return {
        status: ConformSuccessfulActionStatus.Success,
        response,
        submission: submission.reply(),
      };
    } catch (error) {
      return {
        status: ConformFailedActionStatus.Error,
        response: {
          error: {
            message: "An error occurred while parsing the response.",
          },
        },
        submission: submission.reply(),
      };
    }
  };
}

export type ConformSuccessfulActionState<TResponse> = {
  status: ConformSuccessfulActionStatus;
  response: TResponse;
  submission?: SubmissionResult;
};
export type ConformFailedActionState = {
  status: ConformFailedActionStatus;
  response: ApplicationServiceError;
  submission?: SubmissionResult;
};
export type ConformIdleActionState = {
  status: ConformIdleActionStatus;
  response?: undefined;
  submission?: SubmissionResult;
};
export type ConformActionState<TResponse> =
  | ConformSuccessfulActionState<TResponse>
  | ConformFailedActionState
  | ConformIdleActionState;

export function usecaseWithConform<TSchema extends ZodSchema, TResponse>(
  action: (
    input: z.infer<TSchema>,
  ) => ResultAsync<TResponse, ApplicationServiceError>,
  schema: TSchema,
  redirectOnSuccess?: boolean,
): (
  prevState: ConformActionState<TResponse>,
  formData: FormData,
) => Promise<ConformActionState<TResponse>> {
  return async (
    prevState: ConformActionState<TResponse>,
    formData: FormData,
  ) => {
    const submission = parseWithZod(formData, { schema });
    if (submission.status !== "success") {
      return {
        status: prevState.status,
        response: prevState.response,
        submission: submission.reply(),
      } as ConformActionState<TResponse>;
    }

    return await action(submission.value).match(
      (response) => {
        if (redirectOnSuccess) {
          return {
            status: ConformSuccessfulActionStatus.Redirect,
            response,
            submission: submission.reply(),
          };
        }

        return {
          status: ConformSuccessfulActionStatus.Success,
          response,
          submission: submission.reply(),
        };
      },
      (error) => {
        return {
          status: ConformFailedActionStatus.Error,
          response: error,
          submission: submission.reply(),
        };
      },
    );
  };
}
