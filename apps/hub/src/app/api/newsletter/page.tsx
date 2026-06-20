import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function NewsletterApiPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/api/authentication" },
          { title: "Newsletter" },
        ]}
      />

      <h1>Newsletter API</h1>
      <p className="lead">
        Public, unauthenticated endpoints for managing newsletter subscriptions.
        The blog and landing apps share one subscriber table.
      </p>

      <h2>Subscribe</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>POST</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/newsletter/subscribe`}
          </pre>
        </div>
      </div>

      <h3>Request body</h3>
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
              <code>email</code>
            </td>
            <td>string</td>
            <td>yes</td>
            <td>Valid email, ≤ 200 chars</td>
          </tr>
          <tr>
            <td>
              <code>name</code>
            </td>
            <td>string</td>
            <td>no</td>
            <td>≤ 100 chars</td>
          </tr>
          <tr>
            <td>
              <code>source</code>
            </td>
            <td>string</td>
            <td>no</td>
            <td>
              Attribution tag (e.g. <code>"landing-footer"</code>).
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Example request</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl -X POST https://eggisatria.dev/api/newsletter/subscribe \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "ada@example.com",
    "name": "Ada",
    "source": "docs"
  }'`}
          </pre>
        </div>
      </div>

      <h3>Example response</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON · 201 Created</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": true,
  "data": {
    "alreadySubscribed": false,
    "message": "Subscribed! Check your inbox for a welcome email."
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <h3>Behavior</h3>
      <ul>
        <li>
          Idempotent: re-subscribing returns{" "}
          <code>alreadySubscribed: true</code>.
        </li>
        <li>Re-subscribing an unsubscribed address re-activates it.</li>
        <li>
          If <code>RESEND_API_KEY</code> is set, a welcome email is sent with a
          one-click unsubscribe link. Otherwise the send is simulated and logged
          on the server.
        </li>
        <li>
          Rate-limited per IP: <strong>5 requests per 10 minutes</strong>.
        </li>
      </ul>

      <h2>Unsubscribe</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>GET</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/newsletter/unsubscribe?email=<email>&token=<token>`}
          </pre>
        </div>
      </div>

      <h3>Query parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>email</code>
            </td>
            <td>string</td>
            <td>Subscriber email (URL-encoded).</td>
          </tr>
          <tr>
            <td>
              <code>token</code>
            </td>
            <td>string</td>
            <td>
              HMAC-SHA256 token from the welcome email — never store this
              client-side.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Example link (from a welcome email)</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`https://eggisatria.dev/api/newsletter/unsubscribe?email=ada%40example.com&token=4f3b…`}
          </pre>
        </div>
      </div>

      <h3>Response</h3>
      <p>
        Always returns an HTML confirmation page (status <code>200</code>,{" "}
        <code>400</code>, or <code>500</code>) so the user sees a friendly
        message — never a raw error.
      </p>

      <h2>Error responses (subscribe)</h2>
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
            <td>Invalid JSON, missing/ invalid email.</td>
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

      <h2>Managing subscribers (manager only)</h2>
      <p>
        The Manager dashboard provides a UI for listing, reactivating, and
        deleting subscribers at <code>/dashboard/newsletter</code>.
      </p>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/api/contact"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Previous</span>
          <p className="font-medium text-gray-900 dark:text-white">
            ← Contact Form API
          </p>
        </Link>
        <Link
          href="/api/responses"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Response Format →
          </p>
        </Link>
      </div>
    </div>
  );
}
