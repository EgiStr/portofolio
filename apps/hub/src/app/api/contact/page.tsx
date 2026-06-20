import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function ContactApiPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/api/authentication" },
          { title: "Contact Form" },
        ]}
      />

      <h1>Contact Form API</h1>
      <p className="lead">
        Public endpoint for submitting the contact form on the landing page. No
        authentication required.
      </p>

      <h2>Endpoint</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>POST</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/contact`}
          </pre>
        </div>
      </div>

      <h2>Request body</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Constraints</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>name</code>
            </td>
            <td>string</td>
            <td>yes</td>
            <td>2–100 chars</td>
          </tr>
          <tr>
            <td>
              <code>email</code>
            </td>
            <td>string</td>
            <td>yes</td>
            <td>Valid email, ≤ 200 chars</td>
          </tr>
          <tr>
            <td>
              <code>message</code>
            </td>
            <td>string</td>
            <td>yes</td>
            <td>10–2000 chars</td>
          </tr>
          <tr>
            <td>
              <code>source</code>
            </td>
            <td>string</td>
            <td>no</td>
            <td>
              Attribution tag, e.g. <code>"landing"</code>, <code>"blog"</code>.
              Defaults to <code>"landing"</code>.
            </td>
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
            {`curl -X POST https://eggisatria.dev/api/contact \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "message": "Hi! I'd love to chat about a project.",
    "source": "docs"
  }'`}
          </pre>
        </div>
      </div>

      <h2>Example response</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON · 201 Created</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": true,
  "data": {
    "id": "ckxxx...",
    "message": "Thanks! Your message has been received — I'll get back to you soon."
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <h2>Side effects</h2>
      <ul>
        <li>
          The submission is persisted to the <code>contact_submissions</code>{" "}
          table and visible in the Manager dashboard at{" "}
          <code>/dashboard/contact</code>.
        </li>
        <li>
          If <code>RESEND_API_KEY</code> is set, a notification email is sent to
          the site owner. Otherwise the email is logged to the server console.
        </li>
        <li>
          Rate-limited per IP: <strong>5 submissions per 10 minutes</strong>.
        </li>
      </ul>

      <h2>Error responses</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Cause</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>400</code>
            </td>
            <td>
              Invalid JSON, missing fields, or fields outside the allowed
              ranges.
            </td>
          </tr>
          <tr>
            <td>
              <code>429</code>
            </td>
            <td>Rate limit exceeded.</td>
          </tr>
          <tr>
            <td>
              <code>500</code>
            </td>
            <td>Database failure. Retry the request.</td>
          </tr>
        </tbody>
      </table>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/api/settings"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Previous</span>
          <p className="font-medium text-gray-900 dark:text-white">
            ← Site Settings API
          </p>
        </Link>
        <Link
          href="/api/newsletter"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Newsletter API →
          </p>
        </Link>
      </div>
    </div>
  );
}
