import { Gauge } from "lucide-react";
import type { AnalysisReport } from "@/lib/analyzer/types";
export function ScoreCard({ report }: { report: AnalysisReport }) {
  const color = report.score >= 90 ? "text-emerald-400" : report.score >= 75 ? "text-blue-400" : report.score >= 50 ? "text-yellow-400" : "text-red-400";
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex items-center gap-2 text-sm text-zinc-400"><Gauge size={18} /> امتیاز پیشنهادی</div><div className="mt-5 flex items-center gap-6"><div className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[10px] border-current ${color}`}><div className="text-center"><strong className="block text-4xl">{report.score}</strong><span className="text-xs text-zinc-500">از ۱۰۰</span></div></div><div><p className={`text-2xl font-bold ${color}`}>{report.scoreLabel}</p><p className="mt-2 max-w-md text-sm leading-7 text-zinc-400">این امتیاز یک شاخص پیشنهادی برای ارزیابی اولیه است و جایگزین ارزیابی کامل و انسانی انطباق با استاندارد WCAG نیست.</p></div></div></section>;
}
