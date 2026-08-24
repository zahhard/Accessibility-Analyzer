import type { AnalysisReport, AnalyzerViolation } from "@/lib/analyzer/types";
import type { ExportFormat } from "./store";

const priorityWeights = { critical: 92, serious: 70, moderate: 45, minor: 20 } as const;

function safeText(value: string, limit = 1500) { return value.replace(/\u0000/g, "").slice(0, limit); }
function csvCell(value: string | number | boolean) {
  const text = safeText(String(value), 1500);
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}
function safeHost(url: string) { try { return new URL(url).hostname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "report"; } catch { return "report"; } }
function datePart(value: string) { return value.slice(0, 10); }
function issueJson(issue: AnalyzerViolation) {
  return { id: issue.id, ruleId: issue.id, impact: issue.impact, priorityScore: priorityWeights[issue.impact], help: issue.help, descriptionFa: issue.description, wcagTags: issue.wcag, viewports: issue.viewportId ? [issue.viewportId] : [], nodes: issue.nodes.map((node) => ({ target: node.target.map((target) => safeText(target, 500)), html: safeText(node.html), failureSummary: safeText(node.failureSummary), screenshotAvailable: false })) };
}

export function exportFileName(report: AnalysisReport, format: ExportFormat) {
  const prefix = format === "csv" ? "accessibility-issues" : "accessibility-report";
  return `${prefix}-${safeHost(report.url)}-${report.analysisId}-${datePart(report.analyzedAt)}.${format}`;
}

export function createJson(report: AnalysisReport) {
  return JSON.stringify({ schemaVersion: "1.0.0", generatedAt: new Date().toISOString(), report: { analysisId: report.analysisId, url: report.url, status: "completed", analyzerVersion: "1.0.0", axeVersion: "4.x", createdAt: report.analyzedAt, completedAt: report.analyzedAt, score: report.score, summary: report.summary, viewports: report.viewportReports, issues: report.violations.map(issueJson) } }, null, 2);
}

export function createCsv(report: AnalysisReport) {
  const header = ["Analysis ID", "URL", "Analyzed At", "Viewport", "Issue ID", "Rule ID", "Severity", "Priority Score", "WCAG Tags", "Title", "Description", "Help URL", "Node Target", "HTML Snippet", "Failure Summary", "Screenshot Available"];
  const rows = report.violations.flatMap((issue) => issue.nodes.map((node) => [report.analysisId, report.url, report.analyzedAt, issue.viewportId ?? "", issue.id, issue.id, issue.impact, priorityWeights[issue.impact], issue.wcag.join(" "), issue.title, issue.description, issue.helpUrl ?? "", node.target.join(", "), node.html, node.failureSummary, false].map(csvCell).join(",")));
  return `\uFEFF${header.map(csvCell).join(",")}\r\n${rows.join("\r\n")}`;
}

export function createPrintHtml(report: AnalysisReport) {
  const escape = (value: string) => safeText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const severity = (name: string, count: number) => `<div class="severity"><strong>${escape(name)}</strong><span>${count}</span></div>`;
  const issue = (item: AnalyzerViolation) => `<article class="issue"><div class="issue-head"><h3>${escape(item.title)}</h3><span class="badge ${item.impact}">${escape(item.impact)}</span></div><p><b>Rule ID:</b> ${escape(item.id)} · <b>Priority:</b> ${priorityWeights[item.impact]}</p><p><b>WCAG:</b> ${escape(item.wcag.join(", ") || "—")}</p><p>${escape(item.description)}</p><p><b>راهکار:</b> ${escape(item.fixSuggestion)}</p>${item.nodes.map((node) => `<div class="node"><p dir="ltr"><b>Selector:</b> ${escape(node.target.join(", "))}</p><pre dir="ltr">${escape(node.html)}</pre><p>${escape(node.failureSummary)}</p></div>`).join("")}</article>`;
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8" /><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#172033;font-size:12px;line-height:1.8}h1{font-size:26px}h2{font-size:18px;border-bottom:1px solid #cbd5e1;padding-bottom:6px}.meta{color:#475569}.score{font-size:44px;font-weight:800;color:#0f766e}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.severity{border:1px solid #e2e8f0;border-radius:8px;padding:8px;display:flex;justify-content:space-between}.issue{break-inside:avoid;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:14px 0}.issue-head{display:flex;justify-content:space-between;align-items:center}.issue h3{margin:0}.badge{padding:2px 8px;border-radius:99px;background:#f1f5f9}.critical{color:#b91c1c}.serious{color:#c2410c}.moderate{color:#a16207}.minor{color:#1d4ed8}.node{background:#f8fafc;border-radius:6px;padding:8px;margin-top:8px}pre{white-space:pre-wrap;word-break:break-word;font-size:10px;background:white;padding:8px;border:1px solid #e2e8f0}.footer{margin-top:28px;color:#64748b;font-size:10px}</style></head><body><h1>گزارش تحلیل دسترس‌پذیری وب</h1><p class="meta" dir="ltr">${escape(report.url)}</p><p class="meta">شناسه گزارش: ${escape(report.analysisId)} · تاریخ تحلیل: ${escape(new Date(report.analyzedAt).toLocaleString("fa-IR"))}</p><div class="score">${report.score}<small>/100</small></div><h2>خلاصه شدت خطاها</h2><div class="grid">${severity("بحرانی", report.summary.critical)}${severity("جدی", report.summary.serious)}${severity("متوسط", report.summary.moderate)}${severity("جزئی", report.summary.minor)}</div><h2>اندازه‌های بررسی‌شده</h2><ul>${report.viewportReports.map((viewport) => `<li>${escape(viewport.viewport.name)} (${viewport.viewport.width}×${viewport.viewport.height}) — امتیاز ${viewport.score}</li>`).join("")}</ul><h2>جزئیات خطاها</h2>${report.violations.map(issue).join("")}<p class="footer">این گزارش بر اساس تحلیل خودکار WCAG تهیه شده است و جایگزین ممیزی انسانی یا تأیید انطباق حقوقی نیست. · تولیدشده در ${escape(new Date().toLocaleString("fa-IR"))}</p></body></html>`;
}
