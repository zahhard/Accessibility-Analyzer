import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { runAxe } from "@/lib/analyzer/axe-analyzer";
import { runCustomRules } from "@/lib/analyzer/custom-rules";
import { buildReport } from "@/lib/analyzer/violation-mapper";
import { viewportDefinitions } from "@/lib/analyzer/types";
import type {
  AnalyzerViolation,
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
function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json<AnalyzeResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}
function browserPath() {
  const configured = process.env.CHROME_PATH?.trim();
  if (configured) return configured;
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].find(existsSync);
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
      browser = await chromium.launch({
        headless: true,
        executablePath: browserPath(),
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
    } catch (error) {
      console.error("browser_launch_failed", {
        duration: Date.now() - started,
        error,
      });
      return errorResponse(
        "ANALYSIS_FAILED",
        "تحلیل با خطای غیرمنتظره مواجه شد.",
        500,
      );
    }
    const analysisId = `ana_${randomUUID()}`;
    const violations: AnalyzerViolation[] = [];
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
        const loaded = await page.goto(validated.toString(), {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
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
          passesCount: number;
          incompleteCount: number;
        } = { violations: [], passesCount: 0, incompleteCount: 1 };
        try {
          axe = await runAxe(page);
        } catch (error) {
          console.error("axe_failed", {
            duration: Date.now() - started,
            viewportId,
            error,
          });
        }
        const viewportViolations = [...axe.violations, ...custom].map(
          (violation) => ({ ...violation, viewportId }),
        );
        const viewportReport = buildReport(
          analysisId,
          redirectedUrl.toString(),
          await page.title(),
          viewportViolations,
          axe.passesCount,
          axe.incompleteCount,
        );
        violations.push(...viewportViolations);
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
    );
  } finally {
    await browser?.close();
  }
}
