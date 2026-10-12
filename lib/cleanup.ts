import { prisma } from "@/lib/prisma";

/** Minutes to keep a payment screenshot after the admin approves the order. */
const KEEP_MINUTES = 10;

/**
 * Drop payment screenshots for orders that were approved more than
 * KEEP_MINUTES ago. Called opportunistically from frequently-hit endpoints
 * (admin dashboard + requests page poll) and from a cron route.
 */
export async function purgeApprovedScreenshots(): Promise<number> {
  const cutoff = new Date(Date.now() - KEEP_MINUTES * 60 * 1000);
  const res = await prisma.order.updateMany({
    where: {
      status: "paid",
      screenshotUrl: { not: null },
      paidAt: { lt: cutoff },
    },
    data: { screenshotUrl: null },
  });
  return res.count;
}
