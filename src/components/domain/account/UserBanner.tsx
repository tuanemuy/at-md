import { getUserByHandle } from "@/actions/account";

type Props = {
  handle: string;
};

export async function UserBanner({ handle }: Props) {
  const user = await getUserByHandle(handle);

  if (!user) {
    return null;
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
