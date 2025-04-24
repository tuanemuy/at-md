export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>${process.env.NEXT_PUBLIC_URL}/sitemap/sitemap.xml</loc></sitemap>
      <sitemap><loc>${process.env.NEXT_PUBLIC_URL}/sitemapindex/user/sitemap.xml</loc></sitemap>
      <sitemap><loc>${process.env.NEXT_PUBLIC_URL}/sitemapindex/book/sitemap.xml</loc></sitemap>
      <sitemap><loc>${process.env.NEXT_PUBLIC_URL}/sitemapindex/note/sitemap.xml</loc></sitemap>
    </sitemapindex>
  `;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
