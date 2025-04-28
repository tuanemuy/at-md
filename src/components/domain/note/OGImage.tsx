"use client";

import { getOG } from "@/lib/open-graph";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Card } from "@/components/ui/card";

export function OGImage() {
  useEffect(() => {
    (async () => {
      const links = document.querySelectorAll("article a");
      for (const link of links) {
        const siblings = link.parentElement?.children;
        if (!siblings || siblings.length > 1) {
          continue;
        }

        const url = link.getAttribute("href");
        if (!url) {
          continue;
        }

        console.log(url);

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
        link.parentElement?.append(container);
        const root = createRoot(container);
        root.render(
          <OGCard
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
  title: string;
  description: string;
  imageUrl: string;
};

function OGCard({ title, description, imageUrl }: Props) {
  return (
    <Card>
      <article className="flex items-center justify-center w-full p-4">
        <img
          src={imageUrl}
          alt={title}
          className="w-64 aspect-[1200/630] mb-4 rounded-lg"
        />
        <div
          style={{
            margin: "0",
          }}
        >
          <h1
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              lineHeight: "1.4",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: "0",
              marginTop: "0.5rem",
            }}
          >
            {description}
          </p>
        </div>
      </article>
    </Card>
  );
}
