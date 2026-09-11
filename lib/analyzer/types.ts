export type Severity = "critical" | "serious" | "moderate" | "minor";
export type ViolationSource = "axe-core" | "custom";
export type ViewportId = "mobile" | "tablet" | "desktop";
export type ColorScheme = "light" | "dark";
export interface ViewportDefinition {
  id: ViewportId;
  name: string;
  width: number;
  height: number;
}
export const viewportDefinitions: Record<ViewportId, ViewportDefinition> = {
  mobile: { id: "mobile", name: "موبایل", width: 390, height: 844 },
  tablet: { id: "tablet", name: "تبلت", width: 768, height: 1024 },
  desktop: { id: "desktop", name: "دسکتاپ", width: 1440, height: 900 },
};
export interface AnalyzerNode {
  target: string[];
  html: string;
  failureSummary: string;
  screenshot?: string;
  screenshotFallback?: boolean;
}
export interface AnalyzerViolation {
  id: string;
  source: ViolationSource;
  impact: Severity;
  wcag: string[];
  title: string;
  description: string;
  help: string;
  helpUrl?: string;
  nodes: AnalyzerNode[];
  fixSuggestion: string;
  viewportId?: ViewportId;
  colorScheme?: ColorScheme;
}
export interface AnalyzerPass {
  id: string;
  source: ViolationSource;
  wcag: string[];
  title: string;
  description: string;
  helpUrl?: string;
  viewportId?: ViewportId;
  colorScheme?: ColorScheme;
}
export interface AnalysisSummary {
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}
export interface ViewportReport {
  viewport: ViewportDefinition;
  colorScheme: ColorScheme;
  score: number;
  scoreLabel: string;
  issueCount: number;
  passesCount: number;
  incompleteCount: number;
}
export interface AxeCoreReport {
  viewportId: ViewportId;
  colorScheme: ColorScheme;
  result: {
    violations: unknown[];
    passes: unknown[];
    incomplete: unknown[];
    inapplicable: unknown[];
  };
}
export interface AnalysisReport {
  analysisId: string;
  url: string;
  pageTitle: string;
  analyzedAt: string;
  score: number;
  scoreLabel: string;
  summary: AnalysisSummary;
  violations: AnalyzerViolation[];
  positivePoints: AnalyzerPass[];
  passesCount: number;
  incompleteCount: number;
  viewportReports: ViewportReport[];
  axeCoreReports: AxeCoreReport[];
}
