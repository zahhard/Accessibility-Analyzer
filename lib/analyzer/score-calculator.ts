import { qualityLabels, SEVERITY_WEIGHTS } from "@/lib/constants";
import type { AnalyzerViolation } from "./types";
export function calculateScore(violations: AnalyzerViolation[]) {
  const penalty = violations.reduce((sum, item) => sum + SEVERITY_WEIGHTS[item.impact] * item.nodes.length, 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return { score, scoreLabel: qualityLabels.find((item) => score >= item.min)?.label ?? "ضعیف" };
}
