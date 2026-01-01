import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Eggi Satria - Data Engineer.",
};

export default function AboutPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>About Me</h1>

      <p>
        Hi, I&apos;m <strong>Eggi Satria</strong> — a Data Engineer based in
        Indonesia who loves building software. I enjoy engineering robust data
        systems and developing the applications that make that data useful.
      </p>

      <h2>What I Do</h2>
      <p>
        While my main focus is Data Engineering, I don&apos;t just stop at
        pipelines and databases. I am passionate about building full-stack
        software that brings data to life.
      </p>

      <p>
        I specialize in creating end-to-end solutions—combining efficient data
        architectures with modern web technologies. Whether it&apos;s
        automating a workflow or building a dashboard from scratch, I love the
        process of turning raw ideas into working software.
      </p>

      <h2>My Stack</h2>
      <ul>
        <li>
          <strong>Data & AI:</strong> Python, SQL, YOLOv8, Pandas
        </li>
        <li>
          <strong>Software Development:</strong> Next.js, TypeScript, Tailwind CSS
        </li>
        <li>
          <strong>Infrastructure:</strong> Docker, PostgreSQL, Linux (VPS)
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
          <a href="https://blog.eggisatria.dev">blog.eggisatria.dev</a> — This
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
          Email: <a href="mailto:eggisatria2310@gmail.com">eggisatria2310@gmail.com</a>
        </li>
        <li>
          GitHub: <a href="https://github.com/EgiStr">@EgiStr</a>
        </li>
        <li>
          LinkedIn: <a href="https://linkedin.com/in/eggisatria">@eggisatria</a>
        </li>
      </ul>
    </div>
  );
}
