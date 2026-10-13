import { NextResponse } from "next/server";

/**
 * Screenshots are now retained until an admin deletes them manually from the
 * dashboard, so this cron no longer purges anything. The endpoint is kept so
 * the Vercel Cron schedule (vercel.json) still resolves.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  return NextResponse.json({ ok: true, purged: 0 });
}
