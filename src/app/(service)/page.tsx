import { searchNotes } from "@/actions/note";

import { NotesViewSkeleton } from "@/components/domain/note/NotesViewSkeleton";
import { Suspense } from "react";
import { Timeline as ClientTimeline } from "./_components/Timeline";

export default function Page() {
  return (
    <main>
      <div className="content py-(--spacing-layout-md)">
        <Suspense fallback={<NotesViewSkeleton items={5} />}>
          <Timeline />
        </Suspense>
      </div>
    </main>
  );
}

async function Timeline() {
  const { items, count } = await searchNotes({
    query: "",
    pagination: {
      order: "desc",
      orderBy: "updatedAt",
      limit: Number.parseInt(process.env.NEXT_PUBLIC_PAGINATION_LIMIT, 10),
      page: 1,
    },
  });

  return <ClientTimeline initialNotes={items} initialCount={count} />;
}
