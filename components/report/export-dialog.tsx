"use client";
import { Braces, FileText, LoaderCircle, Table2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnalysisReport } from "@/lib/analyzer/types";

type ExportFormat = "pdf" | "json" | "csv";
type ExportState = "idle" | "processing" | "ready" | "failed" | "expired";
const options: { format: ExportFormat; title: string; description: string; Icon: typeof FileText }[] = [
  { format: "pdf", title: "گزارش PDF", description: "نسخه رسمی و قابل چاپ گزارش دسترس‌پذیری", Icon: FileText },
  { format: "json", title: "داده JSON", description: "خروجی ساخت‌یافته برای استفاده فنی و API", Icon: Braces },
  { format: "csv", title: "جدول CSV", description: "فهرست خطاها برای Excel و تحلیل داده", Icon: Table2 },
];

export function ExportDialog({ report }: { report: AnalysisReport }) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<ExportFormat, ExportState>>({ pdf: "idle", json: "idle", csv: "idle" });
  const [message, setMessage] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const download = (url: string) => { const link = document.createElement("a"); link.href = url; link.download = ""; document.body.appendChild(link); link.click(); link.remove(); };
  const checkStatus = async (exportId: string, format: ExportFormat) => {
    const response = await fetch(`/api/exports/${exportId}`, { cache: "no-store" });
    const result = await response.json() as { status?: ExportState; downloadUrl?: string; error?: string };
    if (!response.ok || result.status === "failed" || result.status === "expired") { setStates((current) => ({ ...current, [format]: "failed" })); setMessage(result.error || "ساخت خروجی با خطا مواجه شد. لطفاً دوباره تلاش کنید."); return; }
    if (result.status === "ready" && result.downloadUrl) { setStates((current) => ({ ...current, [format]: "ready" })); setMessage("فایل آماده دانلود است."); download(result.downloadUrl); return; }
    window.setTimeout(() => { void checkStatus(exportId, format); }, 900);
  };
  const createExport = async (format: ExportFormat) => {
    setStates((current) => ({ ...current, [format]: "processing" })); setMessage("");
    try {
      const response = await fetch(`/api/analyses/${report.analysisId}/exports`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }) });
      const result = await response.json() as { exportId?: string; status?: ExportState; downloadUrl?: string; error?: { message?: string } };
      if (!response.ok || !result.exportId || !result.status) throw new Error(result.error?.message || "ساخت خروجی با خطا مواجه شد.");
      if (result.status === "ready" && result.downloadUrl) { setStates((current) => ({ ...current, [format]: "ready" })); setMessage("فایل آماده دانلود است."); download(result.downloadUrl); return; }
      await checkStatus(result.exportId, format);
    } catch (error) { setStates((current) => ({ ...current, [format]: "failed" })); setMessage(error instanceof Error ? error.message : "ساخت خروجی با خطا مواجه شد. لطفاً دوباره تلاش کنید."); }
  };
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return <><button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"><FileText size={16} /> خروجی گرفتن</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="export-title" className="text-lg font-black text-slate-900">خروجی گرفتن از گزارش</h2><p className="mt-1 text-sm text-slate-500">فرمت موردنظر را انتخاب کنید.</p></div><button type="button" onClick={close} aria-label="بستن پنجره خروجی" className="focus-ring rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button></div><div className="mt-5 space-y-3">{options.map(({ format, title, description, Icon }) => { const state = states[format]; return <div key={format} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="rounded-lg bg-white p-2 text-teal-700 shadow-sm"><Icon size={20} /></span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{description}</p></div><button type="button" disabled={state === "processing"} onClick={() => void createExport(format)} className="focus-ring shrink-0 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50 disabled:cursor-wait disabled:opacity-70">{state === "processing" ? <span className="flex items-center gap-1"><LoaderCircle size={14} className="animate-spin" /> آماده‌سازی</span> : state === "failed" ? "تلاش دوباره" : "دانلود"}</button></div>; })}</div>{message && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${message === "فایل آماده دانلود است." ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}>{message}</p>}</div></div>}</>;
}
