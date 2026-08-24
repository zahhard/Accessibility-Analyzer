import { Check, LoaderCircle } from "lucide-react";
export function AnalysisProgress() {
  const steps = ["اعتبارسنجی آدرس", "بارگذاری صفحه", "تحلیل معیارها", "محاسبه امتیاز"];
  return <div role="status" aria-live="polite" className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="mb-4 text-sm font-semibold">در حال تحلیل صفحه…</p><div className="grid gap-3 sm:grid-cols-2">{steps.map((step, i) => <div key={step} className="flex items-center gap-3 text-sm text-zinc-300"><span className={`rounded-full p-1 ${i === 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-300"}`}>{i === 0 ? <Check size={14} /> : <LoaderCircle className="animate-spin" size={14} />}</span>{step}</div>)}</div></div>;
}
