import { getBook } from "@/actions/note";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  handle: string;
  owner: string;
  repo: string;
};

export async function BackToBook({ handle, owner, repo }: Props) {
  const book = await getBook(owner, repo);

  return (
    <Button asChild variant="ghost" className="!pl-0 cursor-pointer">
      <Link href={`/${handle}/${owner}/${repo}`}>
        <ChevronLeft />
        {book ? book.details.name : ""}
      </Link>
    </Button>
  );
}
