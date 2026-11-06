import type { NextRequest } from "next/server";
import { json, positiveIntParam, requireApiUser } from "@/lib/api";
import { getReportsSummary } from "@/lib/services/queries";

export const dynamic = "force-dynamic";

// GET /api/reports/summary?rejectionLimit=&historyLimit=
// Status totals, revenue, low-stock categories, rejection reasons, and the
// latest status-log rows — the same numbers the Reports page renders.
export async function GET(request: NextRequest) {
  const guard = await requireApiUser("ADMIN");
  if (guard.response) return guard.response;

  const params = request.nextUrl.searchParams;
  const summary = await getReportsSummary({
    rejectionLimit: positiveIntParam(params.get("rejectionLimit")),
    historyLimit: positiveIntParam(params.get("historyLimit")),
  });

  return json(summary);
}
