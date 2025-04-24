import { listAllUsers } from "@/actions/account";

export const revalidate = 300;

export const generateStaticParams = async () => {
  const users = await listAllUsers();
  return users.map((user) => ({
    handle: user.handle,
  }));
};

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <>{children}</>;
}
