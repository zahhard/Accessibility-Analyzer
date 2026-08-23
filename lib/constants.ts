export const SEVERITY_WEIGHTS = { critical: 10, serious: 6, moderate: 3, minor: 1 } as const;
export const SEVERITIES = ["critical", "serious", "moderate", "minor"] as const;
export const severityLabels = { critical: "بحرانی", serious: "جدی", moderate: "متوسط", minor: "جزئی" } as const;
export const qualityLabels = [
  { min: 90, label: "عالی" },
  { min: 75, label: "قابل قبول" },
  { min: 50, label: "نیازمند بهبود" },
  { min: 0, label: "ضعیف" },
] as const;
