# Question Paper Builder

Build exam papers (MCQs with images, match-the-following, fill-in-the-blanks,
case studies, long/short answers) with a live preview, then export to **PDF** or
**Word (.docx)**. Teachers sign in, save papers, and pay per download via **UPI QR**.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind 4**
- **Prisma** → **Supabase Postgres**
- **Auth.js (NextAuth v5)** — email + password
- **Export**: client print → PDF; `docx` library for Word
- **Payments**: static UPI QR + manual admin unlock (pluggable → Razorpay/Cashfree later)

## Run locally

```bash
pnpm install
cp .env.example .env        # fill in the values (see below)
pnpm prisma migrate dev     # create the schema in your database
pnpm dev                    # http://localhost:3000
```

You can try the builder with **no database** at `/editor/sample` (demo) or
`/editor/local` (saved in your browser). Accounts, saving, and paid downloads
need the database configured.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Database → Connection string**: copy the *pooled* (port 6543) and *direct*
   (port 5432) URLs into `.env` as `DATABASE_URL` and `DIRECT_URL`.
3. Run `pnpm prisma migrate dev` to create the tables.
4. (Later, for hosted image uploads) create a public Storage bucket named
   `paper-images` and fill the `NEXT_PUBLIC_SUPABASE_*` keys. Until then images
   are embedded inline (data URLs) and still export correctly.

## Environment variables

See `.env.example`. Key ones:

| Var | What |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres (pooled / direct) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_UPI_VPA` | your UPI id, e.g. `name@okaxis` |
| `NEXT_PUBLIC_UPI_PAYEE_NAME` | name shown in the UPI app |
| `NEXT_PUBLIC_PRICE_PAISE` | price per download in paise (`1000` = ₹10) |

## Accounts & admin

- Register at `/register`. **The first registered user becomes `admin`.**
- Admins see an **Orders** panel at `/admin/orders` to confirm UPI payments
  (phase 1 is manual: the buyer pays, submits their UTR, you click *Mark paid*).

## Payments: how it works & upgrading

**Phase 1 (now, free, no KYC):** buyer scans your static UPI QR, pays, and
submits the UPI reference (UTR). You confirm it in `/admin/orders`, which flips
the order to `paid` and unlocks the download. Server-side gating lives in
`app/api/export/docx` and the checkout flow.

**Phase 2 (when busy):** swap in Razorpay/Cashfree. Only one thing changes — how
an order becomes `paid`: add a webhook route that verifies the gateway payment
and sets `order.status = "paid"`. The orders table, checkout UI, and download
gating stay the same. Onboard as an individual (PAN + bank), ~2% per txn.

## Deploy (Vercel)

1. Push to GitHub, import the repo in Vercel.
2. Add all `.env` variables in Vercel project settings.
3. Set the build command to `pnpm prisma generate && pnpm build` (or add
   `prisma generate` to a `postinstall` script).
4. PDF export uses the browser's print dialog (no server Chromium needed), so it
   works on Vercel out of the box.

## Code map

```
lib/paper/types.ts       data model (Paper -> Sections -> Questions)
lib/paper/factory.ts     blank-question factories, new paper
lib/paper/sample.ts      the Class-1 Maths sample paper
components/preview/       PaperPreview — the printed-paper renderer (shared)
components/editor/        the builder UI (Editor + per-type editors)
lib/export/docx.ts        PaperDoc -> .docx
lib/payments.ts           price + UPI link helpers
app/api/...               papers CRUD, orders, admin, export, auth, register
app/editor/[id]           the builder page
app/paper/[id]/print      print -> PDF view
app/checkout              UPI QR payment + unlock
app/admin/orders          admin unlock panel
```
