import { getUserByHandle } from "@/actions/account";

import Link from "next/link";

type Props = {
  handle: string;
};

export async function User({ handle }: Props) {
  const user = await getUserByHandle(handle);

  if (!user) {
    return null;
  }

  return (
    <Link href={`/${handle}`} className="flex items-center gap-3">
      {user.profile.avatarUrl && (
        <img
          className="size-14 md:size-16 border-2 object-cover border-border bg-muted-foreground rounded-full"
          src={user.profile.avatarUrl}
          alt="Avatar"
          loading="lazy"
        />
      )}

      <div className="flex flex-col">
        <h2 className="text-lg md:text-xl font-bold leading-[1.25]">
          {user.profile.displayName}
        </h2>
        <p className="text-sm text-muted-foreground">@{user.handle}</p>
      </div>
    </Link>
  );
}
