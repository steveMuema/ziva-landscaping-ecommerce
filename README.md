# Ziva Landscaping Co. E-Commerce Platform

**Maintained by [Harun Mwangi](https://github.com/mwangiiharun).**

Welcome to the Ziva Landscaping Co. E-Commerce Platform, a modern web application built to showcase and sell landscaping and home solution products. This project leverages Next.js 15, TypeScript, React 19, and Tailwind CSS to deliver a suspenseful, server-component-optimized user experience. It includes an admin dashboard for managing products and a customer-facing interface with wishlist and cart functionality, deployed securely on Vercel with a PostgreSQL database.

## Features
- **Customer Interface**: Browse products, add to wishlist, and manage cart for purchase.
- **Admin Dashboard**: Create, edit, and delete product catalogs.
- **Dynamic Navigation**: Categories and subcategories fetched from the database with collapsible menus.
- **Responsive Design**: Optimized for desktop and mobile using Tailwind CSS.
- **Secure Deployment**: Hosted on Vercel with a private GitHub repository and PostgreSQL integration.

## Prerequisites
- **Node.js**: v16.x or later (LTS recommended).
- **npm**: v8.x or later.
- **PostgreSQL**: For local development (e.g., v15.x).
- **Git**: For version control.
- **Vercel CLI**: For deployment (optional).

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mwangiiharun/ziva-landscaping-ecommerce.git
cd ziva-landscaping-ecommerce
```

### 2. Local database (dev)

PostgreSQL runs in Docker. The app uses **port 5434** by default (in case 5432/5433 are already in use).

Start the database:

```bash
docker compose up -d
```

Create `.env` from the example and ensure `DATABASE_URL` points at the Docker DB:

```bash
cp .env.example .env
# DATABASE_URL should be: postgresql://ziva:ziva_dev_secret@localhost:5434/ziva_landscaping
```

Apply migrations and seed:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
```

**Docker details**
- Image: `postgres:16-alpine`
- Container: `ziva-postgres-dev`
- Credentials: user `ziva`, password `ziva_dev_secret`, database `ziva_landscaping`
- Host port: `5434` (mapped to container 5432)
- Stop: `docker compose down`

### 3. Run the app

```bash
npm run dev
```

## Local credentials (dev)

When running locally, use these values:

| What | Value |
|------|--------|
| **App** | http://localhost:3000 |
| **Database host** | localhost:5434 |
| **Database name** | ziva_landscaping |
| **DB user** | ziva |
| **DB password** | ziva_dev_secret |
| **DATABASE_URL** | `postgresql://ziva:ziva_dev_secret@localhost:5434/ziva_landscaping` |
| **NextAuth URL** | http://localhost:3000 (in `.env` as `NEXTAUTH_URL`) |

Stop everything: `docker compose down` and kill the dev server (Ctrl+C). Start: `docker compose up -d` then `npm run dev`.

**CI:** Push to `main` (or `master`) runs the GitHub Actions pipeline: lint and build. Repo: [github.com/mwangiiharun/ziva-landscaping-ecommerce](https://github.com/mwangiiharun/ziva-landscaping-ecommerce).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

**Production on a tight budget (e.g. 600 KSH/month):** See **[PRODUCTION.md](./PRODUCTION.md)** for a full checklist using free tiers (Vercel, Neon/Supabase, Cloudinary) and M-Pesa setup.
