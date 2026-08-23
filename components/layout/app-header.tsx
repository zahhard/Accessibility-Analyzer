import Link from "next/link";
import { ScanSearch } from "lucide-react";
export function AppHeader() {
  return <header className="border-b border-zinc-800 bg-zinc-950/80"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="focus-ring flex items-center gap-3"><span className="rounded-xl bg-violet-500/15 p-2 text-violet-400"><ScanSearch size={22} /></span><span><span className="block text-sm font-bold">تحلیل‌گر دسترس‌پذیری وب</span><span className="block text-xs text-zinc-500">WCAG 2.2 · WAI-ARIA</span></span></Link><span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">WCAG 2.2 AA</span></div></header>;
}
