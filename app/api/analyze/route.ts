import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { runAxe } from "@/lib/analyzer/axe-analyzer";
import { runCustomRules } from "@/lib/analyzer/custom-rules";
import { buildReport } from "@/lib/analyzer/violation-mapper";
import { viewportDefinitions } from "@/lib/analyzer/types";
import type {
  AnalyzerViolation,
  AnalyzerPass,
  ViewportId,
  ViewportReport,
} from "@/lib/analyzer/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAnalysisRecord, ownerCookieName } from "@/lib/export/store";
import { urlSchema, validatePublicUrl } from "@/lib/security/url-validator";
import type { AnalyzeResponse, ApiErrorCode } from "@/types/api";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 45;
function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: string,
) {
  return NextResponse.json<AnalyzeResponse>(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) return "خطای ناشناخته در سرویس تحلیل رخ داد.";
  const message = error.message.toLowerCase();
  if (message.includes("timeout"))
    return "زمان انتظار برای بارگذاری صفحه تمام شد. ممکن است سایت کند باشد یا پاسخ ندهد.";
  if (message.includes("econnreset") || message.includes("connection reset"))
    return "ارتباط با سایت در میانه‌ی بارگذاری قطع شد.";
  if (message.includes("enotfound") || message.includes("name_not_resolved"))
    return "دامنه‌ی سایت پیدا نشد. آدرس و وضعیت DNS را بررسی کنید.";
  if (message.includes("ssl") || message.includes("certificate"))
    return "گواهی امنیتی سایت معتبر نیست یا اتصال HTTPS برقرار نشد.";
  if (message.includes("net::err"))
    return `مرورگر نتوانست صفحه را بارگذاری کند (${error.message}).`;
  return `مرورگر هنگام بارگذاری صفحه خطا داد (${error.message}).`;
}
function browserPaths() {
  const configured = process.env.CHROME_PATH?.trim();
  if (configured) return [configured];
  return [
    undefined,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((path) => path === undefined || existsSync(path));
}

async function attachNodeScreenshots(
  page: import("playwright").Page,
  violations: AnalyzerViolation[],
) {
  await Promise.all(
    violations.map(async (violation) => {
      await Promise.all(
        violation.nodes.map(async (node) => {
          const selector = node.target[0];
          if (!selector) return;
          try {
            const element = page.locator(selector).first();
            await element.scrollIntoViewIfNeeded({ timeout: 2_000 });
            const image = await element.screenshot({
              type: "jpeg",
              quality: 60,
              animations: "disabled",
            });
            node.screenshot = `data:image/jpeg;base64,${image.toString("base64")}`;
          } catch {
            // Some axe selectors point into shadow DOM or to an element that
            // disappeared after the scan; the textual finding remains available.
          }
        }),
      );
    }),
  );
}

async function launchBrowser() {
  let lastError: unknown;
  for (const executablePath of browserPaths()) {
    try {
      return await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-crashpad",
        ],
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("No usable Chromium executable was found.");
}

export async function POST(request: NextRequest) {
  const remote =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  if (!checkRateLimit(remote))
    return errorResponse(
      "RATE_LIMITED",
      "تعداد درخواست‌ها موقتاً بیش از حد مجاز است.",
      429,
    );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const started = Date.now();
  try {
    const body: unknown = await request.json();
    const parsed = urlSchema.safeParse(body);
    if (!parsed.success)
      return errorResponse("INVALID_URL", "آدرس واردشده معتبر نیست.", 400);
    const validated = await validatePublicUrl(parsed.data.url);
    try {
      browser = await launchBrowser();
    } catch (error) {
      console.error("browser_launch_failed", {
        duration: Date.now() - started,
        error,
      });
      return errorResponse(
        "ANALYSIS_FAILED",
        "تحلیل با خطای غیرمنتظره مواجه شد.",
        500,
        "مرورگر تحلیل قابل راه‌اندازی نیست. گزارش سرور: " + errorDetails(error),
      );
    }
    const analysisId = `ana_${randomUUID()}`;
    const violations: AnalyzerViolation[] = [];
    const positivePoints: AnalyzerPass[] = [];
    const viewportReports: ViewportReport[] = [];
    let pageTitle = "";
    let finalUrl = validated.toString();
    let passesCount = 0;
    let incompleteCount = 0;
    const selectedViewports = [
      ...new Set(parsed.data.viewportIds),
    ] as ViewportId[];
    for (const viewportId of selectedViewports) {
      const viewport = viewportDefinitions[viewportId];
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        acceptDownloads: false,
      });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(30_000);
        let loaded;
        try {
          loaded = await page.goto(validated.toString(), {
            waitUntil: "domcontentloaded",
            timeout: 30_000,
          });
        } catch (error) {
          console.error("page_load_failed", { viewportId, error });
          return errorResponse(
            "PAGE_LOAD_FAILED",
            "بارگذاری صفحه با خطا مواجه شد.",
            502,
            errorDetails(error),
          );
        }
        const redirectedUrl = new URL(page.url());
        await validatePublicUrl(redirectedUrl.toString());
        if (
          loaded
            ?.headers()
            ["content-disposition"]?.toLowerCase()
            .includes("attachment")
        )
          return errorResponse(
            "PAGE_LOAD_FAILED",
            "بارگذاری صفحه با خطا مواجه شد.",
            502,
          );
        await page.waitForTimeout(500);
        const custom = await runCustomRules(page);
        let axe: {
          violations: AnalyzerViolation[];
          positivePoints: AnalyzerPass[];
          passesCount: number;
          incompleteCount: number;
        } = { violations: [], positivePoints: [], passesCount: 0, incompleteCount: 1 };
        try {
          axe = await runAxe(page);
          console.log("axe", axe);
          
        } catch (error) {
          console.error("axe_failed", {
            duration: Date.now() - started,
            viewportId,
            error,
          });
        }
        const viewportViolations = [...axe.violations, ...custom.violations].map(
          (violation) => ({ ...violation, viewportId }),
        );
        await attachNodeScreenshots(page, viewportViolations);
        const viewportPositivePoints = [
          ...axe.positivePoints,
          ...custom.positivePoints,
        ].map((point) => ({
          ...point,
          viewportId,
        }));
        const viewportReport = buildReport(
          analysisId,
          redirectedUrl.toString(),
          await page.title(),
          viewportViolations,
          viewportPositivePoints,
          axe.passesCount,
          axe.incompleteCount,
        );
        console.log("viewportReport", viewportReport);
        
        violations.push(...viewportViolations);
        positivePoints.push(...viewportPositivePoints);
        viewportReports.push({
          viewport,
          score: viewportReport.score,
          scoreLabel: viewportReport.scoreLabel,
          issueCount: viewportViolations.length,
          passesCount: axe.passesCount,
          incompleteCount: axe.incompleteCount,
        });
        passesCount += axe.passesCount;
        incompleteCount += axe.incompleteCount;
        finalUrl = redirectedUrl.toString();
        pageTitle ||= await page.title();
      } finally {
        await context.close();
      }
    }
    const report = buildReport(
      analysisId,
      finalUrl,
      pageTitle,
      violations,
      positivePoints,
      passesCount,
      incompleteCount,
      viewportReports,
    );
    const ownerKey =
      request.cookies.get(ownerCookieName)?.value ?? randomUUID();
    createAnalysisRecord(report, ownerKey);
    const response = NextResponse.json<AnalyzeResponse>({
      success: true,
      data: report,
    });
    if (!request.cookies.get(ownerCookieName)?.value)
      response.cookies.set(ownerCookieName, ownerKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    return response;
  } catch (error) {
    console.error("analysis_failed", { duration: Date.now() - started, error });
    const blocked = error instanceof Error && error.message === "BLOCKED_URL";
    return errorResponse(
      blocked ? "BLOCKED_URL" : "PAGE_LOAD_FAILED",
      blocked
        ? "این آدرس به دلایل امنیتی قابل تحلیل نیست."
        : "بارگذاری صفحه با خطا مواجه شد.",
      blocked ? 400 : 502,
      blocked ? "آدرس یا یکی از تغییرمسیرهای آن به یک مقصد داخلی یا غیرمجاز اشاره می‌کند." : errorDetails(error),
    );
  } finally {
    await browser?.close();
  }
}
