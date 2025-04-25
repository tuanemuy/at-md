"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  Pagination as PaginationUI,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  totalPages: number;
};

export function Pagination({ totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const page = params.page ? Number(params.page) : 1;
  const onPageChange = (page: number) => {
    params.page = page.toString();
    const searchParams = new URLSearchParams(params);
    router.push(`?${searchParams.toString()}`);
  };

  return (
    <PaginationUI>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <Button
              onClick={() => onPageChange(page - 1)}
              size="icon"
              variant="ghost"
              className="cursor-pointer"
            >
              <ChevronLeft />
            </Button>
          </PaginationItem>
        )}

        {page > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {[page - 1, page, page + 1].map((p) => {
          if (p > 0 && p <= totalPages) {
            return (
              <PaginationItem key={p}>
                <Button
                  onClick={() => onPageChange(p)}
                  variant={page === p ? "outline" : "ghost"}
                  size="icon"
                  className="cursor-pointer"
                >
                  {p}
                </Button>
              </PaginationItem>
            );
          }
        })}
        {page + 1 < totalPages && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {page < totalPages && (
          <PaginationItem>
            <Button
              onClick={() => onPageChange(page + 1)}
              size="icon"
              variant="ghost"
              className="cursor-pointer"
            >
              <ChevronRight />
            </Button>
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationUI>
  );
}
