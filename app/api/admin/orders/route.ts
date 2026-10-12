import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";
import { purgeApprovedScreenshots } from "@/lib/cleanup";

/** List orders for the admin dashboard. Shows submitted + approved requests first. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await purgeApprovedScreenshots();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, phone: true } },
      paper: { select: { title: true } },
    },
  });
  return NextResponse.json({ orders });
}
