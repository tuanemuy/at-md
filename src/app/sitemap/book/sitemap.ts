export const revalidate = 3600;
export const dynamicParams = true;

import { countBooks, listBooksForSitemap } from "@/actions/note";
import type { MetadataRoute } from "next";

const limit = Number.parseInt(process.env.NEXT_PUBLIC_SITEMAP_LIMIT, 10);

export async function generateSitemaps() {
  const count = await countBooks();
  const pages = Math.ceil(count / limit);
  return [...Array(pages)].map((_, i) => {
    return { id: i };
  });
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const books = await listBooksForSitemap(id + 1, limit);

  return books.flatMap((book) => {
    return [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/${book.user.handle}/${book.owner}/${book.repo}`,
        lastModified: book.updatedAt,
      },
    ];
  });
}
