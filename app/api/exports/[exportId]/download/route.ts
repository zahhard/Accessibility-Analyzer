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
  if (job.status !== "ready" || !job.content || !job.fileName || !job.mimeType)
    return NextResponse.json(
      {
        error: {
          code: "EXPORT_NOT_READY",
          message: "فایل هنوز آماده دانلود نیست.",
        },
      },
      { status: 409 },
    );
  return new NextResponse(job.content.buffer as ArrayBuffer, {
    headers: {
      "content-type": job.mimeType,
      "content-disposition": `attachment; filename="${job.fileName}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
