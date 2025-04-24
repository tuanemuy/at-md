"use client";

import { getUser } from "@/actions/account";
import type { User as UserModel } from "@/domain/account/models/user";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  id: string;
};

export function User({ id }: Props) {
  const [user, setUser] = useState<UserModel | null>(null);
  useEffect(() => {
    (async () => {
      const user = await getUser(id);
      setUser(user);
    })();
  }, [id]);

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 md:size-12 rounded-full" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-[100px] md:w-[150px]" />
          <Skeleton className="h-4 w-[80px] md:w-[120px] mt-2" />
        </div>
      </div>
    );
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
        <h2 className="text-md md:text-lg font-bold leading-[1.25]">
          {user.profile.displayName}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          @{user.handle}
        </p>
      </div>
    </div>
  );
}
