import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Github, Folder, ArrowLeft } from "lucide-react";
import { prisma } from "@ecosystem/database";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Explore my collection of projects showcasing full-stack development, from web applications to open-source contributions.",
  openGraph: {
    title: "Portfolio | Eggi Satria",
    description:
      "Explore my collection of projects showcasing full-stack development, from web applications to open-source contributions.",
    type: "website",
    url: "/portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio | Eggi Satria",
    description:
      "Explore my collection of projects showcasing full-stack development, from web applications to open-source contributions.",
  },
  alternates: {
    canonical: "/portfolio",
  },
};

export const revalidate = 60;

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    include: { techStack: true },
    orderBy: [
      { featured: "desc" },
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
  });
  return projects;
}

export default async function PortfolioPage() {
  const projects = await getProjects();

  // JSON-LD for portfolio collection
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Portfolio - Eggi Satria",
    description:
      "A collection of projects showcasing full-stack development expertise.",
    url: "https://eggisatria.dev/portfolio",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CreativeWork",
          name: project.title,
          description: project.description,
          url: `https://eggisatria.dev/portfolio/${project.slug}`,
          image: project.imageUrl || undefined,
        },
      })),
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <span className="text-2xl font-bold text-primary">Portfolio</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          {/* Breadcrumb for SEO */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium">Portfolio</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              My Projects
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A collection of projects I&apos;ve worked on, from full-stack
              applications to open-source contributions. Each project represents
              my passion for building impactful digital experiences.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/portfolio/${project.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary hover:-translate-y-2 transition-all duration-300"
              >
                {/* Project Image */}
                <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Folder className="w-12 h-12 text-primary/40" />
                      </div>
                    </>
                  )}
                  {project.featured && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                      Featured
                    </span>
                  )}
                </div>

                {/* Project Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-primary font-medium">
                      {project.status === "PUBLISHED" ? "Live" : "In Progress"}
                    </span>
                    <div className="flex gap-2">
                      {project.githubUrl && (
                        <span
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="GitHub Repository"
                        >
                          <Github className="w-4 h-4" />
                        </span>
                      )}
                      {project.liveUrl && (
                        <span
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Live Demo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h2>

                  <p className="text-muted-foreground text-sm flex-1 mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.techStack?.slice(0, 4).map((tech) => (
                      <span
                        key={tech.id}
                        className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded"
                      >
                        {tech.name}
                      </span>
                    ))}
                    {project.techStack?.length > 4 && (
                      <span className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded">
                        +{project.techStack.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="text-center py-20">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No projects found</p>
            </div>
          )}

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Projects Completed", value: projects.length || "25+" },
              { label: "Years Experience", value: "3+" },
              { label: "Technologies Used", value: "20+" },
              { label: "GitHub Stars", value: "20+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 bg-card border border-border rounded-xl"
              >
                <p className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Interested in working together?
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Get In Touch
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Eggi Satria. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
