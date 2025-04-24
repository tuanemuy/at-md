import { auth } from "@/actions/account";

type Props = {
  children: React.ReactNode;
};

export async function ForUser({ children }: Props) {
  const session = await auth();

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
