/**
 * Payment helpers. Phase 1 uses a static UPI QR + manual admin unlock.
 * The gateway swap (Razorpay/Cashfree) later only needs to change how an order
 * reaches status "paid" — everything else (orders table, download gating) stays.
 */

// Server-only price (no NEXT_PUBLIC_ prefix → never exposed in the browser bundle).
// The client reads it via GET /api/price instead of inlining it at build time.
export const PRICE_PAISE = Number(process.env.PRICE_PAISE ?? "1000");

/** Watermark printed on free downloads; removed after a paid, approved order. */
export const WATERMARK = "Astrixa Technologies";

export function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

/** sample/local papers are a free, no-auth demo — never gated. */
export function isFreePaperId(id: string): boolean {
  return id === "sample" || id === "local";
}

/**
 * Build a UPI deep link / QR payload.
 * `upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<orderId>`
 */
export function upiLink(opts: {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  note?: string;
  orderId?: string;
}): string {
  const params = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.payeeName,
    am: rupees(opts.amountPaise),
    cu: "INR",
  });
  if (opts.note) params.set("tn", opts.note);
  if (opts.orderId) params.set("tr", opts.orderId);
  return `upi://pay?${params.toString()}`;
}
