"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

export function QueryInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const query = params.query || "";

  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  return (
    <Input
      type="text"
      placeholder="Search notes..."
      className="w-full"
      defaultValue={query}
      onChange={(e) => {
        if (timer) {
          clearTimeout(timer);
          setTimer(null);
        }

        setTimer(
          setTimeout(() => {
            params.query = e.target.value;
            params.page = "1";
            const searchParams = new URLSearchParams(params);
            router.replace(`?${searchParams.toString()}`);
          }, 500),
        );
      }}
    />
  );
}
