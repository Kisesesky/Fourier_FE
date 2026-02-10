// lib/uploads.ts
import api from "./api";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/files/upload/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.url;
}
