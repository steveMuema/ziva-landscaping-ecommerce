# Production deployment (600 KSH/month budget)

This guide keeps your **fixed monthly cost at 0 KSH** so your 600 KSH budget can go to M-Pesa transaction fees, domain, or savings.

---

## Free tier stack (recommended)

| Service        | Use              | Cost        | Notes |
|----------------|------------------|-------------|--------|
| **Vercel**     | App hosting      | **0 KSH**   | Hobby plan; connect GitHub, auto-deploy. |
| **Neon** or **Supabase** | PostgreSQL | **0 KSH**   | Free tier: ~0.5 GB DB, sufficient for starting. |
| **Cloudinary** | Product images   | **0 KSH**   | Free tier: 25 GB storage, 25 GB bandwidth/month. |
| **NextAuth**   | Sign-in          | **0 KSH**   | No extra cost. |
| **Fiona (chat)** | In-app chat    | **0 KSH**   | Rule-based; no paid API. |

**Variable costs (only when you use them):**

- **M-Pesa (Lipa na M-Pesa)**: Per-transaction fee (Safaricom pricing). No fixed monthly fee.
- **Domain** (e.g. zivalandscaping.co.ke): One-off or yearly; can use free Vercel subdomain (`*.vercel.app`) to stay at 0 KSH.

With this stack, **600 KSH/month** is enough for M-Pesa fees and a cheap domain if you want one.

---

## 1. Database (Neon – free)

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. In Vercel → your project → **Settings → Environment Variables**, add:
   - `DATABASE_URL` = that connection string (Production, Preview, Development if you use Vercel for all).

**Alternative:** [Supabase](https://supabase.com) free tier also gives PostgreSQL; use its connection string the same way.

---

## 2. Vercel deployment

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Framework Preset:** Next.js (auto-detected).
4. Add all environment variables (see checklist below) **before** the first deploy.
5. Deploy. Your live URL will be `https://your-project.vercel.app` (or your custom domain).

After first deploy, run migrations against the **production** DB:

```bash
DATABASE_URL="your-neon-or-supabase-url" npx prisma migrate deploy
```

(Optional) Seed once if you want initial categories/products:

```bash
DATABASE_URL="your-neon-or-supabase-url" npx prisma db seed
```

---

## 3. Environment variables (production)

Set these in **Vercel → Project → Settings → Environment Variables** for **Production** (and optionally Preview).

| Variable | Required | Example / notes |
|----------|----------|------------------|
| `DATABASE_URL` | Yes | Neon/Supabase connection string |
| `NEXTAUTH_URL` | Yes | `https://your-domain.com` or `https://your-project.vercel.app` |
| `NEXTAUTH_SECRET` | Yes | Long random string, e.g. `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Same as `NEXTAUTH_URL` (sitemap, M-Pesa callback, Fiona) |
| `CLOUDINARY_CLOUD_NAME` | Yes (if using images) | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Yes (if using images) | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Yes (if using images) | From Cloudinary dashboard |
| `MPESA_ENV` | For M-Pesa | `sandbox` (test) or `production` |
| `MPESA_CONSUMER_KEY` | For M-Pesa | From Safaricom Daraja API portal |
| `MPESA_CONSUMER_SECRET` | For M-Pesa | From Safaricom Daraja API portal |
| `MPESA_SHORTCODE` | For M-Pesa | Till or Paybill number |
| `MPESA_PASSKEY` | For M-Pesa | From Daraja portal |

**Important:** In production, set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your **real** public URL (e.g. `https://zivalandscaping.co.ke`). The M-Pesa callback URL will be `https://your-domain/api/mpesa/callback` — register this in the Daraja portal.

---

## 4. M-Pesa (Lipa na M-Pesa)

- **Sandbox:** For testing; no real money. Use sandbox credentials and test numbers from Safaricom.
- **Production:** Register on [Safaricom Daraja](https://developer.safaricom.co.ke). Your only ongoing cost is **per-transaction**; there is no fixed monthly platform fee. 600 KSH/month can cover many small transactions.
- Ensure your production callback URL is whitelisted and uses HTTPS.

---

## 5. Post-deploy checklist

- [ ] `DATABASE_URL` points to Neon/Supabase; migrations run: `npx prisma migrate deploy`
- [ ] `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` set to live URL
- [ ] Sign-in works (test with a real or test user)
- [ ] Home, shop, product, and checkout pages load
- [ ] If using M-Pesa: callback URL set in Daraja; one test STK push in sandbox/production
- [ ] Cloudinary images load (if you use uploads)
- [ ] Blog and Fiona chat open and respond

---

## 6. Optional: custom domain

- In Vercel: **Project → Settings → Domains** → add your domain and follow DNS instructions.
- No extra Vercel fee for custom domain on Hobby.
- Domain registration (e.g. .co.ke) is separate; 600 KSH can cover a cheap domain or be used for M-Pesa.

---

## Summary

- **Fixed monthly cost: 0 KSH** with Vercel + Neon/Supabase + Cloudinary free tiers.
- **600 KSH/month** can go to M-Pesa transaction fees and/or domain.
- Set all production env vars in Vercel, run Prisma migrations against the production DB, and test sign-in, checkout, and M-Pesa callback after deploy.
