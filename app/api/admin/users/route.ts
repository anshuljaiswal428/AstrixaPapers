import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";

/** List every registered user with quick counts for the admin dashboard. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { papers: true, orders: true } },
      orders: { where: { status: "paid" }, select: { amount: true } },
    },
  });

  const users = rows.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    papers: u._count.papers,
    orders: u._count.orders,
    paidOrders: u.orders.length,
    totalPaid: u.orders.reduce((n, o) => n + o.amount, 0),
  }));

  return NextResponse.json({ users });
}
