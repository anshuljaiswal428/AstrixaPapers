import { NextResponse } from "next/server";
import { purgeApprovedScreenshots } from "@/lib/cleanup";

/**
 * Purges payment screenshots 10+ minutes after approval.
 * Wire to Vercel Cron (see vercel.json). Protected by CRON_SECRET if set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  const purged = await purgeApprovedScreenshots();
  return NextResponse.json({ ok: true, purged });
}
