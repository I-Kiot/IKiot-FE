import { Construction } from "lucide-react";
import { PageHeader, type BreadcrumbEntry } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonPageProps {
  breadcrumbs: BreadcrumbEntry[];
  title: string;
  description: string;
  /** Task nào làm màn thật, vd. "D-1" - ghi ra để không ai báo nhầm là bug. */
  task: string;
}

/**
 * Chỗ giữ chỗ cho một màn của hành trình đơn mà track Phase 1 chưa làm (P0-7). Route và mục sidebar có sẵn từ đầu để các track không sửa sidebar cùng lúc;
 * track sở hữu sẽ thay trang này trong thư mục của mình.
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
