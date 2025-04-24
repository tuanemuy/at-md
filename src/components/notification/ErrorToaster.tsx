"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { toast } from "sonner";

export function ErrorToaster() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");

    if (!error) {
      return;
    }

    if (error === "github-callback") {
      toast.error("Error", {
        description: "Failed to connect to GitHub.",
      });
      return;
    }

    toast.error("Error", {
      description: "Something went wrong. Please try again later.",
    });
  }, [searchParams]);

  return null;
}
