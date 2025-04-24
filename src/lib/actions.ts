import type { ErrorResponse } from "@/api/error";
import type { ApplicationServiceError } from "@/domain/types/error";
import type { SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { ValidationTargets } from "hono";
import type { ClientRequestOptions, ClientResponse } from "hono/client";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ResultAsync } from "neverthrow";
import type { ZodSchema, z } from "zod";

export const SuccessfulActionStatus = {
  Success: "success",
  Redirect: "redirect",
} as const;
export type SuccessfulActionStatus =
  (typeof SuccessfulActionStatus)[keyof typeof SuccessfulActionStatus];

export const FailedActionStatus = {
  Error: "error",
} as const;
export type FailedActionStatus =
  (typeof FailedActionStatus)[keyof typeof FailedActionStatus];

export const IdleActionStatus = {
  Idle: "idle",
} as const;
export type IdleActionStatus =
  (typeof IdleActionStatus)[keyof typeof IdleActionStatus];

export const ActionStatus = {
  ...SuccessfulActionStatus,
  ...FailedActionStatus,
  ...IdleActionStatus,
} as const;
export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus];

export type ConformSuccessfulHonoActionState<TResponse extends JsonObject> = {
  status: SuccessfulActionStatus;
  response: TResponse;
  submission?: SubmissionResult;
};
export type ConformFailedHonoActionState = {
  status: FailedActionStatus;
  response: ErrorResponse;
  submission?: SubmissionResult;
};
export type ConformIdleHonoActionState = {
  status: IdleActionStatus;
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
        status: FailedActionStatus.Error,
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
          status: FailedActionStatus.Error,
          response,
          submission: submission.reply(),
        };
      }

      const response = (await result.json()) as TResponse;
      if (redirectOnSuccess) {
        return {
          status: SuccessfulActionStatus.Redirect,
          response,
          submission: submission.reply(),
        };
      }

      return {
        status: SuccessfulActionStatus.Success,
        response,
        submission: submission.reply(),
      };
    } catch (error) {
      return {
        status: FailedActionStatus.Error,
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
  status: SuccessfulActionStatus;
  response: TResponse;
  submission?: SubmissionResult;
};
export type ConformFailedActionState = {
  status: FailedActionStatus;
  response: ApplicationServiceError;
  submission?: SubmissionResult;
};
export type ConformIdleActionState = {
  status: IdleActionStatus;
  response?: undefined;
  submission?: SubmissionResult;
};
export type ConformActionState<TResponse> =
  | ConformSuccessfulActionState<TResponse>
  | ConformFailedActionState
  | ConformIdleActionState;

export function usecaseToActionWithConform<
  TSchema extends ZodSchema,
  TResponse,
>(
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
            status: SuccessfulActionStatus.Redirect,
            response,
            submission: submission.reply(),
          };
        }

        return {
          status: SuccessfulActionStatus.Success,
          response,
          submission: submission.reply(),
        };
      },
      (error) => {
        return {
          status: FailedActionStatus.Error,
          response: error,
          submission: submission.reply(),
        };
      },
    );
  };
}

export type SuccessfulActionState<TResponse> = {
  status: SuccessfulActionStatus;
  response: TResponse;
};
export type FailedActionState = {
  status: FailedActionStatus;
  response: ApplicationServiceError;
};
export type IdleActionState = {
  status: IdleActionStatus;
  response?: undefined;
  submission?: SubmissionResult;
};
export type ActionState<TResponse> =
  | SuccessfulActionState<TResponse>
  | FailedActionState
  | IdleActionState;

export function usecaseToAction<TSchema extends ZodSchema, TResponse>(
  action: (
    input: z.infer<TSchema>,
  ) => ResultAsync<TResponse, ApplicationServiceError>,
  redirectOnSuccess?: boolean,
): (
  prevState: ActionState<TResponse>,
  input: z.infer<TSchema>,
) => Promise<ActionState<TResponse>> {
  return async (
    _prevState: ActionState<TResponse>,
    input: z.infer<TSchema>,
  ) => {
    return await action(input).match(
      (response) => {
        if (redirectOnSuccess) {
          return {
            status: SuccessfulActionStatus.Redirect,
            response,
          };
        }

        return {
          status: SuccessfulActionStatus.Success,
          response,
        };
      },
      (error) => {
        return {
          status: FailedActionStatus.Error,
          response: error,
        };
      },
    );
  };
}
