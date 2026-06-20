import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function PostsApiPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/api/authentication" },
          { title: "Blog Posts" },
        ]}
      />

      <h1>Blog Posts API</h1>
      <p className="lead">
        Read-only access to published blog posts from the blog app.
      </p>

      <h2>Endpoint</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>GET</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://blog.eggisatria.dev/api/v1/posts`}
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
              <code>limit</code>
            </td>
            <td>
              <code>1..100</code>
            </td>
            <td>20</td>
            <td>Maximum number of posts to return.</td>
          </tr>
          <tr>
            <td>
              <code>q</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>—</td>
            <td>
              Substring search across title, excerpt, and content
              (case-insensitive).
            </td>
          </tr>
          <tr>
            <td>
              <code>tag</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>—</td>
            <td>Filter by tag slug (exact match).</td>
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
            {`curl https://blog.eggisatria.dev/api/v1/posts?tag=nextjs&limit=5 \\
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
    "count": 1,
    "posts": [
      {
        "id": "ckxxx...",
        "slug": "building-with-nextjs-15",
        "title": "Building with Next.js 15",
        "excerpt": "A quick tour of the new features…",
        "coverImage": "/blog/nextjs-15.png",
        "publishedAt": "2024-12-01T08:00:00.000Z",
        "readingTime": 6,
        "author": "Eggi Satria",
        "tags": [{ "name": "Next.js", "slug": "nextjs" }],
        "views": 1284,
        "createdAt": "2024-11-28T10:00:00.000Z",
        "updatedAt": "2024-12-01T08:00:00.000Z"
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
          Only <code>published = true</code> posts are returned.
        </li>
        <li>
          Results are sorted by <code>publishedAt DESC</code>.
        </li>
        <li>
          The post body (MDX) is omitted from list responses. To fetch a single
          post's full content, use <code>/api/posts/[slug]</code> (no auth
          required for public posts).
        </li>
      </ul>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/api/projects"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Previous</span>
          <p className="font-medium text-gray-900 dark:text-white">
            ← Projects API
          </p>
        </Link>
        <Link
          href="/api/settings"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Site Settings API →
          </p>
        </Link>
      </div>
    </div>
  );
}
