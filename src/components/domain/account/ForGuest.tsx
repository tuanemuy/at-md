import { auth } from "@/actions/account";

type Props = {
  children: React.ReactNode;
};

export async function ForGuest({ children }: Props) {
  const session = await auth();

  if (session) {
    return null;
  }

  return <>{children}</>;
}
