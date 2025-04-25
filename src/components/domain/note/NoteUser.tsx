import { getUser } from "@/actions/account";

import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  userId: string;
};

export async function NoteUser({ userId }: Props) {
  const user = await getUser(userId);

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {user.profile.avatarUrl && (
        <img
          className="size-11 md:size-12 border-2 object-cover border-border bg-muted-foreground rounded-full"
          src={user.profile.avatarUrl}
          alt="Avatar"
          loading="lazy"
        />
      )}

      <div className="flex flex-col">
        <h3 className="text-md md:text-lg font-bold leading-[1.25]">
          {user.profile.displayName}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground">
          @{user.handle}
        </p>
      </div>
    </div>
  );
}

export function NoteUserSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 md:size-12 border-2 object-cover border-border bg-muted-foreground rounded-full" />
      <div className="flex flex-col">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="mt-1 w-16 h-4" />
      </div>
    </div>
  );
}
