import { getUserByHandle } from "@/actions/account";
import { listBooks } from "@/actions/note";
import { notFound } from "next/navigation";

import { ForOwner } from "@/components/domain/account/AsyncForOwner";
import { UserHeader } from "@/components/domain/account/UserHeader";
import { Books } from "@/components/domain/note/Books";
import { GitHubConnection } from "@/components/domain/note/GitHubConnection";

type Props = {
  params: Promise<{
    handle: string;
  }>;
};

export const revalidate = 300;

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

  const books = await listBooks(user.id);

  return (
    <main>
      <section className="pb-(--spacing-layout-md)">
        <UserHeader user={user} />
      </section>

      <section className="content pt-(--spacing-layout-md) border-t">
        <Books userId={user.id} handle={handle} books={books} />
      </section>

      <section className="content py-(--spacing-layout-md)">
        <ForOwner userId={user.id}>
          <GitHubConnection />
        </ForOwner>
      </section>
    </main>
  );
}
