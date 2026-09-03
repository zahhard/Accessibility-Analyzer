import { AlertCircle, CircleAlert, Info, ShieldAlert } from "lucide-react";
import type { AnalysisReport, Severity } from "@/lib/analyzer/types";
const items: [Severity, string, typeof AlertCircle, string][] = [
  ["critical", "بحرانی", ShieldAlert, "text-red-600"],
  ["serious", "جدی", AlertCircle, "text-orange-600"],
  ["moderate", "متوسط", CircleAlert, "text-amber-600"],
  ["minor", "جزئی", Info, "text-blue-600"],
];
export function SummaryCards({ report }: { report: AnalysisReport }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([severity, label, Icon, color]) => (
        <div key={severity} className="surface rounded-xl p-4">
          <Icon size={18} className={color} />
          <p className="mt-3 text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {report.summary[severity]}
          </p>
        </div>
      ))}
    </div>
  );
}
