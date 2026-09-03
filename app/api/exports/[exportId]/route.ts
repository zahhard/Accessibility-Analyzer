import { NextRequest, NextResponse } from "next/server";
import { getOwnedExport, ownerCookieName } from "@/lib/export/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exportId: string }> },
) {
  const { exportId } = await params;
  const job = getOwnedExport(
    exportId,
    request.cookies.get(ownerCookieName)?.value,
  );
  if (!job)
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "خروجی موردنظر یافت نشد." } },
      { status: 404 },
    );
  return NextResponse.json({
    exportId: job.id,
    format: job.format,
    status: job.status,
    progress: job.progress,
    downloadUrl:
      job.status === "ready" ? `/api/exports/${job.id}/download` : undefined,
    error: job.errorMessage ?? undefined,
  });
}
