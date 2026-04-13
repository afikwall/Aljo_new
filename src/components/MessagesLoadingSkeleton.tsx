import { Skeleton } from "@/components/ui/skeleton";

export const MessagesLoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
};