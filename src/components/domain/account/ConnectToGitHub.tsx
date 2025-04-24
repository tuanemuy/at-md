"use client";

import { startGitHubAccessTokenFlow } from "@/actions/account";
import { useTransition } from "react";
import { toast } from "sonner";

import { GitHubIcon } from "@/components/brand/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ConnectToGitHub() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startGitHubAccessTokenFlow();
      if (result === "error") {
        toast.error("Error", {
          description: "Failed to connect to GitHub.",
        });
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="w-full cursor-pointer"
      disabled={isPending}
    >
      {isPending && <Loader2 className="animate-spin" />}
      <GitHubIcon />
      Connect to GitHub
    </Button>
  );
}
