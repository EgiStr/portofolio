import type { Column } from "@/components/database/fields";
import type { Section } from "./record-document";
import type { DocResource } from "@/actions/content";

/** Field layout for each record document, shared by the edit and new pages. */
type DocConfig = {
  resource: DocResource;
  listHref: string;
  titleKey: string;
  titlePlaceholder: string;
  properties: Column[];
  sections: Section[];
  required: string[];
  defaults: Record<string, unknown>;
};

export const projectDoc: DocConfig = {
  resource: "projects",
  listHref: "/dashboard/projects",
  titleKey: "title",
  titlePlaceholder: "Project name",
  properties: [
    { key: "slug", label: "Slug", type: "text", mono: true, required: true },
    {
      key: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "PUBLISHED", label: "Published", tone: "accent" },
        { value: "DRAFT", label: "Draft" },
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
    { key: "featured", label: "Featured", type: "checkbox" },
    { key: "techStack", label: "Tech stack", type: "tags" },
    { key: "liveUrl", label: "Live site", type: "url" },
    { key: "githubUrl", label: "Repository", type: "url" },
    { key: "displayOrder", label: "Order", type: "number", min: 0 },
  ],
  sections: [
    {
      kind: "text",
      key: "description",
      label: "Summary",
      placeholder: "One or two sentences for the project card.",
    },
    {
      kind: "text",
      key: "longDescription",
      label: "Details",
      placeholder: "What it does, how it was built, what you learned.",
    },
    {
      kind: "image",
      key: "imageUrl",
      label: "Cover image",
      bucket: "projects",
      aspect: "video",
    },
  ],
  required: ["title", "slug", "description"],
  defaults: {
    title: "",
    slug: "",
    description: "",
    status: "DRAFT",
    featured: false,
    techStack: [],
    displayOrder: 0,
  },
};

export const experienceDoc: DocConfig = {
  resource: "experiences",
  listHref: "/dashboard/experiences",
  titleKey: "position",
  titlePlaceholder: "Position",
  properties: [
    { key: "company", label: "Company", type: "text", required: true },
    { key: "location", label: "Location", type: "text" },
    { key: "startDate", label: "Start", type: "date", required: true },
    { key: "endDate", label: "End", type: "date" },
    { key: "current", label: "Current role", type: "checkbox" },
    { key: "companyUrl", label: "Company site", type: "url" },
    { key: "order", label: "Order", type: "number", min: 0 },
  ],
  sections: [
    {
      kind: "text",
      key: "description",
      label: "Description",
      placeholder: "What you did there.",
    },
    {
      kind: "image",
      key: "companyLogo",
      label: "Company logo",
      bucket: "avatars",
      aspect: "square",
    },
  ],
  required: ["position", "company", "startDate"],
  defaults: { position: "", company: "", startDate: null, current: false },
};

export const skillCategories = [
  { value: "LANGUAGE", label: "Language" },
  { value: "FRAMEWORK", label: "Framework" },
  { value: "DATABASE", label: "Database" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "TOOL", label: "Tool" },
  { value: "OTHER", label: "Other" },
];

export const skillDoc: DocConfig = {
  resource: "skills",
  listHref: "/dashboard/skills",
  titleKey: "name",
  titlePlaceholder: "Skill name",
  properties: [
    {
      key: "category",
      label: "Category",
      type: "select",
      required: true,
      options: skillCategories,
    },
    {
      key: "level",
      label: "Level (0 to 100)",
      type: "number",
      min: 0,
      max: 100,
    },
    { key: "icon", label: "Icon", type: "text", mono: true },
    { key: "order", label: "Order", type: "number", min: 0 },
  ],
  sections: [],
  required: ["name"],
  defaults: { name: "", category: "OTHER" },
};

export const certificationCategories = [
  { value: "MACHINE_LEARNING", label: "Machine learning" },
  { value: "CLOUD_COMPUTING", label: "Cloud computing" },
  { value: "DATA_ANALYTICS", label: "Data analytics" },
  { value: "WEB_DEVELOPMENT", label: "Web development" },
  { value: "MOBILE_DEVELOPMENT", label: "Mobile development" },
  { value: "DEVOPS", label: "DevOps" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "DATABASE", label: "Database" },
  { value: "OTHER", label: "Other" },
];

export function certificationDoc(
  skillOptions: { value: string; label: string }[],
): DocConfig {
  return {
    resource: "certifications",
    listHref: "/dashboard/certifications",
    titleKey: "name",
    titlePlaceholder: "Certificate name",
    properties: [
      { key: "organization", label: "Issuer", type: "text", required: true },
      {
        key: "category",
        label: "Category",
        type: "select",
        required: true,
        options: certificationCategories,
      },
      { key: "issueDate", label: "Issued", type: "date", required: true },
      { key: "credentialId", label: "Credential ID", type: "text", mono: true },
      { key: "verificationUrl", label: "Verify at", type: "url" },
      { key: "displayOrder", label: "Order", type: "number", min: 0 },
    ],
    sections: [
      { kind: "skills", label: "Skills", options: skillOptions },
      {
        kind: "image",
        key: "organizationLogo",
        label: "Issuer logo",
        bucket: "avatars",
        aspect: "square",
      },
      {
        kind: "file",
        key: "certificateFile",
        label: "Certificate file",
        bucket: "certificates",
      },
    ],
    required: ["name", "organization", "issueDate"],
    defaults: {
      name: "",
      organization: "",
      category: "OTHER",
      issueDate: null,
      skillIds: [],
      displayOrder: 0,
    },
  };
}
