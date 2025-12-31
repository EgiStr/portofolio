import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Eggi Satria - Full Stack Developer.",
};

export default function AboutPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>About Me</h1>

      <p>
        Hi, I&apos;m <strong>Eggi Satria</strong> — a full-stack developer based
        in Indonesia. I enjoy building things for the web and writing about what
        I learn along the way.
      </p>

      <h2>What I Do</h2>
      <p>
        I specialize in building web applications with modern technologies like
        React, Next.js, TypeScript, and Node.js. I&apos;m passionate about
        creating user experiences that are both beautiful and performant.
      </p>

      <h2>My Stack</h2>
      <ul>
        <li>
          <strong>Frontend:</strong> React, Next.js, TypeScript, Tailwind CSS
        </li>
        <li>
          <strong>Backend:</strong> Node.js, Express, PostgreSQL, Prisma
        </li>
        <li>
          <strong>Tools:</strong> Git, Docker, VS Code, Figma
        </li>
      </ul>

      <h2>This Site</h2>
      <p>
        This blog is part of my personal digital ecosystem — a multi-domain
        setup with:
      </p>
      <ul>
        <li>
          <a href="https://eggisatria.dev">eggisatria.dev</a> — Landing page &
          portfolio
        </li>
        <li>
          <a href="https://notes.eggisatria.dev">notes.eggisatria.dev</a> — This
          blog (you are here!)
        </li>
        <li>manager.eggisatria.dev — Content management system</li>
      </ul>

      <h2>Get in Touch</h2>
      <p>
        Feel free to reach out if you want to collaborate, have questions, or
        just want to say hi!
      </p>
      <ul>
        <li>
          Email: <a href="mailto:hello@eggisatria.dev">hello@eggisatria.dev</a>
        </li>
        <li>
          GitHub: <a href="https://github.com/eggisatria">@eggisatria</a>
        </li>
        <li>
          LinkedIn: <a href="https://linkedin.com/in/eggisatria">@eggisatria</a>
        </li>
      </ul>
    </div>
  );
}
