"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Award,
  ExternalLink,
  Calendar,
  Search,
  X,
  FileText,
} from "lucide-react";
import { Badge } from "@ecosystem/ui";

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

const CATEGORY_LABELS: Record<string, string> = {
  MACHINE_LEARNING: "Machine Learning",
  CLOUD_COMPUTING: "Cloud Computing",
  DATA_ANALYTICS: "Data Analytics",
  WEB_DEVELOPMENT: "Web Development",
  MOBILE_DEVELOPMENT: "Mobile Development",
  DEVOPS: "DevOps",
  CYBERSECURITY: "Cybersecurity",
  DATABASE: "Database",
  OTHER: "Other",
};

export interface CertificationSkill {
  skill: {
    id: string;
    name: string;
  };
}

export interface CertificationItem {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  credentialId: string | null;
  verificationUrl: string | null;
  organizationLogo: string | null;
  certificateFile: string | null;
  category: string;
  skills: CertificationSkill[];
}

interface CertificationsProps {
  certifications?: CertificationItem[];
}

export function Certifications({ certifications = [] }: CertificationsProps) {
  const [selectedCert, setSelectedCert] = useState<CertificationItem | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  if (certifications.length === 0) {
    return null;
  }

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.organization.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || cert.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(
    new Set(certifications.map((c) => c.category)),
  );

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section id="certifications" className="py-24 px-6 lg:px-8">
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
          <span className="text-primary font-mono text-lg">04.</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Certifications
          </h2>
          <div className="flex-1 h-px bg-border ml-4" />
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search certifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertifications.map((cert, index) => (
            <motion.div
              key={cert.id}
              variants={itemVariants}
              className="group relative bg-card border border-border rounded-lg p-6 cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
              onClick={() => setSelectedCert(cert)}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10">
                {/* Logo */}
                {cert.organizationLogo && (
                  <div className="mb-4 flex items-center justify-center h-16">
                    <img
                      src={cert.organizationLogo}
                      alt={cert.organization}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {/* Organization */}
                <p className="text-sm text-primary font-mono mb-2">
                  {cert.organization}
                </p>

                {/* Certification Name */}
                <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                  {cert.name}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(cert.issueDate)}</span>
                </div>

                {/* Credential ID */}
                {cert.credentialId && (
                  <p className="text-xs text-muted-foreground mb-3 font-mono">
                    ID: {cert.credentialId}
                  </p>
                )}

                {/* Category Badge */}
                <Badge variant="secondary" className="mb-3">
                  {CATEGORY_LABELS[cert.category]}
                </Badge>

                {/* Skills */}
                {cert.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {cert.skills.slice(0, 3).map((s) => (
                      <span
                        key={s.skill.id}
                        className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground"
                      >
                        {s.skill.name}
                      </span>
                    ))}
                    {cert.skills.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">
                        +{cert.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover Icon */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Award className="w-5 h-5 text-primary" />
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCertifications.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No certifications found matching your criteria.
          </p>
        )}
      </motion.div>

      {/* Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCert(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-lg max-w-2xl w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            {selectedCert.organizationLogo && (
              <div className="mb-6 flex items-center justify-center h-20">
                <img
                  src={selectedCert.organizationLogo}
                  alt={selectedCert.organization}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            {/* Organization */}
            <p className="text-primary font-mono mb-2">
              {selectedCert.organization}
            </p>

            {/* Name */}
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {selectedCert.name}
            </h3>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Issued: {formatDate(selectedCert.issueDate)}</span>
              </div>
              {selectedCert.credentialId && (
                <p className="text-muted-foreground font-mono text-sm">
                  Credential ID: {selectedCert.credentialId}
                </p>
              )}
              <Badge variant="secondary">
                {CATEGORY_LABELS[selectedCert.category]}
              </Badge>
            </div>

            {/* Skills */}
            {selectedCert.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Related Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCert.skills.map((s) => (
                    <span
                      key={s.skill.id}
                      className="px-3 py-1 bg-secondary rounded text-sm text-secondary-foreground"
                    >
                      {s.skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {selectedCert.certificateFile && (
                <a
                  href={selectedCert.certificateFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Certificate
                </a>
              )}
              {selectedCert.verificationUrl && (
                <a
                  href={selectedCert.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify on Provider
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
