import api from "./api";

export async function createSupportInquiry(payload: {
  teamId: string;
  projectId: string;
  message: string;
}) {
  const res = await api.post("/support/inquiries", payload);
  return res.data;
}
