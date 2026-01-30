import api from "@/lib/api";

export async function getDocsAnalytics(params: { granularity: "hourly" | "daily" | "monthly"; date?: string; month?: string; year?: string }) {
  const res = await api.get<{ counts: number[]; granularity: string }>("/docs/analytics", { params });
  return res.data;
}
