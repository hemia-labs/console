"use client";

import { Filter, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 bg-card pl-10"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            placeholder={searchPlaceholder}
            value={search}
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
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
              <DropdownMenuRadioItem className="min-h-12 cursor-pointer px-2" value="">
                Todos los estados
              </DropdownMenuRadioItem>
              {userStatuses.map((item) => (
                <DropdownMenuRadioItem
                  className="min-h-12 cursor-pointer px-2"
                  key={item}
                  value={item}
                >
                  {statusLabels[item]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="h-12" onClick={onCreate} type="button">
          <Plus className="size-4" />
          {createLabel}
        </Button>
      </div>
    </div>
  );
}
