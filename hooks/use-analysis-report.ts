"use client";
import { useMutation } from "@tanstack/react-query";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/api";

export class AnalysisRequestError extends Error {
  code: string;
  details?: string;

  constructor(code: string, message: string, details?: string) {
    super(message);
    this.name = "AnalysisRequestError";
    this.code = code;
    this.details = details;
  }
}

export function useAnalysisReport() {
  return useMutation({
    mutationFn: async (input: AnalyzeRequest) => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as AnalyzeResponse;
      if (!result.success)
        throw new AnalysisRequestError(
          result.error.code,
          result.error.message,
          result.error.details,
        );
      return result.data;
    },
  });
}
