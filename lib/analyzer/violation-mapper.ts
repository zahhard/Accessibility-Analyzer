import type { AnalyzerViolation, AnalysisReport } from "./types";
import { calculateScore } from "./score-calculator";
export function buildReport(url: string, pageTitle: string, violations: AnalyzerViolation[], passesCount: number, incompleteCount: number): AnalysisReport {
  const summary = { totalIssues: violations.reduce((sum, item) => sum + item.nodes.length, 0), critical: 0, serious: 0, moderate: 0, minor: 0 };
  violations.forEach((item) => { summary[item.impact] += item.nodes.length; });
  return { url, pageTitle, analyzedAt: new Date().toISOString(), ...calculateScore(violations), summary, violations, passesCount, incompleteCount };
}
