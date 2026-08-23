"use client";
import { useMutation } from "@tanstack/react-query";
import type { AnalyzeResponse } from "@/types/api";
export function useAnalysisReport() {
  return useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const result = (await response.json()) as AnalyzeResponse;
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
  });
}
