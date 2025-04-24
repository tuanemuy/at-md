export const revalidate = 3600;
export const dynamicParams = true;

import { countBooks } from "@/actions/note";

export async function GET() {
  const count = await countBooks();
  const limit = Number.parseInt(process.env.NEXT_PUBLIC_SITEMAP_LIMIT, 10);
  const pages = Math.ceil(count / limit);
  const sitemaps = [...Array(pages)].map(
    (_, i) =>
      `<sitemap><loc>${process.env.NEXT_PUBLIC_URL}/sitemap/book/sitemap/${i}.xml</loc></sitemap>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps.join("")}
    </sitemapindex>
  `;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
