import { getSettings } from "@ecosystem/config";
import { HeroClient } from "./hero.client";

export async function Hero() {
  const settings = await getSettings();

  return (
    <HeroClient
      heroTitle={settings.heroTitle}
      heroSubtitle={settings.heroSubtitle}
      heroDescription={settings.heroDescription}
      socialLinks={{
        github: settings.github,
        linkedin: settings.linkedin,
        twitter: settings.twitter,
        instagram: settings.instagram,
        youtube: settings.youtube,
        email: settings.email,
      }}
    />
  );
}
