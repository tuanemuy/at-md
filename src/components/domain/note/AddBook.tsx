"use client";

import { addBook } from "@/actions/note";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Link, Loader2, PlugZap } from "lucide-react";

type Props = {
  userId: string;
  owner: string;
  repo: string;
  disabled?: boolean;
};

export function AddBook({ userId, owner, repo, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const loading = toast.loading("Loading...");
      const result = await addBook({ userId, owner, repo });
      toast.dismiss(loading);

      if (!result) {
        toast.error("Error", {
          description: "Failed to create a book.",
        });
        return;
      }

      toast.success("Success", {
        description: "New book created successfully.",
      });
    });
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      disabled={disabled || isPending}
      className="cursor-pointer"
    >
      {isPending && <Loader2 className="animate-spin" />}
      {disabled && <Link className="animate-pulse" />}
      {!disabled && <PlugZap className="size-5" />}
      {disabled ? "Connected" : "Connect"}
    </Button>
  );
}
