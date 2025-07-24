import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs"; 

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminEmail = "admin@zivalandscaping.co.ke";
  const adminPassword = "securepassword123"; // Plain text for demo; hash in production
  const hashedPassword = await hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword, 
      role: "admin",
    },
  });

  console.log("Seeded admin user:", adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });