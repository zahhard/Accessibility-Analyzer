import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const vazir = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn" });
export const metadata: Metadata = { title: "تحلیل‌گر دسترس‌پذیری وب", description: "ارزیابی اولیه صفحات وب بر پایه WCAG 2.2 و WAI-ARIA" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body className={vazir.variable}><Providers>{children}</Providers></body></html>;
}
