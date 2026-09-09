import { Skeleton } from "@/components/ui/skeleton";

export default function StaffScheduleLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}
