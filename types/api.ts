import type { AnalysisReport } from "@/lib/analyzer/types";
export type AnalyzeResponse =
  | { success: true; data: AnalysisReport }
  | { success: false; error: { code: string; message: string } };
