import { MetadataRoute } from "next";
import { getSettings } from "@ecosystem/config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  return {
    name: `${settings.name} blog`,
    short_name: `${settings.name} blog`,
    description: settings.blogDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
