"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Stethoscope } from "lucide-react";
import { departments } from "@/config/departments";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (dept) params.set("department", dept);
        router.push(`/doctors${params.size ? `?${params}` : ""}`);
      }}
      className="flex w-full max-w-xl flex-col gap-2 rounded-3xl bg-white p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="flex flex-1 items-center gap-2.5 rounded-full px-4 focus-within:ring-2 focus-within:ring-brand-500">
        <Search className="size-5 shrink-0 text-brand-600" aria-hidden />
        <span className="sr-only">Doctor name or condition</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Doctor, condition or symptom"
          className="h-11 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
        />
      </label>
      <span className="hidden h-8 w-px bg-slate-200 sm:block" />
      <label className="flex items-center gap-2 rounded-full px-4 focus-within:ring-2 focus-within:ring-brand-500 sm:w-52">
        <Stethoscope className="size-5 shrink-0 text-brand-600" aria-hidden />
        <span className="sr-only">Department</span>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="h-11 w-full appearance-none bg-transparent text-sm text-slate-900 focus:outline-none"
        >
          <option value="">Any department</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-12 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-800"
      >
        Search
      </button>
    </form>
  );
}
