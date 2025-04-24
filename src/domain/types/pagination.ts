import { z } from "zod";

export const DBOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;
export type DBOrder = (typeof DBOrder)[keyof typeof DBOrder];

export function stringToDBOrder(str: string): DBOrder | undefined {
  switch (str) {
    case "asc":
      return DBOrder.ASC;
    case "desc":
      return DBOrder.DESC;
    default:
      return undefined;
  }
}

/**
 * ページネーションパラメータの型定義
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(30),
  order: z.enum([DBOrder.ASC, DBOrder.DESC]).default(DBOrder.DESC),
  orderBy: z.string().default("createdAt"),
});
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
