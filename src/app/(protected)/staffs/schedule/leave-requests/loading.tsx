import { Skeleton } from "@/components/ui/skeleton";

export default function LeaveRequestsLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}
