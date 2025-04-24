import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${process.env.NEXT_PUBLIC_URL}/`,
      lastModified: new Date(),
      changeFrequency: "yearly",
    },
    {
      url: `${process.env.NEXT_PUBLIC_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${process.env.NEXT_PUBLIC_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
  ];
}
