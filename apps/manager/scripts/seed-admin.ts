import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { hash } from "bcryptjs";

dotenv.config({
  path: path.resolve(__dirname, "../../../packages/database/.env"),
});

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log("Seeding admin user...");

    const hashedPassword = await hash("admin", 12); // Default password 'admin'

    // Upsert the user to match the hardcoded ID in auth.ts
    const user = await prisma.user.upsert({
      where: { email: "admin@eggisatria.dev" },
      update: {},
      create: {
        id: "1", // Matches the mock ID in auth.ts
        email: "admin@eggisatria.dev",
        name: "Eggi Satria",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(
      `Admin user seeded successfully: ${user.email} (ID: ${user.id})`,
    );
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
