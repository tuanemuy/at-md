import { type Result, err, ok } from "@/lib/result";
import type { z } from "zod";
import { ValidationError, ValidationErrorCode } from "./error";

/**
 * Type definition for a validation function
 */
export type ValidateFunction<T> = (data: unknown) => Result<T, ValidationError>;

/**
 * Type definition for validation result
 */
export type ValidationResult<T> = Result<T, ValidationError>;

/**
 * Validation error detail information
 */
export interface ValidationErrorDetail {
  path: string[];
  message: string;
}

/**
 * Validate a value using a Zod schema
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validation result
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Result<z.infer<T>, ValidationError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  const validationErrors: Record<string, string[]> = {};

  // Format zod errors
  for (const error of result.error.errors) {
    const path = error.path.join(".") || "_";
    if (!validationErrors[path]) {
      validationErrors[path] = [];
    }
    validationErrors[path].push(error.message);
  }

  return err(
    new ValidationError(
      ValidationErrorCode.INVALID_INPUT,
      "Validation error occurred",
      validationErrors,
      result.error,
    ),
  );
}
