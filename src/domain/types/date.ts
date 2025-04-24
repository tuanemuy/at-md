import { isValid, parseISO } from "date-fns";
import { z } from "zod";

/**
 * Custom date type (alias for standard Date object)
 * Includes year, month, day, time and timezone information
 */
export type AppDate = Date;

/**
 * Zod schema for date type
 * Accepts ISO format string or Date object, converts to AppDate type
 */
export const dateSchema = z
  .preprocess(
    (arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg !== "string") return new Date(Number.NaN); // Invalid date
      return parseISO(arg);
    },
    z.date().refine((date) => isValid(date), {
      message: "Must be a valid date format",
    }),
  )
  .describe("Date");
