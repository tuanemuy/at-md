import { getUserByHandle } from "@/actions/account";

import { ForUser } from "./ForUser";
import { SignOut } from "./SignOut";
import { SyncProfile } from "./SyncProfile";

type Props = {
  handle: string;
};

export async function UserHeader({ handle }: Props) {
  const user = await getUserByHandle(handle);

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="relative w-full aspect-[1440/360] bg-muted-foreground">
        {user.profile.bannerUrl && (
          <img
            src={user.profile.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {user.profile.avatarUrl && (
          <div className="absolute bottom-0 left-0 w-full translate-y-1/2">
            <div className="content">
              <img
                className="size-24 md:size-36 border-2 object-cover border-border bg-muted-foreground rounded-full"
                src={user.profile.avatarUrl}
                alt="Avatar"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
      <div className="h-12 md:h-18" />

      <div className="content mt-4 md:mt-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {user.profile.displayName}
        </h1>
        <p className="text-muted-foreground">@{user.handle}</p>
        <p className="mt-2">{user.profile.description}</p>

        <ForUser>
          <div className="flex items-center gap-2 mt-3">
            <SyncProfile />
            <SignOut />
          </div>
        </ForUser>
      </div>
    </>
  );
}
