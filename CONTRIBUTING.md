# Contributing to Eggi Satria Personal Ecosystem

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🛠️ Development Workflow

1.  **Fork and Clone**: Fork the repository to your own GitHub account and then clone it locally.
    ```bash
    git clone https://github.com/EgiStr/portofolio.git
    cd portofolio
    ```

2.  **Install Dependencies**: We use `pnpm` and `turborepo`.
    ```bash
    pnpm install
    ```

3.  **Branching**: Create a new branch for your feature or bug fix.
    ```bash
    # For new features
    git checkout -b feature/amazing-feature

    # For bug fixes
    git checkout -b bugfix/critical-issue
    ```

4.  **Development**: Start the development server.
    ```bash
    pnpm dev
    ```

## 🏗️ Commit Convention

We follow the **Conventional Commits** specification. This is enforced by `commitlint` and `husky` hooks.

**Format**: `<type>(<scope>): <subject>`

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples
- ✅ `feat(blog): add support for mdx code highlighting`
- ✅ `fix(ui): resolve button alignment issue on mobile`
- ✅ `docs: update readme with setup instructions`
- ❌ `Added new feature` (Will fail commitlint)

## 🎨 Code Style

- **Prettier**: Code is automatically formatted on commit using `prettier`.
- **Linting**: We use strict ESLint rules. Run `pnpm lint` to check for issues.

## 📝 Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the `README.md` with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## 🐞 Reporting Bugs

Bugs are tracked as GitHub issues. When filing an issue, strictly follow the `Bug Report` template. Explain the problem and include additional details to help maintainers reproduce the problem.

## 💡 Feature Requests

Feature requests are tracked as GitHub issues. When suggesting a new feature, strictly follow the `Feature Request` template. Explain detailed use cases and the rationale behind the request.
