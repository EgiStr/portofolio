# Eggi Satria Personal Ecosystem

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444?style=flat&logo=turborepo)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A robust, multi-domain personal ecosystem built with modern web technologies. This monorepo manages the portfolio, extensive blog, and a dedicated content management dashboard.

## 🌟 Features

- **🚀 Performance First**: Built on Next.js 14 App Router for optimal performance.
- **🎨 Modern Design**: Beautiful, accessible UI components powered by Tailwind CSS and Radix UI.
- **📝 MDX Blog**: Rich content experience with custom MDX components and syntax highlighting.
- **🛠️ Content Manager**: Custom dashboard to manage blog posts, projects, and site configuration.
- **🔐 Secure Authentication**: Integrated NextAuth.js for secure admin access.
- **📦 Monorepo**: Efficiently managed with Turborepo for shared configuration and UI.

## 🏗️ Architecture

The project follows a monorepo structure to share code and configuration across multiple applications.

| Application | Path | Domain | Description |
|------------|------|--------|-------------|
| **Landing** | `apps/landing` | `eggisatria.dev` | Personal portfolio and landing page. |
| **Blog** | `apps/blog` | `blog.eggisatria.dev` | Technical blog and knowledge base. |
| **Manager** | `apps/manager` | `manager.eggisatria.dev` | Admin dashboard for content management. |

### Shared Packages

- `@ecosystem/ui`: Reusable UI components (shadcn/ui), icons, and styles.
- `@ecosystem/database`: Prisma schema and client for database interactions.
- `@ecosystem/typescript-config`: Shared TypeScript configurations.
- `@ecosystem/tailwind-config`: Shared Tailwind CSS preset.

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js**: LTS version (18+)
- **PNPM**: Version 9+ (`npm install -g pnpm`)
- **Docker**: (Optional) For running a local PostgreSQL instance.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/EgiStr/portofolio.git
    cd portofolio
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables:**

    Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your database connection string and authentication secrets.

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/portofolio"
    NEXTAUTH_SECRET="your-super-secret-key"
    ```

4.  **Database Setup:**

    ```bash
    # Generate Prisma Client
    pnpm db:generate

    # Push schema to the database
    pnpm db:push
    ```

5.  **Start Development Server:**

    ```bash
    pnpm dev
    ```

### Development URLs

- Landing: [http://localhost:3000](http://localhost:3000)
- Blog: [http://localhost:3001](http://localhost:3001)
- Manager: [http://localhost:3002](http://localhost:3002)

## 📁 Project Structure

```bash
portofolio/
├── .github/              # GitHub templates and workflows
├── .husky/               # Git hooks
├── apps/                 # Application source code
│   ├── landing/
│   ├── blog/
│   └── manager/
├── packages/             # Shared libraries
│   ├── database/
│   ├── ui/
│   ├── tailwind-config/
│   └── typescript-config/
├── turbo.json            # Turborepo pipeline config
└── package.json          # Root dependencies and scripts
```

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Monorepo**: [Turborepo](https://turbo.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Database**: [Postgres](https://www.postgresql.org/) / [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Starts all apps in development mode via Turbo. |
| `pnpm build` | Builds all apps and packages for production. |
| `pnpm lint` | Runs ESLint across the entire workspace. |
| `pnpm db:generate` | Generates the Prisma client types. |
| `pnpm db:push` | Pushes the Prisma schema state to the database. |
| `pnpm db:studio` | Opens Prisma Studio to view database content. |
| `pnpm prepare` | Sets up Husky git hooks. |

## 🤝 Contributing

This project uses **Conventional Commits** and strict linting rules. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## 📝 License

MIT © [Eggi Satria](https://github.com/EgiStr)
