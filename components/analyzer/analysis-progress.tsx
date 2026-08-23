import { Check, LoaderCircle } from "lucide-react";
export function AnalysisProgress() {
  return <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="mb-4 text-sm font-semibold">در حال تحلیل صفحه…</p><div className="grid gap-3 sm:grid-cols-2">{["اعتبارسنجی آدرس", "بارگذاری صفحه", "تحلیل معیارهای دسترس‌پذیری", "محاسبه امتیاز و تولید گزارش"].map((item, i) => <div key={item} className="flex items-center gap-3 text-sm text-zinc-300"><span className={`rounded-full p-1 ${i === 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-300"}`}>{i === 0 ? <Check size={14} /> : <LoaderCircle className="animate-spin" size={14} />}</span>{item}</div>)}</div></div>;
}
