import type { User } from "@/domain/account/models/user";

type Props = {
  user: User;
};

export function UserBanner({ user }: Props) {
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
