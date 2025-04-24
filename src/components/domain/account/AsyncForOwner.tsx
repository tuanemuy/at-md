"use client";

import type { SessionData } from "@/domain/account/models/session-data";

import { auth } from "@/actions/account";
import { useTransition } from "react";
import { useEffect, useState } from "react";

type Props = {
  userId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function ForOwner({ userId, fallback, children }: Props) {
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState<SessionData | null | undefined>(
    undefined,
  );

  useEffect(() => {
    startTransition(async () => {
      const session = await auth();
      setSession(session);
    });
  }, []);

  if (session && session.user.id === userId) {
    return <>{children}</>;
  }

  if ((isPending || session === undefined) && fallback) {
    return <>{fallback}</>;
  }

  return null;
}
