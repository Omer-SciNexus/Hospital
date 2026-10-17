"use client";

import { useQuery } from "@tanstack/react-query";
import { BedDouble, Clock, RefreshCw, Users } from "lucide-react";
import { getErStatus, queryKeys } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ErStatus() {
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: queryKeys.erStatus,
    queryFn: getErStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = [
    { icon: Clock, label: "Average wait", value: data ? `${data.waitMinutes} min` : "" },
    { icon: Users, label: "Patients waiting", value: data ? String(data.patientsWaiting) : "" },
    { icon: BedDouble, label: "Beds free", value: data ? String(data.bedsAvailable) : "" },
  ];

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
          </span>
          Live ER status
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="grid size-8 place-items-center rounded-full hover:bg-muted"
          aria-label="Refresh ER status"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} aria-hidden />
        </button>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col rounded-2xl bg-muted/60 p-3 text-center">
            <it.icon className="mx-auto size-5 text-red-500" aria-hidden />
            <dt className="order-last mt-0.5 text-xs text-muted-foreground">{it.label}</dt>
            <dd className="mt-2 font-display text-xl font-extrabold tabular-nums">
              {isPending ? <span className="mx-auto block h-6 w-12 animate-pulse rounded bg-border" /> : it.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        {data ? `Updated ${new Date(data.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}. ` : ""}
        The most urgent patients are always seen first.
      </p>
    </div>
  );
}
