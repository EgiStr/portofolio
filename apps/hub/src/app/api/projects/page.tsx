import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function ProjectsApiPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/api/authentication" },
          { title: "Projects" },
        ]}
      />

      <h1>Projects API</h1>
      <p className="lead">
        Read-only access to the published projects shown on the landing page.
      </p>

      <h2>Endpoint</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>GET</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/v1/projects`}
          </pre>
        </div>
      </div>

      <h2>Query parameters</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>featured</code>
            </td>
            <td>
              <code>"true" | "false"</code>
            </td>
            <td>—</td>
            <td>Only return projects marked as featured.</td>
          </tr>
          <tr>
            <td>
              <code>limit</code>
            </td>
            <td>
              <code>1..100</code>
            </td>
            <td>50</td>
            <td>Maximum number of projects to return.</td>
          </tr>
        </tbody>
      </table>

      <h2>Example request</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl https://eggisatria.dev/api/v1/projects?featured=true \\
  -H "x-api-key: exstr_live_..."`}
          </pre>
        </div>
      </div>

      <h2>Example response</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": true,
  "data": {
    "count": 2,
    "projects": [
      {
        "id": "ckxxx...",
        "slug": "ecommerce-dashboard",
        "title": "E-Commerce Dashboard",
        "description": "A comprehensive dashboard...",
        "imageUrl": "/projects/dashboard.png",
        "liveUrl": "https://dashboard-demo.eggisatria.dev",
        "githubUrl": "https://github.com/EgiStr/dashboard",
        "featured": true,
        "status": "PUBLISHED",
        "clicks": 42,
        "tech": ["Next.js", "TailwindCSS", "Prisma", "PostgreSQL"],
        "author": "Eggi Satria",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-02-01T12:00:00.000Z"
      }
    ]
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <h2>Notes</h2>
      <ul>
        <li>
          Only <code>PUBLISHED</code> projects are returned.
        </li>
        <li>
          Results are sorted by <code>featured DESC</code>,{" "}
          <code>displayOrder ASC</code>, then <code>createdAt DESC</code>.
        </li>
        <li>
          The <code>tech</code> array is derived from the project's tech stack
          entries.
        </li>
      </ul>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/api/posts"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Blog Posts API →
          </p>
        </Link>
      </div>
    </div>
  );
}
