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

export type Pagination = {
  page: number;
  limit: number;
  order: DBOrder;
  orderBy: string;
};

/**
 * ページネーションパラメータの型定義
 */
export interface PaginationParams {
  page: number;
  limit: number;
}
