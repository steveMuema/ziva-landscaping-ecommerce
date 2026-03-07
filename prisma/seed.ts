import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

/** Discover all product images from public/product-images and return paths by folder (e.g. garden, furniture). */
function getProductImagePool(): Record<string, string[]> {
  const baseDir = path.join(process.cwd(), "public", "product-images");
  const pool: Record<string, string[]> = {};
  const folders = ["garden", "furniture", "landscaping", "home-decor"] as const;
  for (const folder of folders) {
    const dir = path.join(baseDir, folder);
    if (!fs.existsSync(dir)) {
      pool[folder] = [];
      continue;
    }
    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".jpg"));
    pool[folder] = files.map((f) => `/product-images/${folder}/${f}`);
  }
  return pool;
}

/** Map catalog category name to image folder. */
const categoryToImageFolder: Record<string, string> = {
  "Landscaping": "landscaping",
  "Gardening": "garden",
  "Furniture & Fittings": "furniture",
  "Home Décor & Furnishing": "home-decor",
};

import seedData from "./seed-data.json";

const sampleBlogs: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
}[] = [
    {
      title: "5 Drought-Resistant Plants for Your East African Garden",
      slug: "drought-resistant-plants-east-africa",
      excerpt: "Discover hardy, water-wise plants that thrive in Kenya and the wider region—from succulents to native grasses.",
      content: `<p>Gardening in East Africa often means working with dry spells and limited water. Choosing drought-resistant plants not only saves water but also keeps your garden green year-round.</p>
<h2>1. Aloe Vera</h2>
<p>Aloe vera is a classic choice: it stores water in its leaves, needs minimal irrigation, and thrives in full sun. Use it in borders or as a focal point in rock gardens.</p>
<h2>2. Lavender</h2>
<p>Lavender loves well-drained soil and full sun. It’s aromatic, attracts pollinators, and can be used for borders or low hedges.</p>
<h2>3. Native Grasses</h2>
<p>Local grasses such as buffalo grass and certain varieties of kikuyu are adapted to seasonal dryness and recover well after rain.</p>
<h2>4. Succulents (e.g. Jade, Echeveria)</h2>
<p>Succulents are built for dry conditions. Plant them in containers or raised beds with good drainage for best results.</p>
<h2>5. Rosemary</h2>
<p>Rosemary is a tough herb that tolerates heat and dry soil. It works as an edible hedge or in herb gardens.</p>
<p>At Ziva Landscaping we can help you design a water-wise garden that stays beautiful through the dry season.</p>`,
      published: true,
    },
    {
      title: "How to Start a Small Kitchen Garden in Nairobi",
      slug: "kitchen-garden-nairobi",
      excerpt: "A step-by-step guide to growing herbs and vegetables in limited space—perfect for balconies and small yards.",
      content: `<p>You don’t need a large plot to grow your own food. A small kitchen garden in Nairobi can supply fresh herbs and vegetables for your table.</p>
<h2>Choose the right spot</h2>
<p>Pick a spot that gets at least 4–6 hours of sun. Balconies, patios, or a corner of the yard all work. Use containers, raised beds, or vertical planters if space is tight.</p>
<h2>Start with easy crops</h2>
<p>Begin with herbs like basil, mint, and coriander, and vegetables such as spinach, kale, and cherry tomatoes. They’re forgiving and productive.</p>
<h2>Soil and watering</h2>
<p>Use good-quality potting mix or compost. Water regularly but avoid waterlogging—containers should have drainage holes.</p>
<h2>Feed and harvest</h2>
<p>Add a little organic fertiliser every few weeks. Harvest often to encourage more growth.</p>
<p>Need soil, seeds, or planters? Browse our <a href="/shop">shop</a> for everything you need to start your kitchen garden.</p>`,
      published: true,
    },
    {
      title: "Sustainable Landscaping: Tips for an Eco-Friendly Outdoor Space",
      slug: "sustainable-landscaping-tips",
      excerpt: "Practical ideas to make your garden more sustainable—water conservation, native plants, and organic practices.",
      content: `<p>Sustainable landscaping is about working with nature: saving water, supporting wildlife, and reducing chemicals.</p>
<h2>Save water</h2>
<p>Use mulch to keep soil moist, install drip irrigation where possible, and choose drought-tolerant plants. Collect rainwater for watering.</p>
<h2>Go native</h2>
<p>Native plants are adapted to local climate and pests, so they need less water and fewer inputs. They also support local birds and insects.</p>
<h2>Reduce chemicals</h2>
<p>Switch to organic fertilisers and natural pest control. Compost kitchen and garden waste to feed your soil.</p>
<h2>Reuse and recycle</h2>
<p>Use reclaimed materials for paths and borders. Repurpose containers and pallets for planting.</p>
<p>At Ziva Landscaping we design and supply materials for landscapes that are beautiful and kind to the environment.</p>`,
      published: true,
    },
    {
      title: "Lawn Care Basics: Keeping Your Grass Green in Kenya",
      slug: "lawn-care-basics-kenya",
      excerpt: "Simple lawn care tips—mowing, watering, fertilising—to maintain a healthy, green lawn in East African conditions.",
      content: `<p>A green, healthy lawn is achievable in Kenya with the right routine: mowing, watering, and feeding.</p>
<h2>Mowing</h2>
<p>Mow regularly but don’t cut too short—this stresses grass and invites weeds. Keep blades sharp and vary the mowing direction.</p>
<h2>Watering</h2>
<p>Water deeply and less often so roots grow down. Early morning is best to reduce evaporation and disease. Adjust in rainy season.</p>
<h2>Fertilising</h2>
<p>Use a balanced lawn fertiliser a few times a year. We stock lawn seed and fertiliser suitable for local conditions.</p>
<h2>Weeds and pests</h2>
<p>Hand-weed or spot-treat where needed. Healthy, well-fed grass competes better with weeds.</p>
<p>For lawn seed, fertiliser, and equipment, visit our <a href="/shop">shop</a> or get in touch for advice.</p>`,
      published: true,
    },
  ];

async function main() {
  console.log("Seeding...");

  const imagePool = getProductImagePool();
  const imageIndexByFolder: Record<string, number> = {
    garden: 0,
    furniture: 0,
    landscaping: 0,
    "home-decor": 0,
  };
  const pickImage = (folder: string): string | null => {
    const list = imagePool[folder];
    if (!list || list.length === 0) return null;
    const idx = imageIndexByFolder[folder] ?? 0;
    imageIndexByFolder[folder] = (idx + 1) % list.length;
    return list[idx];
  };

  const adminEmail = "admin@zivalandscaping.co.ke";
  const adminPassword = await bcryptjs.hash("securepassword123", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: {
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("Admin user:", admin.email);

  for (const catData of seedData.categories) {
    const imageFolder = categoryToImageFolder[catData.name] ?? "landscaping";
    const categoryImage =
      catData.imageUrl ?? pickImage(imageFolder) ?? null;

    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {
        description: catData.description ?? undefined,
        isAgriculture: catData.isAgriculture ?? false,
        imageUrl: categoryImage ?? undefined,
      },
      create: {
        name: catData.name,
        description: catData.description ?? null,
        isAgriculture: catData.isAgriculture ?? false,
        imageUrl: categoryImage,
      },
    });

    for (const sub of catData.subCategories) {
      const subImage = sub.imageUrl ?? pickImage(imageFolder) ?? null;
      let subCategory = await prisma.subCategory.findFirst({
        where: { categoryId: category.id, name: sub.name },
      });
      if (!subCategory) {
        subCategory = await prisma.subCategory.create({
          data: {
            name: sub.name,
            description: sub.description ?? null,
            imageUrl: subImage,
            categoryId: category.id,
          },
        });
      } else {
        await prisma.subCategory.update({
          where: { id: subCategory.id },
          data: { imageUrl: subImage ?? subCategory.imageUrl },
        });
        subCategory = { ...subCategory, imageUrl: subImage ?? subCategory.imageUrl };
      }

      for (const prod of sub.products) {
        const existing = await prisma.product.findFirst({
          where: { subCategoryId: subCategory.id, name: prod.name },
        });
        const productImage =
          prod.imageUrl ?? (existing?.imageUrl ?? null) ?? pickImage(imageFolder);
        const costPrice = prod.cost ?? Math.round(prod.price * 0.9 * 100) / 100; // 10% less than selling price
        if (!existing) {
          await prisma.product.create({
            data: {
              name: prod.name,
              description: prod.description ?? null,
              price: prod.price,
              cost: costPrice,
              stock: prod.stock,
              tags: [...new Set(prod.tags ?? [])],
              imageUrl: productImage,
              subCategoryId: subCategory.id,
            },
          });
        } else {
          const updateData: { imageUrl?: string; cost: number; tags?: string[] } = {
            cost: costPrice,
            tags: [...new Set(prod.tags ?? [])],
          };
          if (productImage && !existing.imageUrl) updateData.imageUrl = productImage;
          else if (prod.imageUrl != null) updateData.imageUrl = prod.imageUrl;
          await prisma.product.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      }
    }
  }

  // Set cost = 10% less than price for any product that still has null cost
  const productsWithoutCost = await prisma.product.findMany({
    where: { cost: null },
  });
  for (const p of productsWithoutCost) {
    const costPrice = Math.round(Number(p.price) * 0.9 * 100) / 100;
    await prisma.product.update({
      where: { id: p.id },
      data: { cost: costPrice },
    });
  }
  if (productsWithoutCost.length > 0) {
    console.log(`Set cost (10% below price) for ${productsWithoutCost.length} product(s).`);
  }

  // Ensure any product still without an image gets one from its category's folder
  const productsWithoutImage = await prisma.product.findMany({
    where: { imageUrl: null },
    include: { subCategory: { include: { category: true } } },
  });
  for (const p of productsWithoutImage) {
    const folder =
      categoryToImageFolder[p.subCategory.category.name] ?? "landscaping";
    const img = pickImage(folder);
    if (img) {
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: img },
      });
    }
  }
  if (productsWithoutImage.length > 0) {
    console.log(`Assigned images to ${productsWithoutImage.length} products that had none.`);
  }

  const now = new Date();
  for (const post of sampleBlogs) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        published: post.published,
        publishedAt: post.published ? now : null,
        updatedAt: now,
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        published: post.published,
        publishedAt: post.published ? now : null,
        updatedAt: now,
      },
    });
  }
  console.log(`Seeded ${sampleBlogs.length} blog posts.`);

  const catCount = await prisma.category.count();
  const subCount = await prisma.subCategory.count();
  const prodCount = await prisma.product.count();
  const blogCount = await prisma.blogPost.count();
  console.log(`Categories: ${catCount}, Subcategories: ${subCount}, Products: ${prodCount}, Blog posts: ${blogCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
