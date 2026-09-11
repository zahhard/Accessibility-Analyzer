import { NextRequest, NextResponse } from "next/server";
import { getOwnedAnalysis, ownerCookieName } from "@/lib/export/store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  const { analysisId } = await params;
  const ownerKey = request.cookies.get(ownerCookieName)?.value;
  const report = getOwnedAnalysis(analysisId, ownerKey);

  if (!report)
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "گزارش موردنظر یافت نشد." } },
      { status: 404 },
    );

  return NextResponse.json({ success: true, data: report });
}
