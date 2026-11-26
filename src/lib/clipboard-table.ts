/**
 * Chép các dòng giá trị vào clipboard sao cho dán vào Excel / Google Sheets ra đúng từng ô. Không có dòng tiêu đề:
 * người dùng dán vào bảng đã có sẵn cột của họ, nên chỉ chép giá trị.
 * Ghi hai định dạng cùng lúc: `text/html` (Excel giữ ô, số vẫn là số) và `text/plain` cách nhau bằng tab
 * (ứng dụng không đọc HTML vẫn tách được cột). Phải gọi trong handler của click: trình duyệt chỉ cho ghi clipboard khi đó.
 */
export type TableCell = string | number | null | undefined;

/** Tab / xuống dòng trong ô sẽ tách sai cột / dòng ở bản text: thay bằng khoảng trắng. */
function plain(cell: TableCell): string {
  return cell === null || cell === undefined ? "" : String(cell).replace(/[\t\r\n]+/g, " ");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bản TSV: một dòng mỗi hàng, cột cách nhau bằng tab. */
export function toTsv(rows: readonly (readonly TableCell[])[]): string {
  return rows.map((row) => row.map(plain).join("\t")).join("\n");
}

/** Bản HTML: số giữ kiểu số (`mso-number-format`) để Excel cộng được, chữ giữ dạng chữ (mã "001" không mất số 0). */
export function toHtmlTable(rows: readonly (readonly TableCell[])[]): string {
  const cell = (value: TableCell) => {
    if (typeof value === "number") {
      return `<td style="mso-number-format:'0'">${value}</td>`;
    }
    return `<td style="mso-number-format:'\\@'">${escapeHtml(plain(value))}</td>`;
  };
  const body = rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("");
  return `<meta charset="utf-8"><table>${body}</table>`;
}

type Rows = readonly (readonly TableCell[])[];

/**
 * `true` nếu đã chép. Nhận cả Promise để dữ liệu nạp sau (gọi API) vẫn ghi được: ClipboardItem được tạo ngay trong
 * click (Safari đòi vậy), nội dung đến sau. Trình duyệt không có ClipboardItem (hoặc từ chối HTML) thì chép bản TSV.
 * Promise dữ liệu bị lỗi thì lỗi đó được ném ra cho nơi gọi.
 */
export async function copyRows(rows: Rows | Promise<Rows>): Promise<boolean> {
  const ready = Promise.resolve(rows);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": ready.then((r) => new Blob([toHtmlTable(r)], { type: "text/html" })),
          "text/plain": ready.then((r) => new Blob([toTsv(r)], { type: "text/plain" })),
        }),
      ]);
      return true;
    }
  } catch {
    // Rơi xuống bản text bên dưới.
  }
  const tsv = toTsv(await ready);
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}
