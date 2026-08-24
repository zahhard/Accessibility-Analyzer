import type { AnalysisReport, AnalyzerViolation, Severity } from "./types";
import { calculateScore } from "./score-calculator";
export function buildReport(url: string, pageTitle: string, violations: AnalyzerViolation[], passesCount: number, incompleteCount: number): AnalysisReport {
  const summary = (["critical", "serious", "moderate", "minor"] as Severity[]).reduce((result, severity) => {
    result[severity] = violations.filter((item) => item.impact === severity).length; return result;
  }, { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<Severity, number>);
  return { url, pageTitle, analyzedAt: new Date().toISOString(), ...calculateScore(violations),
    summary: { ...summary, totalIssues: violations.length }, violations, passesCount, incompleteCount };
}
