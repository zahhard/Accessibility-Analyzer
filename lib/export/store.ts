import "server-only";
import type { AnalysisReport } from "@/lib/analyzer/types";

export const ownerCookieName = "accessibility-owner";
export type ExportFormat = "pdf" | "json" | "csv";
export type ExportStatus = "processing" | "ready" | "failed" | "expired";

export interface ExportJob {
  id: string;
  analysisId: string;
  ownerKey: string;
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  fileName: string | null;
  mimeType: string | null;
  content: Uint8Array | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
}

interface AnalysisRecord { report: AnalysisReport; ownerKey: string; expiresAt: Date }
const analyses = new Map<string, AnalysisRecord>();
const exportsById = new Map<string, ExportJob>();

function removeExpired() {
  const now = Date.now();
  for (const [id, record] of analyses) if (record.expiresAt.getTime() <= now) analyses.delete(id);
  for (const [id, job] of exportsById) if (job.expiresAt.getTime() <= now) exportsById.set(id, { ...job, status: "expired", content: null });
}

export function createAnalysisRecord(report: AnalysisReport, ownerKey: string) {
  removeExpired();
  analyses.set(report.analysisId, { report, ownerKey, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
}

export function getOwnedAnalysis(analysisId: string, ownerKey: string | undefined): AnalysisReport | null {
  removeExpired();
  const record = analyses.get(analysisId);
  return record && ownerKey && record.ownerKey === ownerKey ? record.report : null;
}

export function getReusableExport(analysisId: string, ownerKey: string, format: ExportFormat): ExportJob | null {
  removeExpired();
  for (const job of exportsById.values()) if (job.analysisId === analysisId && job.ownerKey === ownerKey && job.format === format && (job.status === "ready" || job.status === "processing")) return job;
  return null;
}

export function saveExport(job: ExportJob) { exportsById.set(job.id, job); }

export function updateExport(id: string, update: Partial<ExportJob>) {
  const job = exportsById.get(id);
  if (!job) return null;
  const next = { ...job, ...update };
  exportsById.set(id, next);
  return next;
}

export function getOwnedExport(exportId: string, ownerKey: string | undefined): ExportJob | null {
  removeExpired();
  const job = exportsById.get(exportId);
  return job && ownerKey && job.ownerKey === ownerKey ? job : null;
}
