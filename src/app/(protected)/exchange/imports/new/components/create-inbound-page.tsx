"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getSessionRole } from "@/lib/auth";
import {
  creatableInboundSources,
  resolveInboundSource,
  type InboundSource,
} from "@/app/(protected)/exchange/shared/inbound-source";
import {
  CREATE_INBOUND_COPY,
  CreateInboundPanes,
  useInboundSourceSwitch,
} from "../../components/create-inbound-panes";
import { InboundSourceToggle } from "../../components/inbound-source-toggle";

/** Đường dẫn bảng Nhập hàng của một nguồn. */
function listUrl(source: InboundSource): string {
  return `/exchange/imports?source=${source}`;
}

/** Trang tạo mới: chọn nguồn ban đầu theo `?source=` (nếu được tạo loại đó), không có quyền tạo thì báo. */
export function CreateInboundPage() {
  const params = useSearchParams();
  const creatable = creatableInboundSources(getSessionRole());
  const defaultSource = resolveInboundSource(params.get("source"), creatable);

  if (!defaultSource) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Giao dịch" },
            { label: "Nhập hàng", href: "/exchange/imports" },
            { label: "Tạo mới" },
          ]}
          title="Tạo mới"
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền tạo mới</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền tạo đơn nhập hàng hay yêu cầu sản xuất. Vui lòng liên hệ
            quản trị viên nếu bạn cần quyền này.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/exchange/imports">Về danh sách nhập hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <CreateInboundForm defaultSource={defaultSource} options={creatable} />;
}

/** Phần thân khi đã có nguồn hợp lệ: toggle + hai form, tạo xong quay về bảng của nguồn đó. */
function CreateInboundForm({
  defaultSource,
  options,
}: {
  defaultSource: InboundSource;
  options: InboundSource[];
}) {
  const router = useRouter();
  const { source, opened, select } = useInboundSourceSwitch(defaultSource);
  const [submitting, setSubmitting] = useState(false);

  // Đang gửi thì không cho rời trang bằng nút Huỷ: kết quả về sau sẽ không còn ai nhận.
  function cancel() {
    if (submitting) return;
    router.push(listUrl(source));
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Nhập hàng", href: listUrl(source) },
          { label: "Tạo mới" },
        ]}
        title={CREATE_INBOUND_COPY[source].title}
        description={CREATE_INBOUND_COPY[source].description}
      />

      <InboundSourceToggle value={source} options={options} onChange={select} disabled={submitting} />

      <div className="flex flex-col rounded-lg border bg-card">
        <CreateInboundPanes
          source={source}
          opened={opened}
          onImportCreated={() => router.push(listUrl("SUPPLIER"))}
          // Mở chi tiết YCSX vừa tạo ở bảng để bấm "Đã gửi xưởng" ngay, như khi còn là dialog.
          onRequestCreated={(created) => router.push(`${listUrl("WORKSHOP")}&requestId=${created.id}`)}
          onCancel={cancel}
          onSubmittingChange={setSubmitting}
        />
      </div>
    </div>
  );
}
