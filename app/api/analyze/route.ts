import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { runAxe } from "@/lib/analyzer/axe-analyzer";
import { runCustomRules } from "@/lib/analyzer/custom-rules";
import { buildReport } from "@/lib/analyzer/violation-mapper";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { urlSchema, validatePublicUrl } from "@/lib/security/url-validator";
import type { AnalyzeResponse } from "@/types/api";

export const runtime = "nodejs";
export const maxDuration = 45;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<AnalyzeResponse>({ success: false, error: { code, message } }, { status });
}

function getBrowserExecutablePath() {
  const configuredPath = process.env.CHROME_PATH?.trim();
  if (configuredPath) return configuredPath;

  const systemBrowserPaths = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return systemBrowserPaths.find((path) => existsSync(path)) ?? undefined;
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous")) return errorResponse("RATE_LIMITED", "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", 429);
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const body: unknown = await request.json();
    const parsed = urlSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_URL", "آدرس واردشده معتبر نیست.", 400);
    const validated = await validatePublicUrl(parsed.data.url);
    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: getBrowserExecutablePath(),
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-crash-reporter"],
      });
    } catch (browserError) {
      console.error("Browser launch failed", browserError);
      return errorResponse(
        "BROWSER_UNAVAILABLE",
        "مرورگر تحلیل در دسترس نیست. لطفاً Chromium را نصب کنید و دوباره تلاش کنید.",
        503,
      );
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: false });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    const response = await page.goto(validated.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
    const finalUrl = new URL(page.url());
    await validatePublicUrl(finalUrl.toString());
    if (response?.headers()["content-disposition"]?.toLowerCase().includes("attachment")) return errorResponse("PAGE_LOAD_FAILED", "این آدرس به فایل قابل دانلود اشاره می‌کند و قابل تحلیل نیست.", 422);
    await page.waitForTimeout(700);
    const custom = await runCustomRules(page);
    let axe;
    try {
      axe = await runAxe(page);
    } catch (axeError) {
      console.error("axe-core analysis failed", axeError);
      axe = { violations: [], passesCount: 0, incompleteCount: 1 };
    }
    return NextResponse.json<AnalyzeResponse>({ success: true, data: buildReport(finalUrl.toString(), await page.title(), [...axe.violations, ...custom], axe.passesCount, axe.incompleteCount) });
  } catch (error) {
    console.error("Accessibility analysis failed", error);
    const isBlocked = error instanceof Error && error.message === "BLOCKED_URL";
    return errorResponse(
      isBlocked ? "BLOCKED_URL" : "PAGE_LOAD_FAILED",
      isBlocked ? "این آدرس عمومی و مجاز نیست." : "صفحه بارگذاری نشد. آدرس یا دسترسی شبکه را بررسی کنید و دوباره تلاش کنید.",
      isBlocked ? 403 : 422,
    );
  } finally {
    await browser?.close();
  }
}
