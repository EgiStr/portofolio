import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load env same as app
dotenv.config({
  path: path.resolve(__dirname, "../../../packages/database/.env"),
});

console.log("--- Database Connection Check ---");
const dbUrl = process.env.DATABASE_URL;
console.log(
  "DATABASE_URL:",
  dbUrl ? dbUrl.replace(/:[^:]+@/, ":***@") : "Undefined",
);

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    console.log("Connecting to database...");
    const count = await prisma.project.count();
    console.log(`Total Projects found: ${count}`);

    if (count > 0) {
      const projects = await prisma.project.findMany({
        take: 5,
        select: { id: true, title: true, status: true },
      });
      console.log("Recent Projects:");
      console.table(projects);
    } else {
      console.log("No projects found in this database.");
    }
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
