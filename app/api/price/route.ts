import { NextResponse } from "next/server";
import { PRICE_PAISE, rupees } from "@/lib/payments";

/** Public: the watermark-removal price, read from the server-only PRICE_PAISE env. */
export async function GET() {
  return NextResponse.json({ paise: PRICE_PAISE, rupees: rupees(PRICE_PAISE) });
}
