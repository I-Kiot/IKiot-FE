import client from "./client";

interface UploadResponse {
  success?: boolean;
  message?: string;
  data?: {
    url: string;
  };
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post<UploadResponse>("/uploads", formData, {
    headers: { "Content-Type": undefined },
  });

  const url = response.data?.data?.url;
  if (!url) {
    throw new Error(response.data?.message ?? "Không nhận được URL ảnh");
  }

  return url;
}
