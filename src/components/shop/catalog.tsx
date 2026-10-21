"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { departmentsBySlug } from "@/config/departments";
import { categoriesById, marketplaceCategories } from "@/config/marketplace";
import { products, type Product } from "@/data/products";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label, NativeSelect } from "@/components/ui/form-controls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ProductCard } from "./product-card";

export const PRICE_MAX = 1300;

const sorts = {
  popular: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
  newest: "Newest",
} as const;
type SortKey = keyof typeof sorts;

/** Departments that have at least one product, sorted by name. */
const shopDepartments = Array.from(new Set(products.flatMap((p) => p.departments)))
  .filter((slug) => departmentsBySlug[slug])
  .sort((a, b) => departmentsBySlug[a].name.localeCompare(departmentsBySlug[b].name));

const productOrder = new Map(products.map((p, i) => [p.id, i]));

interface Filters {
  q: string;
  category: string;
  department: string;
  min: number;
  max: number;
  rating: number;
  covered: boolean;
  rx: "" | "rx" | "otc";
  rent: boolean;
  tags: string[];
  sort: SortKey;
}

function readFilters(params: URLSearchParams): Filters {
  const num = (k: string, d: number) => {
    const n = Number(params.get(k));
    return params.has(k) && Number.isFinite(n) ? n : d;
  };
  const rx = params.get("rx");
  const sort = params.get("sort") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    department: params.get("department") ?? params.get("dept") ?? "",
    min: Math.max(0, num("min", 0)),
    max: Math.min(PRICE_MAX, num("max", PRICE_MAX)),
    rating: num("rating", 0),
    covered: params.get("covered") === "1",
    rx: rx === "rx" || rx === "otc" ? rx : "",
    rent: params.get("rent") === "1",
    tags: (params.get("tag") ?? "").split(",").filter((t) => t === "deal" || t === "new"),
    sort: sort && sort in sorts ? sort : "popular",
  };
}

function applyFilters(f: Filters): Product[] {
  const term = f.q.trim().toLowerCase();
  const list = products.filter((p) => {
    if (f.category && p.category !== f.category) return false;
    if (f.department && !p.departments.includes(f.department)) return false;
    if (p.price < f.min || p.price > f.max) return false;
    if (f.rating && p.rating < f.rating) return false;
    if (f.covered && p.coverage === 0) return false;
    if (f.rx === "rx" && !p.rx) return false;
    if (f.rx === "otc" && p.rx) return false;
    if (f.rent && !p.rent) return false;
    if (f.tags.includes("deal") && !p.oldPrice) return false;
    if (f.tags.includes("new") && !p.tags?.includes("new")) return false;
    if (!term) return true;
    const hay = [p.name, p.brand, p.description, categoriesById[p.category].name, ...p.highlights, ...p.departments.map((d) => departmentsBySlug[d]?.name ?? d)]
      .join(" ")
      .toLowerCase();
    return term.split(/\s+/).every((w) => hay.includes(w));
  });
  const by: Record<SortKey, (a: Product, b: Product) => number> = {
    popular: (a, b) => Number(!!b.tags?.includes("bestseller")) - Number(!!a.tags?.includes("bestseller")) || b.reviews - a.reviews,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    newest: (a, b) => Number(!!b.tags?.includes("new")) - Number(!!a.tags?.includes("new")) || productOrder.get(b.id)! - productOrder.get(a.id)!,
  };
  return list.sort(by[f.sort]);
}

/** Full catalog: faceted filters synced to the URL, sort, chips, grid/list view. Wrap in <Suspense>. */
export function Catalog() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const f = useMemo(() => readFilters(new URLSearchParams(params)), [params]);
  const results = useMemo(() => applyFilters(f), [f]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sheetOpen, setSheetOpen] = useState(false);

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if ("department" in next) p.delete("dept");
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  }
  const clearAll = () => router.replace(pathname, { scroll: false });

  const chips: { key: string; label: string; clear: Record<string, string | null> }[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, clear: { q: null } });
  if (f.category) chips.push({ key: "category", label: categoriesById[f.category as Product["category"]]?.name ?? f.category, clear: { category: null } });
  if (f.department) chips.push({ key: "department", label: departmentsBySlug[f.department]?.name ?? f.department, clear: { department: null } });
  if (f.min > 0 || f.max < PRICE_MAX) chips.push({ key: "price", label: `${formatPrice(f.min)} – ${formatPrice(f.max)}`, clear: { min: null, max: null } });
  if (f.rating) chips.push({ key: "rating", label: `${f.rating}+ stars`, clear: { rating: null } });
  if (f.covered) chips.push({ key: "covered", label: "Covered by insurance", clear: { covered: null } });
  if (f.rx) chips.push({ key: "rx", label: f.rx === "rx" ? "Needs prescription" : "No prescription", clear: { rx: null } });
  if (f.rent) chips.push({ key: "rent", label: "Can rent", clear: { rent: null } });
  for (const t of f.tags)
    chips.push({ key: `tag-${t}`, label: t === "deal" ? "Deals" : "New", clear: { tag: f.tags.filter((x) => x !== t).join(",") || null } });

  const panel = <FilterPanel f={f} update={update} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border border-border bg-surface p-5 shadow-soft">{panel}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBox value={f.q} onChange={(q) => update({ q: q || null })} />
          <div className="flex items-center gap-2">
            <Button variant="outline" className="lg:hidden" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal aria-hidden /> Filters
              {chips.length > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">{chips.length}</span>}
            </Button>
            <label className="sr-only" htmlFor="catalog-sort">Sort by</label>
            <NativeSelect id="catalog-sort" className="min-w-0 flex-1 sm:w-48" value={f.sort} onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}>
              {Object.entries(sorts).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </NativeSelect>
            <div role="radiogroup" aria-label="Layout" className="hidden rounded-full bg-muted p-1 sm:flex">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  aria-label={v === "grid" ? "Grid view" : "List view"}
                  onClick={() => setView(v)}
                  className={cn("grid size-9 place-items-center rounded-full transition-colors", view === v ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground")}
                >
                  {v === "grid" ? <LayoutGrid className="size-4" aria-hidden /> : <List className="size-4" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-muted-foreground" aria-live="polite">
            <span className="font-bold text-foreground tabular-nums">{results.length}</span> {results.length === 1 ? "item" : "items"}
          </p>
          <AnimatePresence initial={false}>
            {chips.map((c) => (
              <motion.button
                layout
                key={c.key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                type="button"
                onClick={() => update(c.clear)}
                aria-label={`Remove filter: ${c.label}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
              >
                {c.label} <X className="size-3.5" aria-hidden />
              </motion.button>
            ))}
          </AnimatePresence>
          {chips.length > 1 && (
            <button type="button" onClick={clearAll} className="text-xs font-bold text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>

        {results.length ? (
          <motion.ul
            layout
            className={cn("mt-6 grid gap-4", view === "grid" ? "grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProductCard product={p} layout={view} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-border px-4 py-14 text-center">
            <Image src="/images/dashboard/empty-search.png" alt="" width={180} height={180} className="size-36" />
            <h3 className="mt-3 text-xl font-bold">Nothing matches those filters</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try a wider price range, another category, or clear the filters.</p>
            <Button variant="soft" className="mt-5" onClick={clearAll}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[92vw]">
          <div className="border-b border-border px-5 py-5">
            <SheetTitle className="font-display text-xl font-extrabold">Filters</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">Results update as you choose.</SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{panel}</div>
          <div className="flex gap-2 border-t border-border p-4">
            <Button variant="outline" className="flex-1" onClick={clearAll}>
              Clear
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Show {results.length} {results.length === 1 ? "item" : "items"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Search input with a short debounce so typing does not flood the URL. */
function SearchBox({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    if (value !== text.trim()) setText(value);
  }
  useEffect(() => {
    if (text.trim() === value) return;
    const id = setTimeout(() => onChange(text.trim()), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <label className="relative flex-1">
      <span className="sr-only">Search the marketplace</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search tests, medicines, devices…"
        className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm shadow-soft focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
      />
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <legend className="mb-3 float-left w-full text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</legend>
      <div className="clear-both space-y-2">{children}</div>
    </fieldset>
  );
}

function CheckRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="cursor-pointer font-medium">{label}</Label>
    </div>
  );
}

function FilterPanel({ f, update }: { f: Filters; update: (next: Record<string, string | null>) => void }) {
  const [range, setRange] = useState<[number, number]>([f.min, f.max]);
  const [synced, setSynced] = useState(`${f.min}-${f.max}`);
  if (`${f.min}-${f.max}` !== synced) {
    setSynced(`${f.min}-${f.max}`);
    setRange([f.min, f.max]);
  }
  const toggleTag = (t: string, on: boolean) => {
    const next = on ? [...f.tags, t] : f.tags.filter((x) => x !== t);
    update({ tag: next.join(",") || null });
  };
  const radio = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
      active ? "border-primary bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200" : "border-border hover:border-brand-400",
    );

  return (
    <div>
      <Group title="Category">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={!f.category} onClick={() => update({ category: null })} className={radio(!f.category)}>
            All
          </button>
          {marketplaceCategories.map((c) => (
            <button key={c.id} type="button" aria-pressed={f.category === c.id} onClick={() => update({ category: f.category === c.id ? null : c.id })} className={radio(f.category === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Department">
        <Label htmlFor="flt-dept" className="sr-only">Department</Label>
        <NativeSelect id="flt-dept" value={f.department} onChange={(e) => update({ department: e.target.value || null })}>
          <option value="">All departments</option>
          {shopDepartments.map((slug) => (
            <option key={slug} value={slug}>{departmentsBySlug[slug].name}</option>
          ))}
        </NativeSelect>
      </Group>

      <Group title="Price">
        <Slider
          min={0}
          max={PRICE_MAX}
          step={10}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(v) => setRange([v[0], v[1]])}
          onValueCommit={(v) => update({ min: v[0] > 0 ? String(v[0]) : null, max: v[1] < PRICE_MAX ? String(v[1]) : null })}
          thumbLabels={["Minimum price", "Maximum price"]}
          className="mt-2"
        />
        <p className="flex justify-between text-sm font-semibold tabular-nums">
          <span>{formatPrice(range[0])}</span>
          <span>{range[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(range[1])}</span>
        </p>
      </Group>

      <Group title="Rating">
        <div className="flex flex-wrap gap-1.5">
          {[0, 4, 4.5].map((r) => (
            <button key={r} type="button" aria-pressed={f.rating === r} onClick={() => update({ rating: r ? String(r) : null })} className={radio(f.rating === r)}>
              {r ? `${r}★ & up` : "Any"}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Insurance">
        <CheckRow id="flt-covered" label="Covered by insurance" checked={f.covered} onChange={(v) => update({ covered: v ? "1" : null })} />
      </Group>

      <Group title="Prescription">
        <div className="flex flex-wrap gap-1.5">
          {([["", "Any"], ["rx", "Needs Rx"], ["otc", "No Rx"]] as const).map(([v, l]) => (
            <button key={v || "any"} type="button" aria-pressed={f.rx === v} onClick={() => update({ rx: v || null })} className={radio(f.rx === v)}>
              {l}
            </button>
          ))}
        </div>
      </Group>

      <Group title="More">
        <CheckRow id="flt-rent" label="Can rent by the week" checked={f.rent} onChange={(v) => update({ rent: v ? "1" : null })} />
        <CheckRow id="flt-deal" label="Deals" checked={f.tags.includes("deal")} onChange={(v) => toggleTag("deal", v)} />
        <CheckRow id="flt-new" label="New arrivals" checked={f.tags.includes("new")} onChange={(v) => toggleTag("new", v)} />
      </Group>
    </div>
  );
}
