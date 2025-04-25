"use client";

import { searchRepositories } from "@/actions/note";
import type { GitHubRepository } from "@/domain/note/dtos";
import { useDebounceValue } from "@/hooks/use-debounce-value";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Pagination } from "@/components/navigation/ClientPagination";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBook } from "./AddBook";

type Props = {
  userId: string;
  owners: Owner[];
  usedRepositories: string[];
};

export type Owner = {
  type: "user" | "org";
  name: string;
};

const limit = 5;

export function Repositories({ userId, owners, usedRepositories }: Props) {
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const query = useDebounceValue(queryInput, 500);
  const [owner, setOwner] = useState<Owner | null>(owners[0] || null);

  const totalPages = Math.ceil(count / limit);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);

  const [isPending, startTransition] = useTransition();

  const fetch = useCallback(
    (query: string, page: number, owner: Owner) => {
      startTransition(async () => {
        const { repositories, count } = await searchRepositories(
          userId,
          query,
          owner,
          {
            order: query ? "asc" : "desc",
            orderBy: query ? "best match" : "updated",
            limit,
            page,
          },
        );

        setCount(count);
        setRepositories(repositories);
      });
    },
    [userId],
  );

  useEffect(() => {
    if (owner) {
      fetch(query, page, owner);
    }
  }, [query, page, owner, fetch]);

  return (
    <Card className="py-0">
      <div className="flex items-center gap-2 pt-4 px-4">
        <Select defaultValue={owner ? `${owner.type}:${owner.name}` : ""}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem
                key={`${owner.type}:${owner.name}`}
                value={`${owner.type}:${owner.name}`}
                onClick={() => setOwner(owner)}
              >
                {`${owner.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          onChange={(e) => setQueryInput(e.target.value || "")}
          placeholder="Search"
        />
      </div>

      {isPending && (
        <ul>
          {[0, 1, 2, 3, 4].map((index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-2 py-4 px-6 border-t-1 last:border-b-1"
            >
              <Skeleton className="w-full h-9" />
            </li>
          ))}
        </ul>
      )}

      {!isPending && (
        <ul>
          {repositories.map((repository) => (
            <li
              key={`${repository.owner}:${repository.name}`}
              className="flex items-center justify-between gap-2 py-4 px-6 border-t-1 last:border-b-1"
            >
              {repository.name}
              <AddBook
                userId={userId}
                owner={repository.owner}
                repo={repository.name}
                disabled={usedRepositories.includes(
                  `${repository.owner}/${repository.name}`,
                )}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="pb-4 px-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(page) => setPage(page)}
        />
      </div>
    </Card>
  );
}
