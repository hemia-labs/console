"use client";

import { Filter, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/zuno/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
import { SearchInput } from "@/components/zuno/search-input";
import type { UserStatus } from "@/features/identity-access/types";
import { userStatuses } from "@/features/identity-access/types";

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  deleted: "Eliminado",
  locked: "Bloqueado",
  suspended: "Suspendido",
};

export function IdentityToolbar({
  createLabel,
  onCreate,
  searchPlaceholder,
}: {
  createLabel: string;
  onCreate: () => void;
  searchPlaceholder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  function applyFilters(nextSearch = search, nextStatus = status) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    } else {
      params.delete("search");
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    params.delete("page");

    startTransition(() => {
      router.push(`?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
        <SearchInput
            className="bg-card"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search}
          />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            disabled={isPending}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="truncate">
                {status ? statusLabels[status as UserStatus] : "Todos los estados"}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup
              onValueChange={(value) => {
                setStatus(value);
                applyFilters(search, value);
              }}
              value={status}
            >
              <DropdownMenuRadioItem className="min-h-8 cursor-pointer px-2" value="">
                Todos los estados
              </DropdownMenuRadioItem>
              {userStatuses.map((item) => (
                <DropdownMenuRadioItem
                  className="min-h-8 cursor-pointer px-2"
                  key={item}
                  value={item}
                >
                  {statusLabels[item]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="h-8" onClick={onCreate} type="button">
          <Plus className="size-4" />
          {createLabel}
        </Button>
      </div>
    </div>
  );
}
