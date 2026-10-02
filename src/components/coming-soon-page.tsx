import { Construction } from "lucide-react";
import { PageHeader, type BreadcrumbEntry } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonPageProps {
  breadcrumbs: BreadcrumbEntry[];
  title: string;
  description: string;
  /** Which task builds the real screen, e.g. "D-1" - shown so nobody files it as a bug. */
  task: string;
}

/**
 * Placeholder for a screen of the order journey that a Phase 1 track has not built yet
 * (P0-7). The route and its sidebar entry exist up front so no two tracks edit the sidebar;
 * the owning track replaces this page in its own folder.
 */
export function ComingSoonPage({ breadcrumbs, title, description, task }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader breadcrumbs={breadcrumbs} title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="size-10 text-muted-foreground" />
          <p className="font-medium">Màn hình đang được xây dựng</p>
          <p className="text-sm text-muted-foreground">Thuộc task {task} - luồng hành trình đơn hàng.</p>
        </CardContent>
      </Card>
    </div>
  );
}
