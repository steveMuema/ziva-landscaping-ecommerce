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
  "Garden Tools": "garden",
  "Outdoor Living": "furniture",
  "Lawn Care": "landscaping",
  "Plants & Nursery": "garden",
  "Irrigation & Watering": "landscaping",
  "Landscaping Materials": "landscaping",
  "Home Decor and Furnishing": "home-decor",
};

const catalog: {
  category: { name: string; description?: string; isAgriculture?: boolean; imageUrl?: string };
  subcategories: {
    name: string;
    description?: string;
    imageUrl?: string;
    products: { name: string; description?: string; price: number; stock: number; tags?: string[]; imageUrl?: string }[];
  }[];
}[] = [
  {
    category: { name: "Garden Tools", description: "Hand and power tools for gardening", isAgriculture: false, imageUrl: "/product-images/garden/garden-Herbs-Basil.jpg" },
    subcategories: [
      {
        name: "Hand Tools",
        imageUrl: "/product-images/garden/garden-Herbs-Parsley.jpg",
        products: [
          { name: "Stainless Steel Trowel", description: "Durable trowel for planting and transplanting", price: 850, stock: 50, tags: ["featured"] },
          { name: "Garden Fork", description: "Heavy-duty fork for turning soil", price: 1200, stock: 30 },
          { name: "Pruning Shears", description: "Sharp bypass pruners for clean cuts", price: 950, stock: 40 },
          { name: "Hand Rake", description: "Small rake for beds and borders", price: 650, stock: 45 },
          { name: "Weeding Knife", description: "Stainless steel weeding tool", price: 550, stock: 60 },
        ],
      },
      {
        name: "Power Tools",
        imageUrl: "/product-images/landscaping/landscaping-Lawn-Care-and-Services-Planting-grass.jpg",
        products: [
          { name: "Electric Hedge Trimmer", description: "Cordless hedge trimmer 20V", price: 8500, stock: 15, tags: ["featured"] },
          { name: "Lawn Edger", description: "Battery-powered lawn edger", price: 6200, stock: 12 },
          { name: "Leaf Blower", description: "Cordless leaf blower", price: 5500, stock: 18 },
        ],
      },
    ],
  },
  {
    category: { name: "Outdoor Living", description: "Furniture and decor for outdoor spaces", isAgriculture: false, imageUrl: "/product-images/furniture/furniture-outdoor-seats.jpg" },
    subcategories: [
      {
        name: "Garden Furniture",
        imageUrl: "/product-images/furniture/furniture-5-seater-sofa.jpg",
        products: [
          { name: "Teak Garden Bench", description: "2-seater solid teak bench", price: 18500, stock: 8, tags: ["featured"], imageUrl: "/product-images/furniture/furniture-5-seater-sofa.jpg" },
          { name: "Metal Bistro Set", description: "Table and 2 chairs, powder-coated", price: 12500, stock: 10, imageUrl: "/product-images/furniture/furniture-bar-rack.jpg" },
          { name: "Garden Lounge Chair", description: "Folding reclining chair", price: 4200, stock: 25, imageUrl: "/product-images/furniture/furniture-beds.jpg" },
          { name: "Umbrella Base", description: "Heavy-duty cast iron base", price: 3500, stock: 20, imageUrl: "/product-images/furniture/furniture-carbinate.jpg" },
        ],
      },
      {
        name: "Planters & Pots",
        imageUrl: "/product-images/furniture/furniture-handmade-wooden-shandalia.jpg",
        products: [
          { name: "Terracotta Pot 12\"", description: "Classic terracotta, 12 inch", price: 1200, stock: 80, imageUrl: "/product-images/furniture/furniture-handmade-wooden-shandalia.jpg" },
          { name: "Ceramic Planter Set", description: "Set of 3 decorative planters", price: 4500, stock: 25, imageUrl: "/product-images/furniture/furniture-outdoor-kitchen-bar-counter.jpg" },
          { name: "Hanging Basket", description: "Wire basket with coconut liner", price: 850, stock: 50, imageUrl: "/product-images/furniture/furniture-outdoor-seats.jpg" },
          { name: "Window Box 60cm", description: "Plastic window box with drainage", price: 1800, stock: 35, imageUrl: "/product-images/furniture/furniture-shoe-and-handbag-carbinate_.jpg" },
        ],
      },
    ],
  },
  {
    category: { name: "Lawn Care", description: "Seeds, fertilisers and lawn equipment", isAgriculture: false, imageUrl: "/product-images/landscaping/landscaping-Kikuyu-grass.jpg" },
    subcategories: [
      {
        name: "Lawn Seed & Feed",
        imageUrl: "/product-images/landscaping/landscaping-LAWN-FERTILIZER-NPK-fertilizer.jpg",
        products: [
          { name: "Kikuyu Lawn Seed 1kg", description: "Fast-growing kikuyu grass seed", price: 1200, stock: 40, tags: ["featured"] },
          { name: "Lawn Fertiliser 5kg", description: "NPK fertiliser for green lawns", price: 1850, stock: 30 },
          { name: "Weed & Feed 2kg", description: "Fertiliser with weed control", price: 2200, stock: 25 },
          { name: "Grass Patch Repair Kit", description: "Seed, soil and mesh for patches", price: 950, stock: 45 },
        ],
      },
      {
        name: "Mowers & Trimmers",
        imageUrl: "/product-images/landscaping/landscaping-Lawn-Care-and-Services-Planting-grass.jpg",
        products: [
          { name: "Push Reel Mower", description: "Manual reel mower for small lawns", price: 6500, stock: 10 },
          { name: "Electric Lawn Mower", description: "1400W corded mower", price: 12500, stock: 8 },
          { name: "String Trimmer", description: "Electric grass trimmer", price: 3800, stock: 15 },
        ],
      },
    ],
  },
  {
    category: { name: "Plants & Nursery", description: "Seeds, seedlings and plants", isAgriculture: true, imageUrl: "/product-images/garden/garden-Vegetables-Tomatoes.jpg" },
    subcategories: [
      {
        name: "Seeds",
        imageUrl: "/product-images/garden/garden-Fruits-Pixie-Oranges-ksh150_Kg.jpg",
        products: [
          { name: "Tomato Seeds Pack", description: "Hybrid tomato, 50 seeds", price: 350, stock: 100, imageUrl: "/product-images/garden/garden-hass-avacado-ksh150_kg.jpg" },
          { name: "Spinach Seeds 50g", description: "Leaf spinach, high yield", price: 280, stock: 80, imageUrl: "/product-images/garden/garden-pixie-oranges-ksh150_kg.jpg" },
          { name: "Beans Climbing Pack", description: "Climbing beans, 30 seeds", price: 320, stock: 70, imageUrl: "/product-images/garden/garden-purple-passion-ksh400_kg.jpg" },
          { name: "Herb Seed Collection", description: "Basil, coriander, parsley mix", price: 450, stock: 60, tags: ["featured"], imageUrl: "/product-images/garden/garden-Herbs-Basil.jpg" },
        ],
      },
      {
        name: "Seedlings & Plants",
        imageUrl: "/product-images/garden/garden-Herbs-Lavender.jpg",
        products: [
          { name: "Tomato Seedling Tray", description: "6 tomato seedlings, ready to plant", price: 600, stock: 40, imageUrl: "/product-images/garden/garden-Vegetables-Tomatoes.jpg" },
          { name: "Onion Sets 500g", description: "Red onion sets for planting", price: 550, stock: 35, imageUrl: "/product-images/garden/garden-Vegetables-Red-onions-ksh90_Kg.jpg" },
          { name: "Ornamental Grass Pot", description: "Potted ornamental grass", price: 1800, stock: 20, imageUrl: "/product-images/landscaping/landscaping-Landscape-Garden-Plants-Blue-grass-plant.jpg" },
          { name: "Lavender Plant", description: "Potted lavender, fragrant", price: 1200, stock: 30, imageUrl: "/product-images/garden/garden-Herbs-Lavender.jpg" },
        ],
      },
    ],
  },
  {
    category: { name: "Irrigation & Watering", description: "Hoses, sprinklers and watering systems", isAgriculture: false, imageUrl: "/product-images/landscaping/landscaping-Lawn-Care-and-Services-Spreading-red-soil.jpg" },
    subcategories: [
      {
        name: "Hoses & Accessories",
        imageUrl: "/product-images/landscaping/landscaping-Red-soil-and-Manure-Red-soil-in-Sacks.jpg",
        products: [
          { name: "Garden Hose 15m", description: "Reinforced PVC hose, 15 metre", price: 2200, stock: 25 },
          { name: "Spray Nozzle", description: "Adjustable spray pattern", price: 450, stock: 50 },
          { name: "Hose Reel", description: "Wall-mounted hose reel", price: 3500, stock: 15 },
          { name: "Soaker Hose 10m", description: "Drip soaker hose for beds", price: 1800, stock: 20 },
        ],
      },
      {
        name: "Sprinklers",
        imageUrl: "/product-images/landscaping/landscaping-Red-soil-and-Manure-Red-soil-Lorry.jpg",
        products: [
          { name: "Oscillating Sprinkler", description: "Rectangular coverage sprinkler", price: 950, stock: 30 },
          { name: "Spike Sprinkler", description: "360° spike sprinkler", price: 650, stock: 40 },
          { name: "Sprinkler Timer", description: "Digital timer, battery operated", price: 2800, stock: 18 },
        ],
      },
    ],
  },
  {
    category: { name: "Landscaping Materials", description: "Soil, mulch and hard landscaping", isAgriculture: false, imageUrl: "/product-images/landscaping/landscaping-red-soil-and-manure-coco-peat-block-ksh-2000.jpg" },
    subcategories: [
      {
        name: "Soil & Mulch",
        imageUrl: "/product-images/landscaping/landscaping-red-soil-and-manure-goat-manure-lorry.jpg",
        products: [
          { name: "Potting Mix 50L", description: "Premium potting mix with compost", price: 1850, stock: 40, imageUrl: "/product-images/landscaping/landscaping-new-bermuda-grass.jpg" },
          { name: "Compost 25kg", description: "Organic compost for beds", price: 950, stock: 50, imageUrl: "/product-images/landscaping/landscaping-new-paspalum-grass.jpg" },
          { name: "Bark Mulch 50L", description: "Decorative bark mulch", price: 1200, stock: 35, imageUrl: "/product-images/landscaping/landscaping-red-soil-and-manure-coco-peat-block-ksh-2000.jpg" },
          { name: "Topsoil 50L", description: "Screened topsoil for lawns", price: 1100, stock: 45, imageUrl: "/product-images/landscaping/landscaping-red-soil-and-manure-goat-manure-lorry.jpg" },
        ],
      },
      {
        name: "Paving & Edging",
        imageUrl: "/product-images/landscaping/landscaping-Landscape-Designs-Rock-Garden.jpg",
        products: [
          { name: "Plastic Lawn Edging 5m", description: "Flexible lawn edging strip", price: 850, stock: 30, imageUrl: "/product-images/landscaping/landscaping-red-soil-and-manure-organic-manure-tipper.jpg" },
          { name: "Steel Edging 1m", description: "Galvanised steel landscape edging", price: 1200, stock: 25, imageUrl: "/product-images/landscaping/landscaping-replace-new-varigated-pemba.jpg" },
          { name: "Gravel 20kg", description: "Decorative gravel, 10mm", price: 650, stock: 60 },
        ],
      },
    ],
  },
  {
    category: {
      name: "Home Decor and Furnishing",
      description: "Furnishing your home with beauty, creativity, and functionality. Indoor plants and unique décor that promote health and fresh air.",
      isAgriculture: false,
      imageUrl: "/product-images/home-decor/home-decor-Indoor-Plants-Snake-plant.jpg",
    },
    subcategories: [
      {
        name: "Indoor Plants",
        imageUrl: "/product-images/home-decor/home-decor-Potted-Live-Cactus-plant.jpg",
        products: [
          { name: "Snake Plant Pot", description: "Low-light air-purifying plant", price: 1800, stock: 25, tags: ["featured"], imageUrl: "/product-images/home-decor/home-decor-Indoor-Plants-Snake-plant.jpg" },
          { name: "Peace Lily", description: "Elegant indoor plant, easy care", price: 1500, stock: 20, imageUrl: "/product-images/home-decor/home-decor-Indoor-Plants-Potted-Palm-tree-ksh-3500.jpg" },
          { name: "Pothos Hanging", description: "Trailing pothos in pot", price: 1200, stock: 30, imageUrl: "/product-images/home-decor/home-decor-Indoor-Plants-Potted-Mint-ksh-2000.jpg" },
          { name: "Succulent Set", description: "Set of 3 small succulents", price: 950, stock: 40, imageUrl: "/product-images/home-decor/home-decor-Potted-Live-Cactus-plant.jpg" },
        ],
      },
      {
        name: "Home Décor",
        imageUrl: "/product-images/home-decor/home-decor-Wooden-Bowl.jpg",
        products: [
          { name: "Decorative Vase Set", description: "Set of 2 ceramic vases", price: 3500, stock: 15, imageUrl: "/product-images/home-decor/home-decor-wooden-bowls-andPlatters.jpg" },
          { name: "Wall Planter", description: "Mountable wall planter", price: 2200, stock: 20, imageUrl: "/product-images/home-decor/home-decor-Wall-Art-Photo-from-Ziva-Landscaping-Co.jpg" },
          { name: "Candle Holder Set", description: "Wood and metal candle holders", price: 1850, stock: 25, imageUrl: "/product-images/home-decor/home-decor-Candle-Holder-ksh-2500.jpg" },
          { name: "Indoor Herb Kit", description: "Basil, mint, rosemary starter kit", price: 1400, stock: 35, imageUrl: "/product-images/garden/garden-Herbs-Mint.jpg" },
        ],
      },
    ],
  },
];

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

  for (const { category: catData, subcategories } of catalog) {
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

    for (const sub of subcategories) {
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
        const costPrice = Math.round(prod.price * 0.9 * 100) / 100; // 10% less than selling price
        if (!existing) {
          await prisma.product.create({
            data: {
              name: prod.name,
              description: prod.description ?? null,
              price: prod.price,
              cost: costPrice,
              stock: prod.stock,
              tags: prod.tags ?? [],
              imageUrl: productImage,
              subCategoryId: subCategory.id,
            },
          });
        } else {
          const updateData: { imageUrl?: string; cost: number } = { cost: costPrice };
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
