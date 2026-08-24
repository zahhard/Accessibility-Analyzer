export type Severity = "critical" | "serious" | "moderate" | "minor";
export type ViolationSource = "axe-core" | "custom";
export type ViewportId = "mobile" | "tablet" | "desktop";
export interface ViewportDefinition { id: ViewportId; name: string; width: number; height: number }
export const viewportDefinitions: Record<ViewportId, ViewportDefinition> = {
  mobile: { id: "mobile", name: "موبایل", width: 390, height: 844 },
  tablet: { id: "tablet", name: "تبلت", width: 768, height: 1024 },
  desktop: { id: "desktop", name: "دسکتاپ", width: 1440, height: 900 },
};
export interface AnalyzerNode { target: string[]; html: string; failureSummary: string }
export interface AnalyzerViolation {
  id: string; source: ViolationSource; impact: Severity; wcag: string[]; title: string;
  description: string; help: string; helpUrl?: string; nodes: AnalyzerNode[]; fixSuggestion: string;
  viewportId?: ViewportId;
}
export interface AnalysisSummary { totalIssues: number; critical: number; serious: number; moderate: number; minor: number }
export interface ViewportReport { viewport: ViewportDefinition; score: number; scoreLabel: string; issueCount: number; passesCount: number; incompleteCount: number }
export interface AnalysisReport {
  analysisId: string; url: string; pageTitle: string; analyzedAt: string; score: number; scoreLabel: string;
  summary: AnalysisSummary; violations: AnalyzerViolation[]; passesCount: number; incompleteCount: number; viewportReports: ViewportReport[];
}
