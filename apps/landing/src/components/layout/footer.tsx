import { Github, Linkedin, Mail, Heart } from "lucide-react";

const socialLinks = [
  { name: "GitHub", href: "https://github.com/eggisatria", icon: Github },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/eggisatria",
    icon: Linkedin,
  },
  { name: "Email", href: "mailto:hello@eggisatria.dev", icon: Mail },
];

export function Footer() {
  return (
    <footer className="py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Social Links - Mobile Only */}
        <div className="flex justify-center gap-6 mb-6 md:hidden">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={link.name}
            >
              <link.icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        {/* Credits */}
        <div className="text-center">
          <a
            href="https://github.com/eggisatria/ecosystem"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <p className="flex items-center justify-center gap-1">
              Built with <Heart className="w-4 h-4 text-primary" /> by Eggi
              Satria
            </p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              Design inspired by Brittany Chiang
            </p>
          </a>
        </div>
      </div>

      {/* Side Social Links - Desktop Only */}
      <div className="hidden md:flex fixed bottom-0 left-8 flex-col items-center gap-6">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary hover:-translate-y-1 transition-all"
            aria-label={link.name}
          >
            <link.icon className="w-5 h-5" />
          </a>
        ))}
        <div className="w-px h-24 bg-muted-foreground/30" />
      </div>

      {/* Side Email - Desktop Only */}
      <div className="hidden md:flex fixed bottom-0 right-8 flex-col items-center gap-6">
        <a
          href="mailto:hello@eggisatria.dev"
          className="text-muted-foreground hover:text-primary hover:-translate-y-1 transition-all text-xs tracking-widest"
          style={{ writingMode: "vertical-rl" }}
        >
          hello@eggisatria.dev
        </a>
        <div className="w-px h-24 bg-muted-foreground/30" />
      </div>
    </footer>
  );
}
