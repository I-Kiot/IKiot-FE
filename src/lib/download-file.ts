/** Lưu một blob tải từ API thành file trên máy người dùng. Chỉ gọi ở client. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Mã lỗi của request tải blob: thân lỗi cũng là Blob nên phải đọc ra JSON. */
export async function blobErrorCode(error: unknown): Promise<string | undefined> {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (!(data instanceof Blob)) return (data as { code?: string } | undefined)?.code
  try {
    return (JSON.parse(await data.text()) as { code?: string }).code
  } catch {
    return undefined
  }
}
