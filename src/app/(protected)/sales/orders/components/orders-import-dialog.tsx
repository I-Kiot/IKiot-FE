// [Dialog – Nhập đơn hàng từ Excel]
"use client";

import { ImportFileDialog } from "@/components/import-file-dialog";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { useOrders } from "./orders-provider";

export function OrdersImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { reload } = useOrders();

  return (
    <ImportFileDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nhập đơn hàng từ file Excel"
      description="Mỗi dòng trong file là một mặt hàng; các dòng cùng mã nhóm đơn được gộp thành một đơn. Đơn được tạo ở trạng thái Xác nhận, như tạo đơn trên màn hình."
      noun="đơn"
      submitLabel="Nhập đơn hàng"
      templateFileName="mau-nhap-don-hang.xlsx"
      downloadTemplate={orderJourneyApi.downloadImportTemplate}
      upload={async (file) => {
        const result = await orderJourneyApi.importFile(file);
        reload();
        return `Đã nhập ${result.orderCount} đơn hàng`;
      }}
      tips={
        <>
          <li>
            Bắt buộc:{" "}
            <strong className="text-foreground">
              Mã nhóm đơn, Chi nhánh, Hình thức nhận hàng, Người phụ trách, SKU, Số lượng
            </strong>{" "}
            (cột tiêu đề màu đỏ, có dấu *).
          </li>
          <li>
            Thông tin đơn (cột màu xanh) chỉ cần điền ở dòng đầu của đơn. Giá bỏ trống thì lấy giá bán lẻ hiện tại.
          </li>
          <li>
            Khách hàng khớp theo số điện thoại; chưa có thì cần tên để tạo khách mới. Giao tận nơi cần địa chỉ giao.
          </li>
          <li>
            Giảm giá đơn ghi số tiền (100000) hoặc phần trăm (5%) - phần trăm tính trên tiền hàng sau giảm từng dòng.
          </li>
          <li>
            Dòng làm riêng: điền <strong className="text-foreground">Thông số làm riêng</strong> dạng &quot;Màu:
            Trắng; Dài: 200 cm&quot; và/hoặc ghi chú cho xưởng - hệ thống tạo SKU riêng cho dòng đó. Ảnh mẫu thêm trên
            màn hình đơn sau khi nhập.
          </li>
          <li>
            Combo làm riêng từng món: thêm dưới dòng combo mỗi món một dòng phụ, cột{' '}
            <strong className="text-foreground">Thuộc combo</strong> ghi SKU của combo, cột SKU ghi SKU của món, để
            trống số lượng và giá.
          </li>
          <li>Tiền cọc là tiền đã thu: được ghi vào sổ thu chi ngay khi nhập.</li>
          <li>
            Không nhập khuyến mãi. Hướng dẫn chi tiết và ví dụ ở trang &quot;Hướng dẫn&quot; trong file mẫu.
          </li>
        </>
      }
    />
  );
}
