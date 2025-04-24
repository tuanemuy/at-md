"use client";

import { syncProfile } from "@/actions/account";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

export function SyncProfile() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    setIsOpen(false);
    const loading = toast.loading("Syncing profile with Bluesky...");
    const result = await syncProfile();
    toast.dismiss(loading);

    if (!result) {
      toast.error("Error", {
        description: "Failed to sync profile with Bluesky.",
      });
      return;
    }

    toast.success("Success", {
      description: "Profile synced with Bluesky successfully.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <RefreshCw />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync user profile with Bluesky</DialogTitle>
          <DialogDescription>
            Are you sure you want to sync your profile with Bluesky? This will
            update your profile information with the latest data from your
            Bluesky account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleClick}
            className="cursor-pointer"
          >
            Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
