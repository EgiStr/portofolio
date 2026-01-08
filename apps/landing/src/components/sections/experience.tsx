"use client";

import { motion } from "framer-motion";
import { useState } from "react";

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

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string[];
}

interface ExperienceProps {
  experiences?: ExperienceItem[];
}

export function Experience({ experiences = [] }: ExperienceProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (experiences.length === 0) {
    return null;
  }

  return (
    <section id="experience" className="py-24 px-6 lg:px-8">
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
          <span className="text-primary font-mono text-lg">03.</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Where I&apos;ve Worked
          </h2>
          <div className="flex-1 h-px bg-border ml-4" />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row gap-8"
        >
          {/* Tab Navigation */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-l border-border">
            {experiences.map((exp, index) => (
              <button
                key={exp.id}
                onClick={() => setActiveTab(index)}
                className={`relative px-4 py-3 text-sm font-mono text-left whitespace-nowrap transition-colors duration-200 ${
                  activeTab === index
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                {exp.company}
                {activeTab === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 md:bottom-auto md:left-0 left-0 right-0 md:right-auto h-0.5 md:h-full md:w-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-[300px]">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-foreground mb-1">
                {experiences[activeTab].position}{" "}
                <span className="text-primary">
                  @ {experiences[activeTab].company}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground font-mono mb-4">
                {experiences[activeTab].period}
              </p>
              <ul className="space-y-3">
                {experiences[activeTab].description.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <span className="text-primary mt-1.5">▹</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
