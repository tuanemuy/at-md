import { getUserByHandle } from "@/actions/account";
import { notFound } from "next/navigation";

import { ForOwner } from "@/components/domain/account/ForOwner";
import { UserHeader } from "@/components/domain/account/UserHeader";
import { Books } from "@/components/domain/note/Books";
import { BooksSkeleton } from "@/components/domain/note/BooksSkeleton";
import { GitHubConnection } from "@/components/domain/note/GitHubConnection";
import { Suspense } from "react";

type Props = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const user = await getUserByHandle(handle);

  const title = `${user?.profile.displayName || handle} | ${process.env.NEXT_PUBLIC_SITE_NAME}`;
  const description =
    user?.profile.description || user?.profile.displayName || handle;

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
  const { handle } = await params;
  const user = await getUserByHandle(handle);

  if (!user) {
    notFound();
  }

  return (
    <main>
      <section className="pb-(--spacing-layout-md)">
        <UserHeader user={user} />
      </section>

      <section className="content pt-(--spacing-layout-md) border-t">
        <Suspense fallback={<BooksSkeleton />}>
          <Books userId={user.id} handle={handle} />
        </Suspense>
      </section>

      <section className="content py-(--spacing-layout-md)">
        <Suspense>
          <ForOwner userId={user.id}>
            <GitHubConnection />
          </ForOwner>
        </Suspense>
      </section>
    </main>
  );
}
