import { listBooks } from "@/actions/note";
import { getUserByHandle } from "@/actions/account";

export const revalidate = 300;

type ParentProps = {
  params: {
    handle: string;
  };
};

export const generateStaticParams = async ({
  params: { handle },
}: ParentProps) => {
  const user = await getUserByHandle(handle);
  if (!user) {
    return [];
  }
  const books = await listBooks(user.id);
  return books.map((book) => ({
    handle,
    owner: book.owner,
    repo: book.repo,
  }));
};

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <>{children}</>;
}
