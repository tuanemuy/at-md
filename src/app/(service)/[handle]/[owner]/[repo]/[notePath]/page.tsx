import { getBook, getNote, listAllNotes } from "@/actions/note";
import { separator } from "@/domain/note/models/note";
import { mdToHtml } from "@/lib/markdown";
import { format } from "date-fns";
import { notFound } from "next/navigation";

import { ForOwner } from "@/components/domain/account/ForOwner";
import {
  UserInfo,
  UserInfoSkeleton,
} from "@/components/domain/account/UserInfo";
import { Article } from "@/components/domain/note/Article";
import { BackToBook } from "@/components/domain/note/BackToBook";
import { DeleteNote } from "@/components/domain/note/DeleteNote";
import { Highlight } from "@/components/domain/note/Highlight";
import { OGCard } from "@/components/domain/note/OGCard";
import {
  Engagement,
  EngagementSkeleton,
} from "@/components/domain/post/Engagement";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type Props = {
  params: Promise<{
    handle: string;
    owner: string;
    repo: string;
    notePath: string;
  }>;
};

export const revalidate = 60;

type ParentProps = {
  params: {
    handle: string;
    owner: string;
    repo: string;
  };
};

export const generateStaticParams = async ({
  params: { handle, owner, repo },
}: ParentProps) => {
  const book = await getBook(owner, repo);
  if (!book) {
    return [];
  }
  const notes = await listAllNotes(book.id);
  return notes.map((note) => ({
    handle,
    owner,
    repo,
    notePath: note.path,
  }));
};

export async function generateMetadata({ params }: Props) {
  const { owner, repo, notePath } = await params;
  const note = await getNote(decodeURIComponent(notePath));
  const book = await getBook(owner, repo);

  const bookName = book?.details.name || `${owner}/${repo}`;
  const noteTitle = note?.title || notePath.replace(separator, "/");
  const title = `${noteTitle} | ${bookName}`;
  const description =
    note?.body.slice(0, 160).replace(/\r?\n/g, "").replaceAll("#", "") ||
    noteTitle;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { handle, owner, repo, notePath } = await params;
  const note = await getNote(decodeURIComponent(notePath));

  if (!note) {
    notFound();
  }

  const body = await mdToHtml(note.body);
  const createdAt = format(note.createdAt, "yyyy-MM-dd HH:mm");
  const updatedAt = format(note.updatedAt, "yyyy-MM-dd HH:mm");

  return (
    <main>
      <div className="content py-(--spacing-layout-lg)">
        <Suspense
          fallback={
            <Button asChild variant="ghost" className="!pl-0 cursor-pointer">
              <Link href={`/${handle}/${owner}/${repo}`}>
                <ChevronLeft />
              </Link>
            </Button>
          }
        >
          <BackToBook handle={handle} owner={owner} repo={repo} />
        </Suspense>

        <h1 className="mt-3 text-2xl md:text-4xl font-bold">{note.title}</h1>

        {note.createdAt && (
          <p className="text-sm text-muted-foreground">
            {createdAt}
            {createdAt !== updatedAt ? ` / ${updatedAt}` : ""}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4">
          <Suspense fallback={<EngagementSkeleton />}>
            <Engagement
              note={note}
              fullPath={`/${handle}/${owner}/${repo}/${notePath}`}
            />
          </Suspense>

          <Suspense>
            <ForOwner userId={note.userId}>
              <DeleteNote
                note={note}
                redirectPath={`/${handle}/${owner}/${repo}`}
              />
            </ForOwner>
          </Suspense>
        </div>

        <section className="mt-(--spacing-layout-sm) pt-(--spacing-layout-sm) border-t">
          <Suspense fallback={<UserInfoSkeleton />}>
            <UserInfo userId={note.userId} />
          </Suspense>
        </section>

        <article className="py-(--spacing-layout-md)">
          <Article text={body} />
          <Highlight />
          <OGCard />
        </article>
      </div>
    </main>
  );
}
