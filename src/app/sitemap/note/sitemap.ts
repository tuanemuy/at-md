export const revalidate = 3600;
export const dynamicParams = true;

import { countNotes, listNotesForSitemap } from "@/actions/note";
import type { MetadataRoute } from "next";

const limit = Number.parseInt(process.env.NEXT_PUBLIC_SITEMAP_LIMIT, 10);

export async function generateSitemaps() {
  const count = await countNotes();
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
  const notes = await listNotesForSitemap(id + 1, limit);

  return notes.flatMap((note) => {
    return [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/${note.user.handle}/${note.book.owner}/${note.book.repo}/${note.path}`,
        lastModified: note.updatedAt,
      },
    ];
  });
}
