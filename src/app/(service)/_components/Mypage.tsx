import { auth, getUser } from "@/actions/account";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function Mypage() {
  const session = await auth();

  if (!session) {
    return (
      <Button asChild size="sm" className="cursor-pointer">
        <Link href="/auth/signin">Signin</Link>
      </Button>
    );
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return (
      <Button asChild size="sm" className="cursor-pointer">
        <Link href="/auth/signin">Signin</Link>
      </Button>
    );
  }

  return (
    <Link
      href={`/${user.handle}`}
      className="block size-8 border-1 border-border rounded-full overflow-hidden bg-muted-foreground"
    >
      {user.profile.avatarUrl && (
        <img
          src={user.profile.avatarUrl}
          alt="avatar"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </Link>
  );
}
