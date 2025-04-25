import { getUser } from "@/actions/account";

import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  userId: string;
};

export async function UserBanner({ userId }: Props) {
  const user = await getUser(userId);

  if (!user) {
    return <UserBannerSkeleton />;
  }

  return (
    <div className="relative w-full aspect-[1440/360] bg-muted-foreground">
      {user.profile.bannerUrl && (
        <img
          src={user.profile.bannerUrl}
          alt="Banner"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

export function UserBannerSkeleton() {
  return (
    <div className="relative w-full aspect-[1440/360] bg-muted-foreground">
      <Skeleton className="w-full h-full" />
    </div>
  );
}
