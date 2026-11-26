/**
 * Chép một bảng vào clipboard sao cho dán vào Excel / Google Sheets ra đúng từng ô.
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
export function toTsv(header: readonly string[], rows: readonly (readonly TableCell[])[]): string {
  return [header, ...rows].map((row) => row.map(plain).join("\t")).join("\n");
}

/** Bản HTML: số giữ kiểu số (`mso-number-format`) để Excel cộng được, chữ giữ dạng chữ (mã "001" không mất số 0). */
export function toHtmlTable(
  header: readonly string[],
  rows: readonly (readonly TableCell[])[],
): string {
  const cell = (value: TableCell, tag: "td" | "th") => {
    if (typeof value === "number") {
      return `<${tag} style="mso-number-format:'0'">${value}</${tag}>`;
    }
    return `<${tag} style="mso-number-format:'\\@'">${escapeHtml(plain(value))}</${tag}>`;
  };
  const head = `<tr>${header.map((h) => cell(h, "th")).join("")}</tr>`;
  const body = rows.map((row) => `<tr>${row.map((v) => cell(v, "td")).join("")}</tr>`).join("");
  return `<meta charset="utf-8"><table>${head}${body}</table>`;
}

/** `true` nếu đã chép. Trình duyệt không có ClipboardItem (hoặc từ chối HTML) thì chép bản TSV. */
export async function copyTable(
  header: readonly string[],
  rows: readonly (readonly TableCell[])[],
): Promise<boolean> {
  const tsv = toTsv(header, rows);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([toHtmlTable(header, rows)], { type: "text/html" }),
          "text/plain": new Blob([tsv], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    // Rơi xuống bản text bên dưới.
  }
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}
