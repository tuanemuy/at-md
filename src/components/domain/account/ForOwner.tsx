import { auth } from "@/actions/account";

type Props = {
  userId: string;
  children: React.ReactNode;
};

export async function ForOwner({ userId, children }: Props) {
  const session = await auth();

  if (!session || session.user.id !== userId) {
    return null;
  }

  return <>{children}</>;
}
