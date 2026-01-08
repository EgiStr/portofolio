"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github, Folder, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  status: string;
  techStack: { techName: string }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function Projects({ initialProjects }: { initialProjects?: Project[] }) {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>(
    initialProjects?.filter((p) => p.featured) || [],
  );
  const [otherProjects, setOtherProjects] = useState<Project[]>(
    initialProjects?.filter((p) => !p.featured).slice(0, 3) || [],
  );
  const [isLoading, setIsLoading] = useState(!initialProjects);

  useEffect(() => {
    if (initialProjects) return;

    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data: Project[] = await response.json();
          setFeaturedProjects(data.filter((p) => p.featured));
          setOtherProjects(data.filter((p) => !p.featured).slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, [initialProjects]);

  async function handleProjectClick(projectId: string) {
    try {
      await fetch(`/api/projects/${projectId}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
  }

  if (isLoading) {
    return (
      <section id="projects" className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-24 px-6 lg:px-8">
      <motion.div
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Section Title */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-primary font-mono text-lg">03.</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Some Things I&apos;ve Built
          </h2>
          <div className="flex-1 h-px bg-border ml-4" />
        </motion.div>

        {/* Featured Projects */}
        <div className="space-y-24 mb-24">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className={`relative grid md:grid-cols-12 gap-4 items-center ${
                index % 2 === 0 ? "" : "md:text-right"
              }`}
            >
              {/* Project Image */}
              <div
                className={`md:col-span-7 relative group ${
                  index % 2 === 0 ? "md:col-start-1" : "md:col-start-6"
                }`}
              >
                <Link href={`/portfolio/${project.slug}`}>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-300 z-10" />
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🚀
                      </div>
                    )}
                  </div>
                </Link>
              </div>

              {/* Project Info */}
              <div
                className={`md:col-span-6 md:row-start-1 relative z-10 ${
                  index % 2 === 0
                    ? "md:col-start-6 md:text-right"
                    : "md:col-start-1"
                }`}
              >
                <p className="text-primary font-mono text-sm mb-2">
                  Featured Project
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="hover:text-primary transition-colors"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    {project.title}
                  </Link>
                </h3>
                <div className="bg-secondary/80 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-4">
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
                <ul
                  className={`flex flex-wrap gap-3 text-sm font-mono text-muted-foreground mb-4 ${
                    index % 2 === 0 ? "md:justify-end" : ""
                  }`}
                >
                  {project.techStack?.map((tech) => (
                    <li key={tech.techName}>{tech.techName}</li>
                  ))}
                </ul>
                <div
                  className={`flex gap-4 ${index % 2 === 0 ? "md:justify-end" : ""}`}
                >
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="GitHub Repository"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Live Demo"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other Projects */}
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Other EgiStr Projects
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="bg-secondary/50 rounded-lg p-6 flex flex-col h-full group"
              >
                <div className="flex justify-between items-center mb-4">
                  <Folder className="w-10 h-10 text-primary" />
                  <div className="flex gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`GitHub Repository for ${project.title}`}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Live Demo for ${project.title}`}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  <Link href={`/portfolio/${project.slug}`}>
                    {project.title}
                  </Link>
                </h4>
                <p className="text-muted-foreground text-sm flex-1 mb-4">
                  {project.description}
                </p>
                <ul className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
                  {project.techStack?.map((tech) => (
                    <li key={tech.techName}>{tech.techName}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* View All Link */}
        <motion.div variants={itemVariants} className="text-center mt-12">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View All Projects
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
