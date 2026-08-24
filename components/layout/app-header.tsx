import { Accessibility } from "lucide-react";
export function AppHeader() {
  return <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-50 p-2 text-teal-700"><Accessibility size={23} /></div><div><p className="font-black tracking-tight text-slate-900">دیدبان دسترس‌پذیری</p><p className="text-xs text-slate-500">ارزیابی سریع صفحات عمومی</p></div></div><span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">WCAG 2.2 · AA</span></div></header>;
}
