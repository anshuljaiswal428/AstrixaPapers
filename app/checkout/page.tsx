"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { downloadPaper } from "@/lib/clientExport";
import { PRICE_PAISE, rupees, upiLink, isFreePaperId } from "@/lib/payments";

type Order = { id: string; status: string; amount: number; format: string };

function Checkout() {
  const sp = useSearchParams();
  const router = useRouter();
  const paperId = sp.get("paper") ?? "";
  const format = (sp.get("format") === "DOCX" ? "DOCX" : "PDF") as "PDF" | "DOCX";

  const free = isFreePaperId(paperId);
  const [order, setOrder] = useState<Order | null>(null);
  const [qr, setQr] = useState<string>("");
  const [utr, setUtr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const submitUtr = useCallback(async () => {
    if (!order) return;
    if (!utr.trim()) {
      setMsg("Please enter your UPI transaction ID.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      // Take them to their requests after a moment so they can track approval.
      setTimeout(() => router.push("/orders"), 2200);
    } catch {
      setMsg("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [order, utr, router]);

  const vpa = process.env.NEXT_PUBLIC_UPI_VPA ?? "yourname@okaxis";
  const payee = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Question Paper Builder";

  const doDownload = useCallback(
    async (watermark: boolean) => {
      setBusy(true);
      setMsg("Preparing your download…");
      try {
        await downloadPaper(paperId, format, watermark);
        setMsg("Done! Check your downloads / new tab.");
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [paperId, format],
  );

  // Free demo: skip payment entirely.
  useEffect(() => {
    if (free) return;
    (async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, format }),
        });
        if (res.status === 401) {
          setNeedsLogin(true);
          setMsg("Your session has expired — please sign in again to continue.");
          return;
        }
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setMsg(
            d.error
              ? `Could not start checkout: ${d.error}`
              : `Could not start checkout (error ${res.status}).`,
          );
          return;
        }
        const data = (await res.json()) as { order?: Order };
        if (data.order) {
          setOrder(data.order);
          const link = upiLink({
            vpa,
            payeeName: payee,
            amountPaise: data.order.amount,
            note: `Paper ${paperId}`,
            orderId: data.order.id,
          });
          setQr(await QRCode.toDataURL(link, { width: 240 }));
        } else {
          setMsg("Could not start checkout.");
        }
      } catch (e) {
        setMsg(`Could not start checkout: ${(e as Error).message}`);
      }
    })();
  }, [free, paperId, format, vpa, payee]);

  // Poll for admin/gateway confirmation.
  useEffect(() => {
    if (free || !order || order.status === "paid") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = (await res.json()) as { order: Order };
        setOrder(data.order);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [free, order]);

  if (free) {
    return (
      <Shell backHref={`/editor/${paperId}`}>
        <h1 className="text-xl font-semibold">Free demo download</h1>
        <p className="mt-2 text-stone-600">
          This is a sample/demo paper — download it free (watermarked) to try the export.
        </p>
        <button
          onClick={() => doDownload(true)}
          disabled={busy}
          className="mt-4 rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Download {format}
        </button>
        {msg && <p className="mt-3 text-sm text-stone-500">{msg}</p>}
      </Shell>
    );
  }

  const paid = order?.status === "paid";

  return (
    <>
    <Shell backHref={`/editor/${paperId}`}>
      <h1 className="text-xl font-semibold">Download {format}</h1>
      {msg && <p className="mt-2 text-sm text-amber-700">{msg}</p>}
      {needsLogin && (
        <a
          href={`/login?callbackUrl=/checkout?paper=${paperId}%26format=${format}`}
          className="mt-2 inline-block text-sm text-indigo-700 underline"
        >
          Sign in again →
        </a>
      )}

      {needsLogin ? null : !order ? (
        <p className="mt-3 text-stone-500">Starting checkout…</p>
      ) : paid ? (
        <div className="mt-4">
          <p className="font-medium text-green-700">✓ Payment approved — no watermark.</p>
          <button
            onClick={() => doDownload(false)}
            disabled={busy}
            className="mt-3 rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Download {format}
          </button>
        </div>
      ) : submitted ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>
          <p className="text-lg font-semibold text-stone-800">Transaction ID submitted!</p>
          <p className="text-sm text-stone-500">
            Your request is now <strong>awaiting admin approval</strong>. Once approved, you can
            download it from My Requests.
          </p>
          <a
            href="/orders"
            className="mt-2 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700"
          >
            Go to My Requests →
          </a>
          <p className="text-xs text-stone-400">Redirecting…</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-stone-700">
            Pay <strong>₹{rupees(order.amount)}</strong> by scanning this UPI QR with any UPI
            app (GPay, PhonePe, Paytm).
          </p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="UPI QR" className="rounded border bg-white p-2" width={240} height={240} />
          )}
          <p className="text-xs text-stone-500">
            Paying <strong>{vpa}</strong>. After paying, enter the UPI reference / UTR below and
            submit — your download unlocks once the payment is confirmed.
          </p>
          <div className="flex gap-2">
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="UPI transaction ID / UTR"
              className="flex-1 rounded border px-2 py-1 text-sm"
            />
            <button
              onClick={() => {
                if (!utr.trim()) {
                  setMsg("Please enter your UPI transaction ID.");
                } else {
                  setMsg("");
                  setConfirming(true);
                }
              }}
              disabled={busy}
              className="rounded bg-stone-900 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit"}
            </button>
          </div>
          <p className="text-xs text-stone-400">Waiting for confirmation… (this page auto-refreshes)</p>
        </div>
      )}
    </Shell>

    {confirming && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-stone-900">Confirm submission</h3>
          <p className="mt-2 text-sm text-stone-600">
            Please double-check your UPI transaction ID before submitting:
          </p>
          <div className="mt-3 break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center font-mono text-sm font-semibold text-stone-800">
            {utr}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Make sure it exactly matches the payment you made — this is what the admin verifies.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setConfirming(false);
                await submitUtr();
              }}
              disabled={busy}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              Yes, submit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function Shell({ children, backHref }: { children: React.ReactNode; backHref: string }) {
  return (
    <main className="mx-auto mt-16 max-w-md rounded-xl border bg-white p-6 shadow-sm">
      {children}
      <div className="mt-6 text-sm">
        <a href={backHref} className="text-stone-500 hover:underline">
          ← Back to editor
        </a>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-stone-500">Loading…</div>}>
      <Checkout />
    </Suspense>
  );
}
