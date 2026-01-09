import Link from "next/link";
import { ArrowRight, Cloud, Key, Upload, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Hero Section */}
      <div className="not-prose mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          EgiStr HUB Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          eggisatria HUB - Central Project Documentation - Aggregate multiple
          Google Drive accounts into a unified storage pool with programmatic
          API access.
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/docs/installation"
            className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Quick Start
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get up and running in under 5 minutes
              </p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </Link>

          <Link
            href="/docs/api/authentication"
            className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-colors"
          >
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                API Reference
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore the External API endpoints
              </p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Introduction */}
      <h2>Introduction</h2>
      <p>
        EDS (eggisatria HUB - Central Project Documentation) is a storage
        aggregation system that combines multiple Google Drive accounts into a
        single, unified storage pool. It provides:
      </p>

      <ul>
        <li>
          <strong>Aggregated Storage</strong> - Pool multiple 15GB free Google
          Drive accounts
        </li>
        <li>
          <strong>Virtual File System</strong> - Organize files with folders
          independently of Google Drive
        </li>
        <li>
          <strong>Resumable Uploads</strong> - Support for large files (&gt;1GB)
          with chunked upload
        </li>
        <li>
          <strong>External API</strong> - Programmatic access via API keys
        </li>
        <li>
          <strong>Secure</strong> - AES-256 encrypted tokens, SHA-256 hashed API
          keys
        </li>
      </ul>

      {/* Architecture Overview */}
      <h2>Architecture Overview</h2>
      <div className="not-prose my-8">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 font-mono text-sm overflow-x-auto">
          <pre className="text-gray-700 dark:text-gray-300">{`┌─────────────────────────────────────────────────────────────┐
│                      EDS Dashboard                           │
│    (File Browser, Upload UI, Node Management)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      EDS API Layer                           │
│  /api/drive/*  (Internal)   │   /api/v1/*  (External)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Storage Node Pool                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │ Node A  │  │ Node B  │  │ Node C  │  (Google Drives)     │
│  │  15GB   │  │  15GB   │  │  15GB   │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
└─────────────────────────────────────────────────────────────┘`}</pre>
        </div>
      </div>

      {/* Key Concepts Cards */}
      <h2>Key Concepts</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Cloud className="w-8 h-8 text-blue-500 mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Storage Nodes
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Each connected Google account is a "node" contributing storage to
            the pool.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Upload className="w-8 h-8 text-green-500 mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Smart Allocation
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Files are automatically routed to nodes with the most available
            space.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Key className="w-8 h-8 text-purple-500 mb-3" />
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            API Keys
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Secure programmatic access without exposing OAuth credentials.
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <h2>Next Steps</h2>
      <p>Ready to get started? Follow these guides in order:</p>

      <ol>
        <li>
          <Link
            href="/docs/installation"
            className="text-blue-600 hover:underline"
          >
            Installation
          </Link>{" "}
          - Set up your development environment
        </li>
        <li>
          <Link
            href="/docs/configuration"
            className="text-blue-600 hover:underline"
          >
            Configuration
          </Link>{" "}
          - Configure Google Cloud and environment variables
        </li>
        <li>
          <Link
            href="/docs/storage-nodes"
            className="text-blue-600 hover:underline"
          >
            Storage Nodes
          </Link>{" "}
          - Add your first Google Drive storage node
        </li>
        <li>
          <Link
            href="/docs/api/authentication"
            className="text-blue-600 hover:underline"
          >
            API Authentication
          </Link>{" "}
          - Generate API keys for external access
        </li>
      </ol>
    </div>
  );
}
