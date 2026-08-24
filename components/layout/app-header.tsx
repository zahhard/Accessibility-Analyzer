import { Accessibility } from "lucide-react";
export function AppHeader() {
  return <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/15 p-2 text-violet-400"><Accessibility size={24} /></div><div><p className="font-black">تحلیلگر دسترس‌پذیری وب</p><p className="text-xs text-zinc-500">ارزیابی خودکار صفحات عمومی</p></div></div><span className="rounded-full border border-violet-500/30 px-3 py-1 text-xs text-violet-300">WCAG 2.2 AA</span></div></header>;
}
