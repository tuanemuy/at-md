"use client";

import { startGitHubAppsInstallation } from "@/actions/account";
import { useTransition } from "react";
import { toast } from "sonner";

import { GitHubIcon } from "@/components/brand/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ManageGitHubApps() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startGitHubAppsInstallation();
      if (result === "error") {
        toast.error("Error", {
          description: "Failed to manage GitHub Apps.",
        });
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="ghost"
      className="w-full cursor-pointer"
    >
      {isPending && <Loader2 className="animate-spin" />}
      <GitHubIcon />
      Manage GitHub Apps
    </Button>
  );
}
