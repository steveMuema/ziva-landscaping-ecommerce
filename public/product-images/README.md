# Product images (Ziva Pics)

Photos from **Ziva Pics** (Google Drive export), copied with URL-safe names and associated to products in `prisma/seed.ts`.

- **garden/** — Plants & Nursery (Seeds): tomato, spinach, beans, fruit
- **landscaping/** — Landscaping Materials: soil, mulch, grass, manure
- **furniture/** — Outdoor Living (furniture, planters) + Home Decor (indoor plants, décor)

To refresh from a new zip: extract to `.tmp-ziva-pics/Ziva Pics/`, then run `node scripts/copy-ziva-pics.js`. Re-run `npx prisma db seed` to update product `imageUrl`s.

For smaller file sizes, run an image optimizer (e.g. [Squoosh](https://squoosh.app), ImageOptim) on these JPGs before deploy.
