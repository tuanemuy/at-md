import { Skeleton } from "@/components/ui/skeleton";

export function BooksSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {Array.from({ length: 5 }, (_, i) => i).map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
