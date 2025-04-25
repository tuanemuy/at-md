import { getUser } from "@/actions/account";

import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type Props = {
  userId: string;
};

export async function UserInfo({ userId }: Props) {
  const user = await getUser(userId);

  if (!user) {
    return <UserInfoSkeleton />;
  }

  return (
    <Link href={`/${user.handle}`} className="flex items-center gap-3">
      {user.profile.avatarUrl && (
        <img
          className="size-14 md:size-16 border-2 object-cover border-border bg-muted-foreground rounded-full"
          src={user.profile.avatarUrl}
          alt="Avatar"
          loading="lazy"
        />
      )}

      <div className="flex flex-col">
        <h3 className="text-lg md:text-xl font-bold leading-[1.25]">
          {user.profile.displayName}
        </h3>
        <p className="text-sm text-muted-foreground">@{user.handle}</p>
      </div>
    </Link>
  );
}

export function UserInfoSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-14 md:size-16 border-2 object-cover border-border bg-muted-foreground rounded-full" />
      <div className="flex flex-col">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="mt-2 w-32 h-4" />
      </div>
    </div>
  );
}
