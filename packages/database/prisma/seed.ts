import { PrismaClient, UserRole } from "@prisma/client";
import { defaultSettings } from "@ecosystem/config";

const prisma = new PrismaClient();

async function main() {
  console.log("YO Starting database seed...");

  // 1. Clean existing data (optional, be careful in prod)
  // await prisma.projectTech.deleteMany();
  // await prisma.project.deleteMany();
  // await prisma.skill.deleteMany();
  // await prisma.experience.deleteMany();
  // await prisma.siteConfig.deleteMany();
  // await prisma.user.deleteMany();

  // 2. Create Admin User
  const adminEmail = "admin@example.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let user;
  if (!existingUser) {
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Eggi Satria",
        role: UserRole.ADMIN,
        image: "/eggisatria.png",
      },
    });
    console.log("Y Created admin user:", user.email);
  } else {
    user = existingUser;
    console.log("Y Admin user already exists:", user.email);
  }

  // 3. Site Configuration
  //    Seed every key defined in `@ecosystem/config/defaults` so first-time
  //    deploys render non-empty values across all consumer apps. Idempotent:
  //    wipe existing rows first, then re-insert from defaults.
  const siteConfigEntries = Object.entries(defaultSettings).map(
    ([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }),
  );

  await prisma.siteConfig.deleteMany();
  await prisma.siteConfig.createMany({ data: siteConfigEntries });
  console.log(
    `ST Seeded ${siteConfigEntries.length} site configuration keys from @ecosystem/config defaults`,
  );

  // 4. Skills
  const skills = [
    { name: "TypeScript", category: "LANGUAGE", level: 90 },
    { name: "React", category: "FRAMEWORK", level: 95 },
    { name: "Next.js", category: "FRAMEWORK", level: 95 },
    { name: "Node.js", category: "FRAMEWORK", level: 85 },
    { name: "TailwindCSS", category: "FRAMEWORK", level: 95 },
    { name: "PostgreSQL", category: "DATABASE", level: 80 },
    { name: "Prisma", category: "TOOL", level: 85 },
    { name: "Docker", category: "DEVOPS", level: 70 },
  ];

  for (const skill of skills) {
    await prisma.skill.create({
      data: {
        name: skill.name,
        category: skill.category as any,
        level: skill.level,
      },
    });
  }
  console.log("Y> Seeded skills");

  // 5. Experiences
  const experiences = [
    {
      company: "Tech Startup Inc.",
      position: "Senior Frontend Engineer",
      startDate: new Date("2023-01-01"),
      current: true,
      description:
        "Leading the frontend migration to Next.js.\nMentoring junior developers.\nImplementing design system.",
      order: 1,
    },
    {
      company: "Digital Agency",
      position: "Full Stack Developer",
      startDate: new Date("2021-06-01"),
      endDate: new Date("2022-12-31"),
      current: false,
      description:
        "Built multiple e-commerce sites using Shopify and Next.js.\nManaged database schema design and API development.",
      order: 2,
    },
  ];

  for (const exp of experiences) {
    await prisma.experience.create({
      data: exp,
    });
  }
  console.log("Y Seeded experiences");

  // 6. Projects
  const projects = [
    {
      title: "E-Commerce Dashboard",
      slug: "ecommerce-dashboard",
      description:
        "A comprehensive dashboard for managing online stores, featuring real-time analytics and inventory management.",
      featured: true,
      imageUrl: "/projects/dashboard.png", // Placeholder, ensure this exists or use a remote URL
      githubUrl: "https://github.com/EgiStr/dashboard",
      liveUrl: "https://dashboard-demo.eggisatria.dev",
      status: "PUBLISHED",
      tags: ["Next.js", "TailwindCSS", "Prisma", "PostgreSQL"],
    },
    {
      title: "Social Media App",
      slug: "social-media-app",
      description:
        "A social platform connecting developers, with features like code snippets sharing and pair programming requests.",
      featured: true,
      imageUrl: "/projects/social.png",
      githubUrl: "https://github.com/EgiStr/social",
      liveUrl: "https://social-demo.eggisatria.dev",
      status: "PUBLISHED",
      tags: ["React", "Node.js", "Socket.io", "Redis"],
    },
    {
      title: "Portfolio v1",
      slug: "portfolio-v1",
      description:
        "My first portfolio website built with simple HTML/CSS and JavaScript.",
      featured: false,
      githubUrl: "https://github.com/EgiStr/portfolio-v1",
      status: "ARCHIVED",
      tags: ["HTML", "CSS", "JavaScript"],
    },
  ];

  for (const project of projects) {
    const { tags, ...projectData } = project;
    const createdProject = await prisma.project.create({
      data: {
        ...projectData,
        status: projectData.status as any,
        authorId: user.id,
        techStack: {
          create: tags.map((tag) => ({ name: tag })),
        },
      },
    });
  }
  console.log("Y Seeded projects");

  console.log("o. Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("?O Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
