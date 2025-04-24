import type { Book } from "@/domain/note/models/book";

import { Disconnect } from "./Disconnect";
import { Sync } from "./Sync";

type Props = {
  book: Book;
  redirectPath?: string;
};

export function BookMenu({ book, redirectPath }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Sync book={book} />
      <Disconnect book={book} redirectPath={redirectPath} />
    </div>
  );
}
