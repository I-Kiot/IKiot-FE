/** Chép các dòng vào clipboard để dán vào Excel / Sheets đúng từng ô; gọi trong handler click. */
export type TableCell = string | number | null | undefined;

/** Chuẩn hoá nội dung ô. */
function plain(cell: TableCell): string {
  if (cell === null || cell === undefined) return "";
  return String(cell)
    .replace(/\t+/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim();
}

/** Bản TSV, bọc ô có xuống dòng hoặc dấu `"`. */
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

/** Bản HTML, giữ kiểu số và chữ. */
export function toHtmlTable(rows: readonly (readonly TableCell[])[]): string {
  const cell = (value: TableCell) => {
    if (typeof value === "number") {
      return `<td style="mso-number-format:'0'">${value}</td>`;
    }
    // Xuống dòng trong cùng ô Excel.
    const lines = plain(value).split("\n").map(escapeHtml);
    return `<td style="mso-number-format:'\\@'">${lines.join('<br style="mso-data-placement:same-cell">')}</td>`;
  };
  const body = rows.map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("");
  return `<meta charset="utf-8"><table>${body}</table>`;
}

type Rows = readonly (readonly TableCell[])[];

/** Chép vào clipboard, nhận cả Promise; trả true nếu đã chép. */
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
