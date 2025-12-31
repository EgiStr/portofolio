"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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

interface AboutProps {
  description?: string;
  skills?: string[];
  profileImage?: string;
}

export function About({ description, skills = [], profileImage }: AboutProps) {
  return (
    <section id="about" className="py-24 px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
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
          <span className="text-primary font-mono text-lg">01.</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            About Me
          </h2>
          <div className="flex-1 h-px bg-border ml-4" />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Text Content */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-4"
          >
            {description ? (
              <div
                className="text-muted-foreground leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              // Fallback content in case DB is empty
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Hello! I&apos;m Eggi, a passionate full-stack developer based
                  in Indonesia. I enjoy creating things that live on the
                  internet, whether that be websites, applications, or anything
                  in between.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  My goal is to always build products that provide
                  pixel-perfect, performant experiences.
                </p>
              </>
            )}

            {/* Skills Grid */}
            {skills.length > 0 && (
              <>
                <p className="text-muted-foreground leading-relaxed pt-4">
                  Here are a few technologies I&apos;ve been working with
                  recently:
                </p>
                <ul className="grid grid-cols-2 gap-2 mt-4">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary">▹</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>

          {/* Profile Image */}
          <motion.div
            variants={itemVariants}
            className="relative group mx-auto w-full max-w-[300px] lg:max-w-none"
          >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-secondary">
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-300 z-10" />
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">👨‍💻</span>
                </div>
              )}
            </div>
            {/* Border effect */}
            <div className="absolute top-4 left-4 w-full h-full border-2 border-primary rounded-lg -z-10 group-hover:top-2 group-hover:left-2 transition-all duration-300" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
