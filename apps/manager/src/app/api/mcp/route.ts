import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { authenticateMcp } from "@/lib/mcp-auth";
import { CV_INSTRUCTIONS, registerCvTools } from "@/lib/mcp-cv";
import { LETTER_INSTRUCTIONS, registerLetterTools } from "@/lib/mcp-letters";
import {
  certifications,
  ContentError,
  experiences,
  posts,
  projects,
  settings,
  skills,
} from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTRUCTIONS = `Manager for eggisatria.my.id: blog posts, portfolio projects, work experience, skills, certifications and site settings. Read before you write: every update needs expectedUpdatedAt from your last read (skills have no updatedAt and are updated directly). Deletes are permanent and need confirm: true. Write only facts the owner gave you or that already exist in the records; do not invent employers, dates, numbers or links. No em dashes in public text. Changes show on the landing site within about 60 seconds and on the blog at once; settings refresh every app immediately.

${CV_INSTRUCTIONS}

${LETTER_INSTRUCTIONS}`;

const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});
const fail = (message: string) => ({ ...text(message), isError: true });

async function guard(fn: () => Promise<unknown>) {
  try {
    return text(await fn());
  } catch (e) {
    if (e instanceof ContentError) return fail(e.message);
    throw e;
  }
}

const str = (max: number) => z.string().max(max);
const opt = (max: number) => z.string().max(max).nullish();
const iso = z.string().describe("ISO date, e.g. 2024-03-01");
const confirm = z
  .literal(true)
  .describe("Must be true: the record is deleted permanently.");
const cas = z.string().describe("updatedAt from your last read of this record");

const post = {
  title: str(200).min(1),
  slug: str(200).regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens"),
  content: str(200_000).describe("Markdown"),
  excerpt: opt(500),
  coverImage: opt(1000),
  published: z.boolean().optional(),
  tags: z
    .array(str(50))
    .max(20)
    .optional()
    .describe(
      "Tag names; missing tags are created. Replaces the list on update.",
    ),
};
const project = {
  title: str(200).min(1),
  slug: str(200).regex(/^[a-z0-9-]+$/),
  description: str(2000).min(1),
  longDescription: opt(50_000),
  imageUrl: opt(1000),
  liveUrl: opt(1000),
  githubUrl: opt(1000),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  techStack: z
    .array(str(60))
    .max(30)
    .optional()
    .describe("Technology names. Replaces the list on update."),
};
const experience = {
  company: str(200).min(1),
  position: str(200).min(1),
  startDate: iso,
  endDate: iso.nullish(),
  current: z.boolean().optional(),
  description: opt(10_000),
  location: opt(200),
  companyUrl: opt(1000),
  companyLogo: opt(1000),
  order: z.number().int().optional(),
};
const skill = {
  name: str(100).min(1),
  category: z
    .enum(["LANGUAGE", "FRAMEWORK", "DATABASE", "DEVOPS", "TOOL", "OTHER"])
    .optional(),
  level: z.number().int().min(0).max(100).optional(),
  icon: opt(200),
  order: z.number().int().optional(),
};
const certification = {
  name: str(300).min(1),
  organization: str(200).min(1),
  issueDate: iso,
  credentialId: opt(200),
  verificationUrl: opt(1000),
  organizationLogo: opt(1000),
  certificateFile: opt(1000),
  category: z
    .enum([
      "MACHINE_LEARNING",
      "CLOUD_COMPUTING",
      "DATA_ANALYTICS",
      "WEB_DEVELOPMENT",
      "MOBILE_DEVELOPMENT",
      "DEVOPS",
      "CYBERSECURITY",
      "DATABASE",
      "OTHER",
    ])
    .optional(),
  displayOrder: z.number().int().optional(),
  skillIds: z
    .array(z.string())
    .max(50)
    .optional()
    .describe("Skill ids from skills_list. Replaces the list on update."),
};

/** Every field optional, for patches. */
function partial<T extends Record<string, z.ZodTypeAny>>(shape: T) {
  return Object.fromEntries(
    Object.entries(shape).map(([k, v]) => [k, v.optional()]),
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
}

function buildServer(actor: string) {
  const server = new McpServer(
    { name: "eggisatria-manager", version: "1.0.0" },
    { instructions: INSTRUCTIONS },
  );

  // Posts
  server.registerTool(
    "posts_list",
    {
      title: "List blog posts",
      description:
        "Posts newest first, without content. Filter by text or published state.",
      inputSchema: {
        q: z.string().optional(),
        published: z.boolean().optional(),
      },
    },
    async ({ q, published }) => guard(() => posts.list(q, published)),
  );
  server.registerTool(
    "posts_get",
    {
      title: "Read a blog post",
      description: "Full post including Markdown content, by id or slug.",
      inputSchema: { idOrSlug: z.string() },
    },
    async ({ idOrSlug }) => guard(() => posts.get(idOrSlug)),
  );
  server.registerTool(
    "posts_create",
    {
      title: "Create a blog post",
      description: "Drafts by default. published: true publishes it now.",
      inputSchema: post,
    },
    async (i) => guard(() => posts.create(i)),
  );
  server.registerTool(
    "posts_update",
    {
      title: "Update a blog post",
      description:
        "Change any fields. Publishing the first time sets publishedAt.",
      inputSchema: { id: z.string(), expectedUpdatedAt: cas, ...partial(post) },
    },
    async ({ id, expectedUpdatedAt, ...p }) =>
      guard(() => posts.update(id, expectedUpdatedAt, p)),
  );
  server.registerTool(
    "posts_delete",
    {
      title: "Delete a blog post",
      description:
        "Permanent, including its view counts. To hide a post instead, set published: false.",
      inputSchema: { id: z.string(), confirm },
    },
    async ({ id }) => guard(() => posts.remove(id)),
  );

  // Projects
  server.registerTool(
    "projects_list",
    {
      title: "List portfolio projects",
      description: "Projects in display order, without long descriptions.",
      inputSchema: {},
    },
    async () => guard(() => projects.list()),
  );
  server.registerTool(
    "projects_get",
    {
      title: "Read a project",
      description: "Full project by id or slug.",
      inputSchema: { idOrSlug: z.string() },
    },
    async ({ idOrSlug }) => guard(() => projects.get(idOrSlug)),
  );
  server.registerTool(
    "projects_create",
    {
      title: "Create a project",
      description:
        "Status DRAFT by default; PUBLISHED shows it on the landing site.",
      inputSchema: project,
    },
    async (i) => guard(() => projects.create(i)),
  );
  server.registerTool(
    "projects_update",
    {
      title: "Update a project",
      description: "Change any fields. ARCHIVED hides it without deleting.",
      inputSchema: {
        id: z.string(),
        expectedUpdatedAt: cas,
        ...partial(project),
      },
    },
    async ({ id, expectedUpdatedAt, ...p }) =>
      guard(() => projects.update(id, expectedUpdatedAt, p)),
  );
  server.registerTool(
    "projects_delete",
    {
      title: "Delete a project",
      description: "Permanent. To hide it instead, set status ARCHIVED.",
      inputSchema: { id: z.string(), confirm },
    },
    async ({ id }) => guard(() => projects.remove(id)),
  );

  // Experience
  server.registerTool(
    "experiences_list",
    {
      title: "List work experience",
      description: "All roles with descriptions.",
      inputSchema: {},
    },
    async () => guard(() => experiences.list()),
  );
  server.registerTool(
    "experiences_create",
    {
      title: "Add a role",
      description:
        "A job or internship. Leave endDate empty and set current: true for the present role.",
      inputSchema: experience,
    },
    async (i) => guard(() => experiences.create(i)),
  );
  server.registerTool(
    "experiences_update",
    {
      title: "Update a role",
      description: "Change any fields. endDate: null clears it.",
      inputSchema: {
        id: z.string(),
        expectedUpdatedAt: cas,
        ...partial(experience),
      },
    },
    async ({ id, expectedUpdatedAt, ...p }) =>
      guard(() => experiences.update(id, expectedUpdatedAt, p)),
  );
  server.registerTool(
    "experiences_delete",
    {
      title: "Delete a role",
      description: "Permanent.",
      inputSchema: { id: z.string(), confirm },
    },
    async ({ id }) => guard(() => experiences.remove(id)),
  );

  // Skills
  server.registerTool(
    "skills_list",
    {
      title: "List skills",
      description:
        "Skills by category with ids (certifications link to these ids).",
      inputSchema: {},
    },
    async () => guard(() => skills.list()),
  );
  server.registerTool(
    "skills_create",
    {
      title: "Add a skill",
      description: "level is 0 to 100.",
      inputSchema: skill,
    },
    async (i) => guard(() => skills.create(i)),
  );
  server.registerTool(
    "skills_update",
    {
      title: "Update a skill",
      description:
        "Skills have no updatedAt, so this writes directly without a conflict check.",
      inputSchema: { id: z.string(), ...partial(skill) },
    },
    async ({ id, ...p }) => guard(() => skills.update(id, p)),
  );
  server.registerTool(
    "skills_delete",
    {
      title: "Delete a skill",
      description: "Permanent; also unlinks it from certifications.",
      inputSchema: { id: z.string(), confirm },
    },
    async ({ id }) => guard(() => skills.remove(id)),
  );

  // Certifications
  server.registerTool(
    "certifications_list",
    {
      title: "List certifications",
      description: "Certifications with their linked skills.",
      inputSchema: {},
    },
    async () => guard(() => certifications.list()),
  );
  server.registerTool(
    "certifications_create",
    {
      title: "Add a certification",
      description: "Link skills with skillIds from skills_list.",
      inputSchema: certification,
    },
    async (i) => guard(() => certifications.create(i)),
  );
  server.registerTool(
    "certifications_update",
    {
      title: "Update a certification",
      description:
        "Change any fields. skillIds replaces the linked skills only when sent.",
      inputSchema: {
        id: z.string(),
        expectedUpdatedAt: cas,
        ...partial(certification),
      },
    },
    async ({ id, expectedUpdatedAt, ...p }) =>
      guard(() => certifications.update(id, expectedUpdatedAt, p)),
  );
  server.registerTool(
    "certifications_delete",
    {
      title: "Delete a certification",
      description: "Permanent.",
      inputSchema: { id: z.string(), confirm },
    },
    async ({ id }) => guard(() => certifications.remove(id)),
  );

  // Settings
  server.registerTool(
    "settings_get",
    {
      title: "Read site settings",
      description:
        "Profile, landing copy, blog options, social links and SEO used by every app.",
      inputSchema: {},
    },
    async () => guard(() => settings.get()),
  );
  server.registerTool(
    "settings_update",
    {
      title: "Update site settings",
      description:
        "Send only the keys to change, using the key names from settings_get. Unknown keys are rejected.",
      inputSchema: { values: z.record(z.unknown()) },
    },
    async ({ values }) => guard(() => settings.update(values)),
  );

  registerCvTools(server, actor);
  registerLetterTools(server, actor);

  return server;
}

async function handle(req: Request) {
  const key = await authenticateMcp(req);
  if (!key) {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "Unauthorized: send an active API key labelled zia... or manager... as a Bearer token.",
        },
        id: null,
      },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }
  // Stateless: a fresh server and transport per request, as on Vercel functions.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await buildServer(`mcp:${key.name}`).connect(transport);
  return transport.handleRequest(req);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
