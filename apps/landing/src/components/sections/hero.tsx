"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Twitter,
  Youtube,
  Instagram,
} from "lucide-react";
import Link from "next/link";

interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  email?: string;
}

interface HeroProps {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  socialLinks?: SocialLinks;
  resumeUrl?: string; // Not used in Hero directly but good to have if we add a button
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
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

export function Hero({
  heroTitle = "Hi, my name is Eggi Satria.",
  heroSubtitle = "I build things for the web.",
  heroDescription = "I'm a full-stack developer specializing in building exceptional digital experiences.",
  socialLinks,
}: HeroProps) {
  const links = [
    {
      name: "GitHub",
      href: socialLinks?.github
        ? `https://github.com/${socialLinks.github}`
        : null,
      icon: Github,
    },
    {
      name: "LinkedIn",
      href: socialLinks?.linkedin
        ? `https://linkedin.com/in/${socialLinks.linkedin}`
        : null,
      icon: Linkedin,
    },
    {
      name: "Twitter",
      href: socialLinks?.twitter
        ? `https://twitter.com/${socialLinks.twitter.replace("@", "")}`
        : null,
      icon: Twitter,
    },
    {
      name: "Instagram",
      href: socialLinks?.instagram
        ? `https://instagram.com/${socialLinks.instagram.replace("@", "")}`
        : null,
      icon: Instagram,
    },
    { name: "YouTube", href: socialLinks?.youtube, icon: Youtube },
    {
      name: "Email",
      href: socialLinks?.email ? `mailto:${socialLinks.email}` : null,
      icon: Mail,
    },
  ].filter((link) => link.href);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto text-center lg:text-left"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting */}
        <motion.p
          variants={itemVariants}
          className="text-primary font-mono text-sm md:text-base mb-4"
        >
          Hi, my name is
        </motion.p>

        {/* Name/Title */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {heroTitle}
        </h1>

        {/* Subtitle - LCP Element */}
        <h2
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-muted-foreground mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {heroSubtitle}
        </h2>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground text-base md:text-lg max-w-xl mb-8 leading-relaxed lg:mx-0 mx-auto"
        >
          {heroDescription}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
        >
          <Link
            href="#projects"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View My Work
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="https://notes.eggisatria.dev"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-300"
          >
            Read My Blog
            <ExternalLink className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Social Links */}
        <motion.div
          variants={itemVariants}
          className="flex gap-6 justify-center lg:justify-start"
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
              aria-label={link.name}
            >
              <link.icon className="w-6 h-6" />
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <motion.div className="w-1 h-2 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
