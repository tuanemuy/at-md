"use client";

import { getOG } from "@/lib/open-graph";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

export function OGCard() {
  useEffect(() => {
    (async () => {
      const links = document.querySelectorAll("article a");
      for (const link of links) {
        const siblings = link.parentElement?.children;
        if (!siblings || siblings.length > 1) {
          continue;
        }

        const regex = /^\s*<a\s[^>]*href=(["'])(.*?)\1[^>]*>.*?<\/a>\s*$/;
        if (!regex.test(link.parentElement.innerHTML)) {
          continue;
        }

        const url = link.getAttribute("href");
        if (!url) {
          continue;
        }

        let og: {
          title: string;
          description: string;
          imageUrl: string;
        } | null = null;

        try {
          const result = await getOG(url);
          og = result?.ogImage?.at(0)?.url
            ? {
                title: result.ogTitle || "",
                description: result.ogDescription || "",
                imageUrl: result.ogImage[0].url,
              }
            : null;
        } catch (error) {}

        if (!og) {
          continue;
        }

        const container = document.createElement("div");
        container.className = "atmd-opengraph-card";
        link.parentElement?.after(container);
        const root = createRoot(container);
        root.render(
          <Component
            href={url}
            title={og.title}
            description={og.description}
            imageUrl={og.imageUrl}
          />,
        );
      }
    })();

    return () => {
      const ogCards = document.querySelectorAll(".atmd-opengraph-card");
      for (const ogCard of ogCards) {
        ogCard.remove();
      }
    };
  }, []);

  return null;
}

type Props = {
  href: string;
  title: string;
  description: string;
  imageUrl: string;
};

function Component({ href, title, description, imageUrl }: Props) {
  return (
    <Card className="py-0">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline!"
      >
        <article className="flex flex-col md:flex-row items-start gap-4 w-full p-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-full md:w-54 aspect-[1200/630] rounded-md"
            loading="lazy"
          />
          <div className="margin-0">
            <h1 className="margin-0 text-base! leading-[1.4]">{title}</h1>
            <p className="mt-1! text-xs leading-[1.5]!">{description}</p>
          </div>
        </article>
      </Link>
    </Card>
  );
}
