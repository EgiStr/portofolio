import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@ecosystem/database";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Calendar,
  Folder,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all published projects
export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// Generate dynamic metadata for SEO

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eggisatria.dev";
  const url = `${baseUrl}/portfolio/${project.slug}`;
  const ogImage = project.imageUrl || `${baseUrl}/opengraph-image.png`;
  const description = project.description.slice(0, 160);
  const keywords = project.techStack.map((t) => t.name).join(", ");

  return {
    title: project.title,
    description,
    keywords: keywords || undefined,
    authors: project.author
      ? [{ name: project.author.name || "Eggi Satria" }]
      : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: project.title,
      description,
      type: "article",
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
      authors: project.author
        ? [project.author.name || "Eggi Satria"]
        : undefined,
      tags: project.techStack.map((t) => t.name),
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [ogImage],
    },
  };
}

async function getProject(slug: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        techStack: true,
        author: {
          select: { name: true, image: true },
        },
      },
    });
    return project;
  } catch (error) {
    console.error(`Error fetching project for slug: ${slug}`, error);
    return null;
  }
}

export const revalidate = 60;

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: `https://eggisatria.dev/portfolio/${project.slug}`,
    image: project.imageUrl || undefined,
    dateCreated: project.createdAt.toISOString(),
    dateModified: project.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: project.author?.name || "Eggi Satria",
      url: "https://eggisatria.dev",
    },
    keywords: project.techStack.map((t) => t.name).join(", "),
    ...(project.githubUrl && { codeRepository: project.githubUrl }),
    ...(project.liveUrl && { mainEntityOfPage: project.liveUrl }),
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
              href="/portfolio"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Link>
            <span className="text-2xl font-bold text-primary">Portfolio</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
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
              <li>
                <Link
                  href="/portfolio"
                  className="hover:text-foreground transition-colors"
                >
                  Portfolio
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium">{project.title}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <article>
            {/* Project Image */}
            <div className="aspect-video bg-secondary/50 rounded-xl overflow-hidden mb-8 relative">
              {project.imageUrl ? (
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Folder className="w-16 h-16 text-primary/40 mx-auto mb-2" />
                    <span className="text-muted-foreground">
                      No preview available
                    </span>
                  </div>
                </div>
              )}
              {project.featured && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Featured
                </span>
              )}
            </div>

            {/* Project Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <Calendar className="w-4 h-4" />
                <time dateTime={project.createdAt.toISOString()}>
                  {new Date(project.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {project.featured && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      Featured Project
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {project.title}
              </h1>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-6">
                {project.techStack.map((tech) => (
                  <span
                    key={tech.id}
                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                  >
                    {tech.name}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Live Demo
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    View Source Code
                  </a>
                )}
              </div>
            </header>

            {/* Description */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                About this Project
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {project.description}
              </p>
            </section>

            {/* Long Description */}
            {project.longDescription && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Details
                </h2>
                <div className="prose prose-invert max-w-none">
                  {project.longDescription
                    .split("\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-muted-foreground leading-relaxed mb-4"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </section>
            )}

            {/* Technologies Used */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Technologies Used
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {project.techStack.map((tech) => (
                  <div
                    key={tech.id}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                  >
                    {tech.icon ? (
                      <Image
                        src={tech.icon}
                        alt={tech.name}
                        width={24}
                        height={24}
                        className="rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {tech.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {tech.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </article>

          {/* CTA */}
          <section className="text-center mt-16 p-8 bg-card border border-border rounded-xl">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Interested in working together?
            </h2>
            <p className="text-muted-foreground mb-6">
              Let&apos;s discuss your next project and bring your ideas to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get In Touch
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                View All Projects
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Eggi Satria. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
