"use client";

import { startGitHubAppsInstallation } from "@/actions/account";
import { useTransition } from "react";
import { toast } from "sonner";

import { GitHubIcon } from "@/components/brand/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function InstallGitHubApps() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startGitHubAppsInstallation();
      if (result === "error") {
        toast.error("Error", {
          description: "Failed to install GitHub Apps.",
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
      Install GitHub Apps
    </Button>
  );
}
