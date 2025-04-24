type Props = {
  children: React.ReactNode;
};

export function Field({ children }: Props) {
  return <div className="flex flex-col gap-2 w-full">{children}</div>;
}
