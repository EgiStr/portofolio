"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";

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

export function Contact() {
  return (
    <section id="contact" className="py-24 px-6 lg:px-8">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Section Title */}
        <motion.div variants={itemVariants} className="mb-4">
          <span className="text-primary font-mono text-lg">
            05. What&apos;s Next?
          </span>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold text-foreground mb-6"
        >
          Get In Touch
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-muted-foreground text-lg mb-12 leading-relaxed"
        >
          I&apos;m currently open for new opportunities and my inbox is always
          open. Whether you have a question, want to collaborate on a project,
          or just want to say hi, I&apos;ll try my best to get back to you!
        </motion.p>

        <motion.div variants={itemVariants}>
          <a
            href="mailto:eggisatria2310@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-lg font-medium"
          >
            <Mail className="w-5 h-5" />
            Say Hello
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
