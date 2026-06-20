import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function SettingsApiPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/api/authentication" },
          { title: "Site Settings" },
        ]}
      />

      <h1>Site Settings API</h1>
      <p className="lead">
        Read the public site-config keys (name, job title, social handles, etc.)
        that the landing and blog apps use to render their UI.
      </p>

      <h2>Endpoint</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>GET</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/v1/settings`}
          </pre>
        </div>
      </div>

      <h2>Example request</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl https://eggisatria.dev/api/v1/settings \\
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
    "count": 18,
    "settings": {
      "name": "Eggi Satria",
      "jobTitle": "Full Stack Developer",
      "email": "hello@eggisatria.dev",
      "github": "EgiStr",
      "linkedin": "eggisatria",
      "siteTitle": "Eggi Satria | Full Stack Developer",
      "siteDescription": "Full Stack Developer passionate about building exceptional digital experiences.",
      "siteKeywords": "react, nextjs, typescript, web developer",
      "googleAnalyticsId": "G-XXXXXXXXXX"
    },
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <h2>Notes</h2>
      <ul>
        <li>
          Settings are stored as key/value pairs in the{" "}
          <code>site_configs</code> table.
        </li>
        <li>
          Keys reflect the schema defined in <code>@ecosystem/config</code>. See
          the Manager dashboard's Settings page for the full list of editable
          keys.
        </li>
        <li>
          Secrets (API keys, OAuth client secrets, etc.) are never exposed by
          this endpoint.
        </li>
      </ul>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/api/posts"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Previous</span>
          <p className="font-medium text-gray-900 dark:text-white">
            ← Blog Posts API
          </p>
        </Link>
        <Link
          href="/api/contact"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Contact Form API →
          </p>
        </Link>
      </div>
    </div>
  );
}
