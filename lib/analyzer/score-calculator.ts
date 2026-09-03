import type { AnalyzerViolation, Severity } from "./types";
const weights: Record<Severity, number> = {
  critical: 10,
  serious: 6,
  moderate: 3,
  minor: 1,
};
export function calculateScore(violations: AnalyzerViolation[]) {
  const penalty = violations.reduce(
    (sum, item) => sum + weights[item.impact] * item.nodes.length,
    0,
  );
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const scoreLabel =
    score >= 90
      ? "عالی"
      : score >= 75
        ? "قابل قبول"
        : score >= 50
          ? "نیازمند بهبود"
          : "ضعیف";
  return { score, scoreLabel };
}
