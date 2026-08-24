export type Severity = "critical" | "serious" | "moderate" | "minor";
export type ViolationSource = "axe-core" | "custom";
export interface AnalyzerNode { target: string[]; html: string; failureSummary: string }
export interface AnalyzerViolation {
  id: string; source: ViolationSource; impact: Severity; wcag: string[]; title: string;
  description: string; help: string; helpUrl?: string; nodes: AnalyzerNode[]; fixSuggestion: string;
}
export interface AnalysisSummary { totalIssues: number; critical: number; serious: number; moderate: number; minor: number }
export interface AnalysisReport {
  url: string; pageTitle: string; analyzedAt: string; score: number; scoreLabel: string;
  summary: AnalysisSummary; violations: AnalyzerViolation[]; passesCount: number; incompleteCount: number;
}
