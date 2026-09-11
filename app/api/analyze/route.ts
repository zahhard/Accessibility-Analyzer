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
  ColorScheme,
  AxeCoreReport,
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

async function detectAntiBotPage(page: import("playwright").Page) {
  const content = await page.evaluate(() =>
    `${document.title}\n${document.body?.innerText ?? ""}`.toLowerCase(),
  );
  const indicators = [
    "just a moment",
    "checking your browser",
    "verify you are human",
    "enable javascript and cookies to continue",
    "attention required! | cloudflare",
    "ray id",
    "403 forbidden",
    "access denied",
    "دسترسی ممنوع",
  ];
  return indicators.find((indicator) => content.includes(indicator));
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
  let fallbackScreenshot: string | undefined;
  const getFallbackScreenshot = async () => {
    if (!fallbackScreenshot) {
      const image = await page.screenshot({
        type: "jpeg",
        quality: 45,
        fullPage: false,
      });
      fallbackScreenshot = `data:image/jpeg;base64,${image.toString("base64")}`;
    }
    return fallbackScreenshot;
  };

  for (const violation of violations) {
    for (const node of violation.nodes) {
      let captured = false;
      for (const selector of node.target) {
        if (!selector) continue;
        try {
          const element = page.locator(selector).first();
          await element.waitFor({ state: "visible", timeout: 1_000 });
          await element.scrollIntoViewIfNeeded({ timeout: 2_000 });
          let image: Buffer;
          try {
            image = await element.screenshot({
              type: "jpeg",
              quality: 60,
              animations: "disabled",
            });
          } catch {
            const box = await element.boundingBox();
            if (!box || box.width < 1 || box.height < 1) continue;
            image = await page.screenshot({
              type: "jpeg",
              quality: 60,
              clip: {
                x: Math.max(0, box.x),
                y: Math.max(0, box.y),
                width: Math.min(box.width, 1600),
                height: Math.min(box.height, 1200),
              },
            });
          }
          node.screenshot = `data:image/jpeg;base64,${image.toString("base64")}`;
          captured = true;
          break;
        } catch {
          // Try the next selector. The textual finding remains available if
          // the element is dynamic or disappears after the scan.
        }
      }
      if (!captured) {
        try {
          node.screenshot = await getFallbackScreenshot();
          node.screenshotFallback = true;
        } catch {
          // Keep the textual finding if the browser cannot capture images.
        }
      }
    }
  }
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
    const axeCoreReports: AxeCoreReport[] = [];
    let pageTitle = "";
    let finalUrl = validated.toString();
    let passesCount = 0;
    let incompleteCount = 0;
    const selectedViewports = [
      ...new Set(parsed.data.viewportIds),
    ] as ViewportId[];
    const colorSchemes: ColorScheme[] = ["light", "dark"];
    for (const colorScheme of colorSchemes) {
      for (const viewportId of selectedViewports) {
      const viewport = viewportDefinitions[viewportId];
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme,
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
        if (loaded?.status() === 401 || loaded?.status() === 403) {
          return errorResponse(
            "ANTI_BOT_BLOCKED",
            "سایت دسترسی تحلیل‌گر را رد کرد.",
            502,
            `سرور سایت پاسخ HTTP ${loaded.status()} برگرداند؛ بنابراین screenshotها مربوط به صفحه‌ی خطا هستند، نه محتوای اصلی سایت.`,
          );
        }
        // Give client-side applications and anti-bot challenges time to finish
        // before inspecting the DOM. A challenge page must never become a
        // misleading accessibility report.
        await page.waitForTimeout(1_500);
        await page.waitForLoadState("networkidle", { timeout: 4_000 }).catch(() => undefined);
        const antiBotIndicator = await detectAntiBotPage(page);
        if (antiBotIndicator) {
          console.warn("anti_bot_page_detected", {
            viewportId,
            indicator: antiBotIndicator,
            url: page.url(),
          });
          return errorResponse(
            "ANTI_BOT_BLOCKED",
            "صفحه توسط سیستم ضدربات یا Cloudflare قابل دسترسی نیست.",
            502,
            "به‌جای کد اصلی سایت، صفحه‌ی بررسی امنیتی دریافت شد. تحلیل را پس از رفع چالش یا با دسترسی مجاز دوباره انجام دهید.",
          );
        }
        const custom = await runCustomRules(page);
        let axe: Awaited<ReturnType<typeof runAxe>>;
        try {
          axe = await runAxe(page);
        } catch (error) {
          console.error("axe_failed", {
            duration: Date.now() - started,
            viewportId,
            error,
          });
          return errorResponse(
            "ANALYSIS_FAILED",
            "اجرای موتور تحلیل axe-core ناموفق بود.",
            500,
            error instanceof Error ? error.message : "خطای ناشناخته در axe-core رخ داد.",
          );
        }
        const viewportViolations = [...axe.violations, ...custom.violations].map(
          (violation) => ({ ...violation, viewportId, colorScheme }),
        );
        await attachNodeScreenshots(page, viewportViolations);
        const viewportPositivePoints = [
          ...axe.positivePoints,
          ...custom.positivePoints,
        ].map((point) => ({
          ...point,
          viewportId,
          colorScheme,
        }));
        axeCoreReports.push({
          viewportId,
          colorScheme,
          result: axe.rawResult,
        });
        const viewportReport = buildReport(
          analysisId,
          redirectedUrl.toString(),
          await page.title(),
          viewportViolations,
          viewportPositivePoints,
          axe.passesCount,
          axe.incompleteCount,
        );
        violations.push(...viewportViolations);
        positivePoints.push(...viewportPositivePoints);
        viewportReports.push({
          viewport,
          colorScheme,
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
      axeCoreReports,
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
