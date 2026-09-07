import type {
  AnalysisReport,
  AnalyzerViolation,
  AnalyzerPass,
  Severity,
  ViewportReport,
} from "./types";
import { calculateScore } from "./score-calculator";
export function buildReport(
  analysisId: string,
  url: string,
  pageTitle: string,
  violations: AnalyzerViolation[],
  positivePoints: AnalyzerPass[],
  passesCount: number,
  incompleteCount: number,
  viewportReports: ViewportReport[] = [],
): AnalysisReport {
  const summary = (
    ["critical", "serious", "moderate", "minor"] as Severity[]
  ).reduce(
    (result, severity) => {
      result[severity] = violations.filter(
        (item) => item.impact === severity,
      ).length;
      return result;
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<
      Severity,
      number
    >,
  );
  return {
    analysisId,
    url,
    pageTitle,
    analyzedAt: new Date().toISOString(),
    ...calculateScore(violations),
    summary: { ...summary, totalIssues: violations.length },
    violations,
    positivePoints,
    passesCount,
    incompleteCount,
    viewportReports,
  };
}
