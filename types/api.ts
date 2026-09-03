import type { AnalysisReport, ViewportId } from "@/lib/analyzer/types";
export type ApiErrorCode =
  | "INVALID_URL"
  | "BLOCKED_URL"
  | "RATE_LIMITED"
  | "PAGE_LOAD_FAILED"
  | "ANALYSIS_TIMEOUT"
  | "ANALYSIS_FAILED"
  | "INTERNAL_ERROR";
export type AnalyzeResponse =
  | { success: true; data: AnalysisReport }
  | { success: false; error: { code: ApiErrorCode; message: string } };
export interface AnalyzeRequest {
  url: string;
  viewportIds: ViewportId[];
}
