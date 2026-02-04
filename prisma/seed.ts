import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const catalog: {
  category: { name: string; description?: string; isAgriculture?: boolean };
  subcategories: {
    name: string;
    description?: string;
    products: { name: string; description?: string; price: number; stock: number; tags?: string[] }[];
  }[];
}[] = [
  {
    category: { name: "Garden Tools", description: "Hand and power tools for gardening", isAgriculture: false },
    subcategories: [
      {
        name: "Hand Tools",
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
        products: [
          { name: "Electric Hedge Trimmer", description: "Cordless hedge trimmer 20V", price: 8500, stock: 15, tags: ["featured"] },
          { name: "Lawn Edger", description: "Battery-powered lawn edger", price: 6200, stock: 12 },
          { name: "Leaf Blower", description: "Cordless leaf blower", price: 5500, stock: 18 },
        ],
      },
    ],
  },
  {
    category: { name: "Outdoor Living", description: "Furniture and decor for outdoor spaces", isAgriculture: false },
    subcategories: [
      {
        name: "Garden Furniture",
        products: [
          { name: "Teak Garden Bench", description: "2-seater solid teak bench", price: 18500, stock: 8, tags: ["featured"] },
          { name: "Metal Bistro Set", description: "Table and 2 chairs, powder-coated", price: 12500, stock: 10 },
          { name: "Garden Lounge Chair", description: "Folding reclining chair", price: 4200, stock: 25 },
          { name: "Umbrella Base", description: "Heavy-duty cast iron base", price: 3500, stock: 20 },
        ],
      },
      {
        name: "Planters & Pots",
        products: [
          { name: "Terracotta Pot 12\"", description: "Classic terracotta, 12 inch", price: 1200, stock: 80 },
          { name: "Ceramic Planter Set", description: "Set of 3 decorative planters", price: 4500, stock: 25 },
          { name: "Hanging Basket", description: "Wire basket with coconut liner", price: 850, stock: 50 },
          { name: "Window Box 60cm", description: "Plastic window box with drainage", price: 1800, stock: 35 },
        ],
      },
    ],
  },
  {
    category: { name: "Lawn Care", description: "Seeds, fertilisers and lawn equipment", isAgriculture: false },
    subcategories: [
      {
        name: "Lawn Seed & Feed",
        products: [
          { name: "Kikuyu Lawn Seed 1kg", description: "Fast-growing kikuyu grass seed", price: 1200, stock: 40, tags: ["featured"] },
          { name: "Lawn Fertiliser 5kg", description: "NPK fertiliser for green lawns", price: 1850, stock: 30 },
          { name: "Weed & Feed 2kg", description: "Fertiliser with weed control", price: 2200, stock: 25 },
          { name: "Grass Patch Repair Kit", description: "Seed, soil and mesh for patches", price: 950, stock: 45 },
        ],
      },
      {
        name: "Mowers & Trimmers",
        products: [
          { name: "Push Reel Mower", description: "Manual reel mower for small lawns", price: 6500, stock: 10 },
          { name: "Electric Lawn Mower", description: "1400W corded mower", price: 12500, stock: 8 },
          { name: "String Trimmer", description: "Electric grass trimmer", price: 3800, stock: 15 },
        ],
      },
    ],
  },
  {
    category: { name: "Plants & Nursery", description: "Seeds, seedlings and plants", isAgriculture: true },
    subcategories: [
      {
        name: "Seeds",
        products: [
          { name: "Tomato Seeds Pack", description: "Hybrid tomato, 50 seeds", price: 350, stock: 100 },
          { name: "Spinach Seeds 50g", description: "Leaf spinach, high yield", price: 280, stock: 80 },
          { name: "Beans Climbing Pack", description: "Climbing beans, 30 seeds", price: 320, stock: 70 },
          { name: "Herb Seed Collection", description: "Basil, coriander, parsley mix", price: 450, stock: 60, tags: ["featured"] },
        ],
      },
      {
        name: "Seedlings & Plants",
        products: [
          { name: "Tomato Seedling Tray", description: "6 tomato seedlings, ready to plant", price: 600, stock: 40 },
          { name: "Onion Sets 500g", description: "Red onion sets for planting", price: 550, stock: 35 },
          { name: "Ornamental Grass Pot", description: "Potted ornamental grass", price: 1800, stock: 20 },
          { name: "Lavender Plant", description: "Potted lavender, fragrant", price: 1200, stock: 30 },
        ],
      },
    ],
  },
  {
    category: { name: "Irrigation & Watering", description: "Hoses, sprinklers and watering systems", isAgriculture: false },
    subcategories: [
      {
        name: "Hoses & Accessories",
        products: [
          { name: "Garden Hose 15m", description: "Reinforced PVC hose, 15 metre", price: 2200, stock: 25 },
          { name: "Spray Nozzle", description: "Adjustable spray pattern", price: 450, stock: 50 },
          { name: "Hose Reel", description: "Wall-mounted hose reel", price: 3500, stock: 15 },
          { name: "Soaker Hose 10m", description: "Drip soaker hose for beds", price: 1800, stock: 20 },
        ],
      },
      {
        name: "Sprinklers",
        products: [
          { name: "Oscillating Sprinkler", description: "Rectangular coverage sprinkler", price: 950, stock: 30 },
          { name: "Spike Sprinkler", description: "360° spike sprinkler", price: 650, stock: 40 },
          { name: "Sprinkler Timer", description: "Digital timer, battery operated", price: 2800, stock: 18 },
        ],
      },
    ],
  },
  {
    category: { name: "Landscaping Materials", description: "Soil, mulch and hard landscaping", isAgriculture: false },
    subcategories: [
      {
        name: "Soil & Mulch",
        products: [
          { name: "Potting Mix 50L", description: "Premium potting mix with compost", price: 1850, stock: 40 },
          { name: "Compost 25kg", description: "Organic compost for beds", price: 950, stock: 50 },
          { name: "Bark Mulch 50L", description: "Decorative bark mulch", price: 1200, stock: 35 },
          { name: "Topsoil 50L", description: "Screened topsoil for lawns", price: 1100, stock: 45 },
        ],
      },
      {
        name: "Paving & Edging",
        products: [
          { name: "Plastic Lawn Edging 5m", description: "Flexible lawn edging strip", price: 850, stock: 30 },
          { name: "Steel Edging 1m", description: "Galvanised steel landscape edging", price: 1200, stock: 25 },
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
    },
    subcategories: [
      {
        name: "Indoor Plants",
        products: [
          { name: "Snake Plant Pot", description: "Low-light air-purifying plant", price: 1800, stock: 25, tags: ["featured"] },
          { name: "Peace Lily", description: "Elegant indoor plant, easy care", price: 1500, stock: 20 },
          { name: "Pothos Hanging", description: "Trailing pothos in pot", price: 1200, stock: 30 },
          { name: "Succulent Set", description: "Set of 3 small succulents", price: 950, stock: 40 },
        ],
      },
      {
        name: "Home Décor",
        products: [
          { name: "Decorative Vase Set", description: "Set of 2 ceramic vases", price: 3500, stock: 15 },
          { name: "Wall Planter", description: "Mountable wall planter", price: 2200, stock: 20 },
          { name: "Candle Holder Set", description: "Wood and metal candle holders", price: 1850, stock: 25 },
          { name: "Indoor Herb Kit", description: "Basil, mint, rosemary starter kit", price: 1400, stock: 35 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding...");

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
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: { description: catData.description ?? undefined, isAgriculture: catData.isAgriculture ?? false },
      create: {
        name: catData.name,
        description: catData.description ?? null,
        isAgriculture: catData.isAgriculture ?? false,
      },
    });

    for (const sub of subcategories) {
      let subCategory = await prisma.subCategory.findFirst({
        where: { categoryId: category.id, name: sub.name },
      });
      if (!subCategory) {
        subCategory = await prisma.subCategory.create({
          data: {
            name: sub.name,
            description: sub.description ?? null,
            categoryId: category.id,
          },
        });
      }

      for (const prod of sub.products) {
        const existing = await prisma.product.findFirst({
          where: { subCategoryId: subCategory.id, name: prod.name },
        });
        if (!existing) {
          await prisma.product.create({
            data: {
              name: prod.name,
              description: prod.description ?? null,
              price: prod.price,
              stock: prod.stock,
              tags: prod.tags ?? [],
              subCategoryId: subCategory.id,
            },
          });
        }
      }
    }
  }

  const catCount = await prisma.category.count();
  const subCount = await prisma.subCategory.count();
  const prodCount = await prisma.product.count();
  console.log(`Categories: ${catCount}, Subcategories: ${subCount}, Products: ${prodCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
