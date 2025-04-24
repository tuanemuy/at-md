"use client";

import { signIn } from "@/actions/account";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Field } from "@/components/form/Field";
import { FieldError } from "@/components/form/FieldError";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function Form() {
  const [isPending, startTransition] = useTransition();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState(false);

  const handleClick = () => {
    if (!handle) {
      setError(true);
      return;
    }
    setError(false);
    startTransition(async () => {
      const result = await signIn(handle);
      if (result === "error") {
        toast.error("Error", {
          description: "Failed to sign in.",
        });
      }
    });
  };

  return (
    <Card className="w-md">
      <CardHeader>
        <CardTitle>Welcome!</CardTitle>
        <CardDescription>
          Please enter your Bluesky handle to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Field>
            <Label htmlFor="handle">Handle</Label>
            <div className="flex items-center gap-2">
              @
              <Input
                type="text"
                name="handle"
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
            {error && <FieldError errors={["Handle is required"]} />}
          </Field>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending && <Loader2 className="animate-spin" />}
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
