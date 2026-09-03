import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const peyda = localFont({
  src: "./fonts/PeydaWebFaNum-Regular.woff",
  weight: "400",
  style: "normal",
  variable: "--font-peyda",
});

export const metadata: Metadata = { title: "تحلیلگر دسترس‌پذیری وب", description: "تحلیل خودکار اولیه دسترس‌پذیری صفحات عمومی وب" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body className={peyda.variable}><Providers>{children}</Providers></body></html>;
}
