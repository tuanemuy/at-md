"use client";

import { Icon } from "@/components/brand/Icon";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <header className="sticky top-0 z-1 flex items-center justify-between py-2 px-4 bg-background border-b">
        <a href="/" className="no-underline">
          <Icon className="h-5 w-auto" />
        </a>
      </header>

      <main className="py-(--spacing-layout-lg)">
        <div className="content article">
          <h1>Error</h1>
          <p>Something went wrong.</p>

          <div>
            <Link href="/">Back to Home</Link>
          </div>
        </div>
      </main>
    </>
  );
}
