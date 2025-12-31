import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../../packages/database/.env"),
});

const prisma = new PrismaClient();

async function testWrite() {
  try {
    console.log("Attempting to create a test project...");
    const project = await prisma.project.create({
      data: {
        title: "Test Project " + Date.now(),
        slug: "test-project-" + Date.now(),
        description: "This is a test project to verify database writes.",
        status: "DRAFT",
        authorId: "user_2rhS5b3y5j3q5q5q5q5q5q5q5", // We might need a valid user ID if FK constraint exists
      },
    });
    console.log("Successfully created project:", project.id);

    // Clean up
    await prisma.project.delete({ where: { id: project.id } });
    console.log("Successfully deleted test project.");
  } catch (error) {
    console.error("Write test failed:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      console.log("Foreign key constraint failed. Need valid user ID.");
      // Try finding a user first
      const user = await prisma.user.findFirst();
      if (user) {
        console.log("Found user, retrying with user:", user.id);
        const project = await prisma.project.create({
          data: {
            title: "Test Project " + Date.now(),
            slug: "test-project-" + Date.now(),
            description: "This is a test project.",
            status: "DRAFT",
            authorId: user.id,
          },
        });
        console.log(
          "Successfully created project with existing user:",
          project.id,
        );
        await prisma.project.delete({ where: { id: project.id } });
        console.log("Successfully deleted test project.");
      } else {
        console.log("No users found to attach project to.");
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testWrite();
