import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/adminAuth";
import { paperTotalMarks } from "@/lib/paper/types";
import type { PaperDoc } from "@/lib/paper/types";

/** Full profile for one user: account info + every paper and order. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      papers: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          className: true,
          subject: true,
          createdAt: true,
          updatedAt: true,
          doc: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          format: true,
          amount: true,
          status: true,
          utr: true,
          createdAt: true,
          paidAt: true,
          paper: { select: { title: true } },
        },
      },
    },
  });

  if (!u) return NextResponse.json({ error: "not found" }, { status: 404 });

  const papers = u.papers.map((p) => {
    const doc = p.doc as unknown as PaperDoc;
    const questions = doc.sections?.reduce((n, s) => n + (s.questions?.length ?? 0), 0) ?? 0;
    return {
      id: p.id,
      title: p.title,
      className: p.className,
      subject: p.subject,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      sections: doc.sections?.length ?? 0,
      questions,
      marks: paperTotalMarks(doc),
    };
  });

  const totalPaid = u.orders
    .filter((o) => o.status === "paid")
    .reduce((n, o) => n + o.amount, 0);

  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      image: u.image,
      createdAt: u.createdAt,
      totalPaid,
      papers,
      orders: u.orders,
    },
  });
}
