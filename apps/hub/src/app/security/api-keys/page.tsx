import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function ApiKeysSecurityPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "Security", href: "/docs/security/api-keys" },
          { title: "API Keys" },
        ]}
      />

      <h1>API Key Security</h1>
      <p className="lead">
        API keys provide a mechanism for programmatic access to EDS. Because
        these keys grant significant permissions, they must be handled with
        care.
      </p>

      <h2>How EDS Secures Keys</h2>
      <p>
        To protect your storage nodes and data, EDS implements several security
        layers for API keys:
      </p>

      <h3>1. One-Time Reveal</h3>
      <p>
        When you generate an API key, the full key is displayed{" "}
        <strong>only once</strong>. Neither EDS nor its administrators can
        retrieve the full key once the generation dialog is closed.
      </p>

      <h3>2. SHA-256 Hashing</h3>
      <p>
        EDS never stores your actual API keys in the database. Instead, it
        stores a <strong>cryptographic hash</strong> (SHA-256) of the key.
      </p>
      <ul>
        <li>
          When you make an API request, EDS hashes the provided key and compares
          it to the stored hash.
        </li>
        <li>
          Even if the database is compromised, an attacker cannot retrieve the
          original API keys from the hashes.
        </li>
      </ul>

      <h3>3. Identification Prefixes</h3>
      <p>
        The first few characters of the key (e.g., <code>exstr_l...</code>) are
        stored in plain text to allow the dashboard to identify and list your
        keys without revealing the full secret.
      </p>

      <h2>Your Responsibility</h2>
      <p>
        While EDS secures the storage of keys, you are responsible for their
        usage:
      </p>

      <ul>
        <li>
          <strong>Environment Variables</strong>: Always store keys in
          environment variables (e.g., <code>.env</code>) and never commit them
          to version control (Git).
        </li>
        <li>
          <strong>Least Privilege</strong>: Use different keys for different
          applications or scripts. This makes it easier to revoke access for a
          single script without affecting others.
        </li>
        <li>
          <strong>Regular Rotation</strong>: Periodically generate new keys and
          delete old ones to limit the impact of potential key leaks.
        </li>
      </ul>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
        <p className="font-medium text-red-800 dark:text-red-200">
          ⚠️ Compromised Keys
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          If you suspect an API key has been leaked,{" "}
          <strong>deactivate or delete it immediately</strong> in the Manager
          Dashboard. This will instantly revoke access for all scripts using
          that key.
        </p>
      </div>

      <h2>Verification</h2>
      <p>
        You can monitor the <strong>Last Used</strong> timestamp for each key in
        the dashboard. If you see a key being used at a time your scripts
        weren't running, it may be compromised.
      </p>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/security/encryption"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Data Encryption →
          </p>
        </Link>
      </div>
    </div>
  );
}
