export const revalidate = 3600;
export const dynamicParams = true;

import { countUsers, listUsers } from "@/actions/account";
import type { MetadataRoute } from "next";

const limit = Number.parseInt(process.env.NEXT_PUBLIC_SITEMAP_LIMIT, 10);

export async function generateSitemaps() {
  const count = await countUsers();
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
  const users = await listUsers(id + 1, limit);

  return users.flatMap((user) => {
    return [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/${user.handle}`,
        lastModified: user.updatedAt,
      },
    ];
  });
}
