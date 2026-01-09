import Link from "next/link";
import { Breadcrumb } from "../components";

export default function InstallationPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb items={[{ title: "Installation" }]} />

      <h1>Installation</h1>
      <p className="lead">
        Get EDS up and running on your development machine in under 5 minutes.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Node.js &gt;= 18</li>
        <li>pnpm &gt;= 9.1.0</li>
        <li>PostgreSQL database (Neon/Supabase recommended)</li>
        <li>Google Cloud account (for OAuth credentials)</li>
      </ul>

      <h2>Clone & Install</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Clone the repository
git clone https://github.com/EgiStr/portofolio.git
cd portofolio

# Install dependencies
pnpm install

# Navigate to EDS app
cd apps/eds`}
          </pre>
        </div>
      </div>

      <h2>Environment Setup</h2>
      <p>Copy the example environment file and fill in your values:</p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Copy environment template
cp .env.example .env

# Generate encryption key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}
          </pre>
        </div>
      </div>

      <p>
        Your <code>.env</code> file should contain:
      </p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
            <span className="text-gray-400 text-xs">.env</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="http://localhost:3003/api/auth/google/callback"

# Security
ENCRYPTION_KEY="your-64-char-hex-key-here"`}
          </pre>
        </div>
      </div>

      <h2>Database Setup</h2>
      <p>Push the Prisma schema to your database:</p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# From project root
pnpm db:push

# Verify tables (opens Prisma Studio)
pnpm db:studio`}
          </pre>
        </div>
      </div>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-medium text-blue-800 dark:text-blue-200">Note</p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          You should see these tables: <code>eds_storage_nodes</code>,{" "}
          <code>eds_folders</code>, <code>eds_files</code>,{" "}
          <code>eds_reservations</code>, <code>eds_activity_logs</code>,{" "}
          <code>eds_api_keys</code>
        </p>
      </div>

      <h2>Run Development Server</h2>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Run EDS only
pnpm --filter @ecosystem/eds dev

# Or run all apps
pnpm dev`}
          </pre>
        </div>
      </div>

      <p>
        Access the dashboard at{" "}
        <a
          href="http://localhost:3003"
          target="_blank"
          rel="noopener noreferrer"
        >
          http://localhost:3003
        </a>
      </p>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/configuration"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Configuration →
          </p>
        </Link>
      </div>
    </div>
  );
}
