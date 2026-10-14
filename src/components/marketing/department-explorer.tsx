"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { departmentGroups, departments, type DepartmentGroupId } from "@/config/departments";
import { cn } from "@/lib/utils";
import { DepartmentTile } from "./department-card";

/** Department grid with group filter pills. `limit` caps the "All" view on the home page. */
export function DepartmentExplorer({ limit }: { limit?: number }) {
  const [group, setGroup] = useState<DepartmentGroupId | "all">("all");
  const list =
    group === "all"
      ? limit
        ? departments.filter((d) => d.featured).slice(0, limit)
        : departments
      : departments.filter((d) => d.group === group);

  const tabs = [{ id: "all" as const, name: limit ? "Popular" : "All" }, ...departmentGroups];

  return (
    <div>
      <div role="group" aria-label="Filter departments by group" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={group === t.id}
            onClick={() => setGroup(t.id)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              group === t.id ? "text-primary-foreground" : "bg-surface text-muted-foreground ring-1 ring-border hover:text-foreground",
            )}
          >
            {group === t.id && (
              <motion.span layoutId="dept-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
            )}
            <span className="relative">{t.name}</span>
          </button>
        ))}
      </div>

      <motion.ul layout className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((d) => (
            <motion.li
              key={d.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <DepartmentTile department={d} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
