import { MetadataRoute } from "next";

// Define Post interface to match what's expected from the API
interface Post {
  slug: string;
  updatedAt: string;
}

async function getPosts(): Promise<Post[]> {
  try {
    // In production, this should fetch from your actual data source or API
    // Ensure the API URL is correct for server-side fetching
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/posts`, {
      next: { revalidate: 3600 }, // Key for ISR
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Failed to fetch posts for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://notes.eggisatria.dev";
  const posts = await getPosts();

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...postUrls,
  ];
}
