import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { z } from "zod";
import {
  createCsv,
  createJson,
  createPrintHtml,
  exportFileName,
} from "@/lib/export/serializers";
import {
  getOwnedAnalysis,
  getReusableExport,
  ownerCookieName,
  saveExport,
  updateExport,
} from "@/lib/export/store";
import type { ExportJob } from "@/lib/export/store";

export const runtime = "nodejs";
const inputSchema = z.object({ format: z.enum(["pdf", "json", "csv"]) });
const browserPath = () =>
  process.env.CHROME_PATH?.trim() ||
  [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].find(existsSync);
const error = (code: string, message: string, status: number) =>
  NextResponse.json({ error: { code, message } }, { status });

async function preparePdf(job: ExportJob, html: string) {
  try {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: browserPath(),
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const content = await page.pdf({
        format: "A4",
        margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate:
          '<div style="font-size:8px;width:100%;text-align:center;color:#64748b">صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></div>',
      });
      updateExport(job.id, {
        status: "ready",
        progress: 100,
        content,
        completedAt: new Date(),
      });
    } finally {
      await browser?.close();
    }
  } catch {
    updateExport(job.id, {
      status: "failed",
      progress: 100,
      errorMessage: "ساخت فایل PDF با خطا مواجه شد.",
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  const ownerKey = request.cookies.get(ownerCookieName)?.value;
  const { analysisId } = await params;
  const report = getOwnedAnalysis(analysisId, ownerKey);
  if (!report || !ownerKey)
    return error("NOT_FOUND", "گزارش موردنظر یافت نشد.", 404);
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return error("INVALID_EXPORT_FORMAT", "فرمت خروجی معتبر نیست.", 400);
  const format = parsed.data.format;
  const existing = getReusableExport(analysisId, ownerKey, format);
  if (existing)
    return NextResponse.json({
      exportId: existing.id,
      format,
      status: existing.status,
      progress: existing.progress,
      downloadUrl:
        existing.status === "ready"
          ? `/api/exports/${existing.id}/download`
          : undefined,
    });
  const job: ExportJob = {
    id: `exp_${randomUUID()}`,
    analysisId,
    ownerKey,
    format,
    status: format === "pdf" ? "processing" : "ready",
    progress: format === "pdf" ? 15 : 100,
    fileName: exportFileName(report, format),
    mimeType:
      format === "pdf"
        ? "application/pdf"
        : format === "json"
          ? "application/json; charset=utf-8"
          : "text/csv; charset=utf-8",
    content: null,
    errorMessage: null,
    createdAt: new Date(),
    completedAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  if (format === "json")
    job.content = new TextEncoder().encode(createJson(report));
  if (format === "csv")
    job.content = new TextEncoder().encode(createCsv(report));
  if (format !== "pdf") job.completedAt = new Date();
  saveExport(job);
  if (format === "pdf") void preparePdf(job, createPrintHtml(report));
  return NextResponse.json(
    {
      exportId: job.id,
      format,
      status: job.status,
      progress: job.progress,
      downloadUrl:
        job.status === "ready" ? `/api/exports/${job.id}/download` : undefined,
    },
    { status: format === "pdf" ? 202 : 201 },
  );
}
