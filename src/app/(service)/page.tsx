import { type RawSearchParams, SearchParams } from "@/lib/router";

import { Suspense } from "react";
import { Timeline, TimelineSkeleton } from "./_components/Timeline";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

export default async function Page({ searchParams }: Props) {
  const sp = SearchParams.fromRaw(await searchParams);
  const page = sp.getOne("page") || "1";
  const query = sp.getOne("query") || "";

  return (
    <main>
      <div className="content py-(--spacing-layout-md)">
        <Suspense fallback={<TimelineSkeleton items={5} />}>
          <Timeline page={Number.parseInt(page, 10)} query={query} />
        </Suspense>
      </div>
    </main>
  );
}
