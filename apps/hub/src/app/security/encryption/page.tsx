import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function EncryptionPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "Security", href: "/docs/security/api-keys" },
          { title: "Encryption" },
        ]}
      />

      <h1>Data Encryption</h1>
      <p className="lead">
        Learn how EDS protects your sensitive storage credentials using
        industry-standard encryption.
      </p>

      <h2>Token Protection</h2>
      <p>
        Each storage node in EDS is powered by Google OAuth's{" "}
        <code>access_token</code> and <code>refresh_token</code>. These tokens
        are as sensitive as passwords, so EDS encrypts them before saving to the
        database.
      </p>

      <h3>Algorithm</h3>
      <p>
        EDS uses **AES-256-GCM** (Advanced Encryption Standard in Galois/Counter
        Mode).
      </p>
      <ul>
        <li>
          <strong>AES-256</strong>: Provides military-grade encryption strength.
        </li>
        <li>
          <strong>GCM Mode</strong>: Ensures both confidentiality and
          authenticity (detects tampering).
        </li>
      </ul>

      <h3>Encryption Process</h3>
      <ol>
        <li>
          EDS generates a random **Initialization Vector (IV)** for every
          encryption.
        </li>
        <li>
          The token is encrypted using the <code>ENCRYPTION_KEY</code> and the
          IV.
        </li>
        <li>
          The IV, Authentication Tag, and Encrypted Content are stored together
          in the database.
        </li>
      </ol>

      <h2>Encryption Key Management</h2>
      <p>
        The <code>ENCRYPTION_KEY</code> is defined via environment variables. It
        never touches the database.
      </p>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Security Note
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
          For maximum security, ensure your <code>ENCRYPTION_KEY</code> is not
          the same as your <code>SESSION_SECRET</code> or any other application
          keys.
        </p>
      </div>

      <h2>Google Drive Scope</h2>
      <p>
        In addition to database encryption, EDS follows the principle of least
        privilege by using the <code>drive.file</code> scope.
      </p>
      <ul>
        <li>
          EDS can only see and manage files that <strong>it has created</strong>
          .
        </li>
        <li>
          It cannot see your personal photos, emails, or other documents in your
          Google Drive.
        </li>
        <li>
          Even if a node is compromised, the damage is isolated to files within
          the EDS ecosystem.
        </li>
      </ul>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Back</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Introduction ←
          </p>
        </Link>
      </div>
    </div>
  );
}
