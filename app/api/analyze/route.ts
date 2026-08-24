import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { runAxe } from "@/lib/analyzer/axe-analyzer";
import { runCustomRules } from "@/lib/analyzer/custom-rules";
import { buildReport } from "@/lib/analyzer/violation-mapper";
import type { AnalyzerViolation } from "@/lib/analyzer/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { urlSchema, validatePublicUrl } from "@/lib/security/url-validator";
import type { AnalyzeResponse, ApiErrorCode } from "@/types/api";

export const runtime = "nodejs";
export const maxDuration = 45;
function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json<AnalyzeResponse>({ success: false, error: { code, message } }, { status });
}
function browserPath() {
  const configured = process.env.CHROME_PATH?.trim();
  if (configured) return configured;
  return ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
}

export async function POST(request: NextRequest) {
  const remote = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!checkRateLimit(remote)) return errorResponse("RATE_LIMITED", "تعداد درخواست‌ها موقتاً بیش از حد مجاز است.", 429);
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const started = Date.now();
  try {
    const body: unknown = await request.json();
    const parsed = urlSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_URL", "آدرس واردشده معتبر نیست.", 400);
    const validated = await validatePublicUrl(parsed.data.url);
    try {
      browser = await chromium.launch({ headless: true, executablePath: browserPath(), args: ["--no-sandbox", "--disable-dev-shm-usage"] });
    } catch (error) {
      console.error("browser_launch_failed", { duration: Date.now() - started, error });
      return errorResponse("ANALYSIS_FAILED", "تحلیل با خطای غیرمنتظره مواجه شد.", 500);
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: false });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    const loaded = await page.goto(validated.toString(), { waitUntil: "domcontentloaded", timeout: 30_000 });
    const finalUrl = new URL(page.url());
    await validatePublicUrl(finalUrl.toString());
    if (loaded?.headers()["content-disposition"]?.toLowerCase().includes("attachment")) return errorResponse("PAGE_LOAD_FAILED", "بارگذاری صفحه با خطا مواجه شد.", 502);
    await page.waitForTimeout(700);
    const custom = await runCustomRules(page);
    let axe: { violations: AnalyzerViolation[]; passesCount: number; incompleteCount: number } = { violations: [], passesCount: 0, incompleteCount: 1 };
    try { axe = await runAxe(page); } catch (error) { console.error("axe_failed", { duration: Date.now() - started, error }); }
    return NextResponse.json<AnalyzeResponse>({ success: true, data: buildReport(finalUrl.toString(), await page.title(), [...axe.violations, ...custom], axe.passesCount, axe.incompleteCount) });
  } catch (error) {
    console.error("analysis_failed", { duration: Date.now() - started, error });
    const blocked = error instanceof Error && error.message === "BLOCKED_URL";
    return errorResponse(blocked ? "BLOCKED_URL" : "PAGE_LOAD_FAILED", blocked ? "این آدرس به دلایل امنیتی قابل تحلیل نیست." : "بارگذاری صفحه با خطا مواجه شد.", blocked ? 400 : 502);
  } finally {
    await browser?.close();
  }
}
