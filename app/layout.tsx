import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = { title: "تحلیلگر دسترس‌پذیری وب", description: "تحلیل خودکار اولیه دسترس‌پذیری صفحات عمومی وب" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body><Providers>{children}</Providers></body></html>;
}
