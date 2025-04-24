import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  items: number;
  showUser?: boolean;
};

export function NotesViewSkeleton({ items, showUser }: Props) {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: items }, (_, i) => i).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          {showUser && <Skeleton className="h-10 w-full mb-4" />}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}
