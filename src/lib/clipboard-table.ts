/**
 * Chép các dòng giá trị vào clipboard sao cho dán vào Excel / Google Sheets ra đúng từng ô. Không có dòng tiêu đề:
 * người dùng dán vào bảng đã có sẵn cột của họ, nên chỉ chép giá trị.
 * Ghi hai định dạng cùng lúc: `text/html` (Excel giữ ô, số vẫn là số) và `text/plain` cách nhau bằng tab
 * (ứng dụng không đọc HTML vẫn tách được cột). Phải gọi trong handler của click: trình duyệt chỉ cho ghi clipboard khi đó.
 */
export type TableCell = string | number | null | undefined;

/** Nội dung ô: tab thành khoảng trắng (tab tách cột), xuống dòng giữ lại dạng `\n` để thành nhiều dòng trong cùng một ô. */
function plain(cell: TableCell): string {
  if (cell === null || cell === undefined) return "";
  return String(cell)
    .replace(/\t+/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();
}

/** Bản text: ô có xuống dòng hoặc dấu `"` được bọc trong `"..."` (nhân đôi `"` bên trong), như Excel / Sheets đọc TSV. */
function tsvCell(cell: TableCell): string {
  const text = plain(cell);
  return /["\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
  return rows.map((row) => row.map(tsvCell).join("\t")).join("\n");
}

/** Bản HTML: số giữ kiểu số (`mso-number-format`) để Excel cộng được, chữ giữ dạng chữ (mã "001" không mất số 0). */
export function toHtmlTable(rows: readonly (readonly TableCell[])[]): string {
  const cell = (value: TableCell) => {
    if (typeof value === "number") {
      return `<td style="mso-number-format:'0'">${value}</td>`;
    }
    // `<br>` kèm `mso-data-placement:same-cell`: Excel xuống dòng trong ô thay vì sang dòng mới (như Alt+Enter).
    const lines = plain(value).split("\n").map(escapeHtml);
    return `<td style="mso-number-format:'\\@'">${lines.join('<br style="mso-data-placement:same-cell">')}</td>`;
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
