# Eggi Satria Personal Ecosystem

A multi-domain personal ecosystem built with Next.js, featuring a landing page, blog, and content management system.

## 🏗️ Architecture

| Application | Domain | Description |
|------------|--------|-------------|
| **Landing** | eggisatria.dev | Portfolio & first impression |
| **Blog** | notes.eggisatria.dev | Technical writing & thoughts |
| **Manager** | manager.eggisatria.dev | Content management dashboard |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PNPM 9+
- PostgreSQL (or Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/eggisatria/ecosystem.git
cd ecosystem

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Start all apps in development
pnpm dev
```

### Development URLs

- Landing Page: http://localhost:3000
- Blog: http://localhost:3001
- Manager: http://localhost:3002

## 📁 Project Structure

```
eggisatria-ecosystem/
├── apps/
│   ├── landing/          # Portfolio landing page
│   ├── blog/             # Blog with MDX support
│   └── manager/          # Content management system
├── packages/
│   ├── database/         # Prisma schema & client
│   ├── ui/               # Shared UI components
│   ├── tailwind-config/  # Shared Tailwind config
│   └── typescript-config/# Shared TS config
└── turbo.json            # Turborepo configuration
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma
- **Authentication:** NextAuth.js
- **Animations:** Framer Motion
- **Package Manager:** PNPM + Turborepo

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## 🎨 Design System

The ecosystem uses a consistent dark theme across all applications:

- **Background:** `#020617` (Slate 950)
- **Card:** `#0f172a` (Slate 900)
- **Primary:** `#10b981` (Emerald 500)
- **Font:** Inter / Geist Sans

## 📝 License

MIT © Eggi Satria
