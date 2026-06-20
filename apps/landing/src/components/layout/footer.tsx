import {
  Github,
  Linkedin,
  Mail,
  Heart,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSettings } from "@ecosystem/config";

interface SocialLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export async function Footer() {
  const settings = await getSettings();

  // Build social links dynamically from settings — only include non-empty values
  const socialLinks: SocialLink[] = [];

  if (settings.github) {
    socialLinks.push({
      name: "GitHub",
      href: `https://github.com/${settings.github.replace(/^@/, "")}`,
      icon: Github,
    });
  }

  if (settings.linkedin) {
    socialLinks.push({
      name: "LinkedIn",
      href: `https://linkedin.com/in/${settings.linkedin.replace(/^@/, "")}`,
      icon: Linkedin,
    });
  }

  if (settings.twitter) {
    socialLinks.push({
      name: "Twitter",
      href: `https://twitter.com/${settings.twitter.replace(/^@/, "")}`,
      icon: Twitter,
    });
  }

  if (settings.instagram) {
    socialLinks.push({
      name: "Instagram",
      href: `https://instagram.com/${settings.instagram.replace(/^@/, "")}`,
      icon: Instagram,
    });
  }

  if (settings.youtube) {
    socialLinks.push({
      name: "YouTube",
      href: settings.youtube,
      icon: Youtube,
    });
  }

  if (settings.email) {
    socialLinks.push({
      name: "Email",
      href: `mailto:${settings.email}`,
      icon: Mail,
    });
  }

  return (
    <footer className="py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Social Links - Mobile Only */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-6 mb-6 md:hidden">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-primary transition-colors"
                aria-label={link.name}
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        )}

        {/* Credits */}
        <div className="text-center">
          <a
            href="https://github.com/EgiStr/portofolio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary/70 hover:text-primary transition-colors"
          >
            <p className="flex items-center justify-center gap-1">
              Built with{" "}
              <Heart className="w-4 h-4 text-primary fill-primary/40" /> by{" "}
              {settings.name}
            </p>
            <p className="text-xs mt-1 text-primary/60">
              Design inspired by Brittany Chiang
            </p>
          </a>
        </div>
      </div>

      {/* Side Social Links - Desktop Only */}
      {socialLinks.length > 0 && (
        <div className="hidden md:flex fixed bottom-0 left-8 flex-col items-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all"
              aria-label={link.name}
            >
              <link.icon className="w-5 h-5" />
            </a>
          ))}
          <div className="w-px h-24 bg-foreground/20" />
        </div>
      )}

      {/* Side Email - Desktop Only */}
      {settings.email && (
        <div className="hidden md:flex fixed bottom-0 right-8 flex-col items-center gap-6">
          <a
            href={`mailto:${settings.email}`}
            className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all text-xs tracking-widest"
            style={{ writingMode: "vertical-rl" }}
          >
            {settings.email}
          </a>
          <div className="w-px h-24 bg-foreground/20" />
        </div>
      )}
    </footer>
  );
}
