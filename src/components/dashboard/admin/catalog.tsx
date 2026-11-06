"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Info, Package, Pencil, RotateCcw, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { categoriesById, marketplaceCategories } from "@/config/marketplace";
import { isService } from "@/data/products";
import { useAdmin, useCatalog, type CatalogRow } from "@/store/admin";
import { useOrders } from "@/store/orders";
import { isToday } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";

const LOW_STOCK = 15;
const isLow = (p: CatalogRow) => !isService(p) && p.stock <= LOW_STOCK;

/** Marketplace catalog manager: price, stock, coverage, visibility and featured flags (demo-only overrides). */
export function AdminCatalog() {
  const rows = useCatalog();
  const orders = useOrders((s) => s.orders);
  const editProduct = useAdmin((s) => s.editProduct);
  const productEdits = useAdmin((s) => s.productEdits);
  const [category, setCategory] = useState("");
  const [view, setView] = useState<"" | "hidden" | "low" | "featured">("");
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (p) =>
          (!category || p.category === category) &&
          (view === "" || (view === "hidden" && !p.visible) || (view === "low" && isLow(p)) || (view === "featured" && p.featured)),
      ),
    [rows, category, view],
  );
  const live = rows.filter((p) => p.visible).length;
  const low = rows.filter(isLow).length;
  const avgRating = rows.reduce((s, p) => s + p.rating, 0) / rows.length;
  const ordersToday = orders.filter((o) => isToday(o.createdAt));
  const editing = editId ? rows.find((p) => p.id === editId) : undefined;
  const editedCount = Object.keys(productEdits).length;

  const columns: ColumnDef<CatalogRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className={cn("flex min-w-52 items-center gap-3", !p.visible && "opacity-60")}>
            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <Image src={p.image} alt="" fill sizes="88px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="line-clamp-1 font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.brand}
                {p.edited && <span className="font-semibold text-blue-700 dark:text-blue-300"> · edited</span>}
              </p>
            </div>
          </div>
        );
      },
    },
    { id: "category", accessorFn: (p) => categoriesById[p.category]?.name, header: "Category", meta: { className: "hidden lg:table-cell whitespace-nowrap" } },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="whitespace-nowrap tabular-nums">
          <span className="font-bold">{formatPrice(row.original.price)}</span>
          {row.original.oldPrice && <span className="ml-1 text-xs text-muted-foreground line-through">{formatPrice(row.original.oldPrice)}</span>}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) =>
        isService(row.original) ? (
          <span className="text-xs text-muted-foreground">Service</span>
        ) : (
          <span className={cn("tabular-nums", row.original.stock === 0 ? "font-bold text-red-700 dark:text-red-300" : isLow(row.original) && "font-bold text-coral-700 dark:text-orange-300")}>
            {row.original.stock}
          </span>
        ),
    },
    { accessorKey: "coverage", header: "Coverage", meta: { className: "hidden md:table-cell" }, cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}%</span> },
    {
      accessorKey: "rx",
      header: "Rx",
      meta: { className: "hidden xl:table-cell" },
      cell: ({ getValue }) => (getValue() ? <Badge variant="coral">Rx</Badge> : <span className="text-muted-foreground">–</span>),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      meta: { className: "hidden xl:table-cell" },
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          {(getValue() as number).toFixed(1)}
        </span>
      ),
    },
    {
      accessorKey: "visible",
      header: "Visible",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <Switch
            checked={p.visible}
            aria-label={`Show ${p.name} in the marketplace`}
            onCheckedChange={(v) => {
              editProduct(p.id, { visible: v });
              toast.success(v ? "Product visible" : "Product hidden", { description: p.name });
            }}
          />
        );
      },
    },
    {
      accessorKey: "featured",
      header: "Featured",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => {
        const p = row.original;
        return (
          <button
            type="button"
            aria-pressed={p.featured}
            aria-label={`Feature ${p.name}`}
            onClick={() => {
              editProduct(p.id, { featured: !p.featured });
              toast.success(p.featured ? "Removed from featured" : "Added to featured", { description: p.name });
            }}
            className="grid size-9 place-items-center rounded-full hover:bg-muted"
          >
            <Star className={cn("size-5", p.featured ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} aria-hidden />
          </button>
        );
      },
    },
    {
      id: "edit",
      enableSorting: false,
      header: () => <span className="sr-only">Edit</span>,
      cell: ({ row }) => (
        <Button size="icon" variant="ghost" className="size-9" aria-label={`Edit ${row.original.name}`} onClick={() => setEditId(row.original.id)}>
          <Pencil aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Catalog"
        description="Prices, stock, insurance coverage and what shows in the store."
        actions={
          editedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const edits = useAdmin.getState().productEdits;
                useAdmin.setState({ productEdits: {} });
                toast("Catalog edits cleared", {
                  description: `${Object.keys(edits).length} products back to default.`,
                  action: { label: "Undo", onClick: () => useAdmin.setState({ productEdits: edits }) },
                });
              }}
            >
              <RotateCcw aria-hidden /> Reset edits
            </Button>
          )
        }
      />

      <p className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Demo only: changes here are saved in this browser for the admin console. The public marketplace keeps showing the original catalog.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products live" value={live} icon={Eye} tone="brand" hint={`${rows.length - live} hidden`} />
        <StatCard label="Low stock" value={low} icon={Package} tone="coral" hint={`${LOW_STOCK} units or fewer`} />
        <StatCard label="Average rating" value={avgRating.toFixed(2)} icon={Star} tone="amber" hint={`${rows.reduce((s, p) => s + p.reviews, 0).toLocaleString("en-US")} reviews`} />
        <StatCard label="Orders today" value={ordersToday.length} icon={ShoppingBag} tone="blue" hint={formatPrice(Math.round(ordersToday.reduce((s, o) => s + o.subtotal, 0)))} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search products"
        pageSize={12}
        toolbar={
          <>
            <label className="sr-only" htmlFor="c-cat">
              Category
            </label>
            <NativeSelect id="c-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-auto min-w-40 rounded-full">
              <option value="">All categories</option>
              {marketplaceCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
            <label className="sr-only" htmlFor="c-view">
              Show
            </label>
            <NativeSelect id="c-view" value={view} onChange={(e) => setView(e.target.value as typeof view)} className="h-10 w-auto min-w-32 rounded-full">
              <option value="">All products</option>
              <option value="low">Low stock</option>
              <option value="hidden">Hidden</option>
              <option value="featured">Featured</option>
            </NativeSelect>
          </>
        }
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent size="md">{editing && <EditProductForm key={editing.id} product={editing} onDone={() => setEditId(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ edit */

const schema = z
  .object({
    price: z.number({ message: "Enter a price" }).positive("Price must be above 0").max(10_000, "Price looks too high"),
    oldPrice: z.union([z.number().positive("Old price must be above 0"), z.nan()]).optional(),
    stock: z.number({ message: "Enter stock" }).int("Whole numbers only").min(0, "Stock can't be negative"),
    coverage: z.number({ message: "Enter coverage" }).int("Whole numbers only").min(0, "0 to 100").max(100, "0 to 100"),
    visible: z.boolean(),
    featured: z.boolean(),
  })
  .refine((v) => v.oldPrice === undefined || Number.isNaN(v.oldPrice) || v.oldPrice > v.price, {
    message: "Old price should be higher than the new price",
    path: ["oldPrice"],
  });

type Values = z.infer<typeof schema>;

function EditProductForm({ product: p, onDone }: { product: CatalogRow; onDone: () => void }) {
  const editProduct = useAdmin((s) => s.editProduct);
  const service = isService(p);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { price: p.price, oldPrice: p.oldPrice ?? Number.NaN, stock: p.stock, coverage: p.coverage, visible: p.visible, featured: p.featured },
  });

  function onSubmit(v: Values) {
    const hasOld = v.oldPrice !== undefined && !Number.isNaN(v.oldPrice);
    editProduct(p.id, {
      price: v.price,
      oldPrice: hasOld ? v.oldPrice : undefined,
      clearOldPrice: !hasOld,
      stock: v.stock,
      coverage: v.coverage,
      visible: v.visible,
      featured: v.featured,
    });
    toast.success("Saved", { description: `${p.name} updated.` });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex items-center gap-3 pr-8">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          <Image src={p.image} alt="" fill sizes="112px" className="object-cover" />
        </span>
        <div className="min-w-0">
          <DialogTitle className="line-clamp-2 text-lg">{p.name}</DialogTitle>
          <DialogDescription className="mt-0.5">
            {categoriesById[p.category]?.name} · {p.brand}
          </DialogDescription>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-price">Price (USD)</Label>
          <Input id="p-price" type="number" step="0.01" min={0} aria-invalid={!!errors.price} {...register("price", { valueAsNumber: true })} />
          <FieldError message={errors.price?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-old">Old price (optional)</Label>
          <Input id="p-old" type="number" step="0.01" min={0} placeholder="No sale" aria-invalid={!!errors.oldPrice} {...register("oldPrice", { valueAsNumber: true })} />
          <FieldError message={errors.oldPrice?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-stock">{service ? "Slots available" : "Stock"}</Label>
          <Input id="p-stock" type="number" min={0} aria-invalid={!!errors.stock} {...register("stock", { valueAsNumber: true })} />
          <FieldError message={errors.stock?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-cov">Insurance coverage (%)</Label>
          <Input id="p-cov" type="number" min={0} max={100} aria-invalid={!!errors.coverage} {...register("coverage", { valueAsNumber: true })} />
          <FieldError message={errors.coverage?.message} />
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-surface-2 p-4">
        <Controller
          control={control}
          name="visible"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="p-visible">Visible in the marketplace</Label>
              <Switch id="p-visible" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="p-featured">Featured on the home page</Label>
              <Switch id="p-featured" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!isDirty}>
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
