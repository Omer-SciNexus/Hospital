"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Clock, IdCard, Mail, Moon, Phone, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { departments } from "@/config/departments";
import { roles, type Role } from "@/config/navigation";
import type { Shift } from "@/data/staff";
import { deptName, staffing } from "@/data/operations";
import { useAdmin, useStaffDirectory, type DirectoryMember } from "@/store/admin";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { FieldError, Input, Label, NativeSelect } from "@/components/ui/form-controls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DataTable, type ColumnDef } from "@/components/dashboard/data-table";

const staffRoles = roles.filter((r) => r.id !== "patient");
const roleLabel = Object.fromEntries(roles.map((r) => [r.id, r.label])) as Record<Role, string>;
const shifts: Shift[] = ["Day", "Evening", "Night", "Off"];
const shiftHours: Record<Shift, string> = { Day: "07:00–15:00", Evening: "15:00–23:00", Night: "23:00–07:00", Off: "Off" };
const deptOptions = [
  { slug: "administration", name: "Administration" },
  { slug: "billing", name: "Billing" },
  ...departments.map((d) => ({ slug: d.slug, name: d.name })),
].sort((a, b) => a.name.localeCompare(b.name));

const columns: ColumnDef<DirectoryMember, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const m = row.original;
      return (
        <div className="flex min-w-44 items-center gap-3">
          <Avatar name={m.name} src={m.avatar} size={36} />
          <div className="min-w-0">
            <p className={m.active ? "font-semibold" : "font-semibold text-muted-foreground line-through"}>{m.name}</p>
            <p className="truncate text-xs text-muted-foreground">{m.title}</p>
          </div>
        </div>
      );
    },
  },
  { accessorKey: "role", header: "Role", meta: { className: "hidden md:table-cell" }, cell: ({ row }) => roleLabel[row.original.role] },
  { id: "department", accessorFn: (m) => deptName(m.department), header: "Department", meta: { className: "hidden sm:table-cell" } },
  {
    accessorKey: "shift",
    header: "Shift",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        {row.original.shift === "Night" && <Moon className="size-3.5 text-muted-foreground" aria-hidden />}
        {row.original.shift}
      </span>
    ),
  },
  {
    accessorKey: "presence",
    header: "Status",
    cell: ({ row }) => (row.original.active ? <StatusBadge status={row.original.presence} /> : <StatusBadge status="inactive" />),
  },
  { accessorKey: "email", header: "Email", meta: { className: "hidden xl:table-cell text-muted-foreground" } },
];

/** Staff directory with filters, add-member form and a profile drawer for edits. */
export function AdminStaff() {
  const directory = useStaffDirectory();
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");
  const [shift, setShift] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offered, setOffered] = useState<string[]>([]);

  const filtered = useMemo(
    () => directory.filter((m) => (!role || m.role === role) && (!dept || m.department === dept) && (!shift || m.shift === shift)),
    [directory, role, dept, shift],
  );
  const usedDepts = useMemo(() => deptOptions.filter((d) => directory.some((m) => m.department === d.slug)), [directory]);
  const selected = directory.find((m) => m.id === selectedId) ?? null;
  const inactive = directory.filter((m) => !m.active).length;
  const openShiftCount = staffing.openShifts.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Staff"
        description="Everyone who works here, their shift today and how to reach them."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus aria-hidden /> Add staff member
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On shift now" value={staffing.onShiftNow} icon={UserCheck} tone="brand" hint={`${directory.filter((m) => m.active && m.presence !== "offline").length} in this list online`} />
        <StatCard label="Open shifts" value={openShiftCount} icon={CalendarDays} tone="coral" hint={`${staffing.openShifts.filter((s) => s.shift === "Night").length} on nights`} />
        <StatCard label="On leave" value={staffing.onLeave + inactive} icon={UserX} tone="amber" hint={inactive ? `${inactive} deactivated here` : "Planned leave this week"} />
        <StatCard label="In directory" value={directory.length} icon={Users} tone="blue" hint="Key staff shown below" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search name, title, email"
          onRowClick={(m) => setSelectedId(m.id)}
          initialSorting={[{ id: "name", desc: false }]}
          toolbar={
            <>
              <label className="sr-only" htmlFor="f-role">
                Role
              </label>
              <NativeSelect id="f-role" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 w-auto min-w-32 rounded-full">
                <option value="">All roles</option>
                {staffRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
              <label className="sr-only" htmlFor="f-dept">
                Department
              </label>
              <NativeSelect id="f-dept" value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 w-auto min-w-36 max-w-48 rounded-full">
                <option value="">All departments</option>
                {usedDepts.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
              <label className="sr-only" htmlFor="f-shift">
                Shift
              </label>
              <NativeSelect id="f-shift" value={shift} onChange={(e) => setShift(e.target.value)} className="h-10 w-auto min-w-28 rounded-full">
                <option value="">All shifts</option>
                {shifts.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </>
          }
        />

        <Panel title="Open shifts" description="Gaps in the rota this week" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {staffing.openShifts.map((s) => {
              const done = offered.includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {s.count} × {s.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {deptName(s.department)} · {s.shift} ({shiftHours[s.shift as Shift]})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "ghost" : "soft"}
                    disabled={done}
                    onClick={() => {
                      setOffered((o) => [...o, s.id]);
                      toast.success("Shift offered", { description: `Sent to the ${deptName(s.department)} bank staff list.` });
                    }}
                  >
                    {done ? "Offered" : "Offer"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <AddStaffDialog open={addOpen} onOpenChange={setAddOpen} />
      <StaffSheet member={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ add */

const addSchema = z.object({
  name: z.string().trim().min(3, "Please enter a full name"),
  title: z.string().trim().min(2, "Please enter a job title"),
  role: z.enum(["doctor", "nurse", "admin", "pharmacist", "billing"], { message: "Choose a role" }),
  department: z.string().min(1, "Choose a department"),
  shift: z.enum(["Day", "Evening", "Night", "Off"], { message: "Choose a shift" }),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().min(3, "Please enter a phone or extension"),
});

type AddValues = z.infer<typeof addSchema>;

function AddStaffDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const addStaff = useAdmin((s) => s.addStaff);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { shift: "Day", role: "nurse", department: "", phone: "ext. " },
  });

  function onSubmit(v: AddValues) {
    addStaff(v);
    toast.success("Staff member added", { description: `${v.name} joins ${deptName(v.department)}.` });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogTitle>Add staff member</DialogTitle>
        <DialogDescription>They will show in the directory and staff chat. Demo only, saved in this browser.</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-name">Full name</Label>
            <Input id="s-name" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-title">Job title</Label>
            <Input id="s-title" placeholder="Staff Nurse" aria-invalid={!!errors.title} {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-role">Role</Label>
            <NativeSelect id="s-role" aria-invalid={!!errors.role} {...register("role")}>
              {staffRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.role?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-dept">Department</Label>
            <NativeSelect id="s-dept" aria-invalid={!!errors.department} {...register("department")}>
              <option value="">Choose…</option>
              {deptOptions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.department?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-shift">Shift</Label>
            <NativeSelect id="s-shift" aria-invalid={!!errors.shift} {...register("shift")}>
              {shifts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.shift?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone">Phone or extension</Label>
            <Input id="s-phone" aria-invalid={!!errors.phone} {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-email">Work email</Label>
            <Input id="s-email" type="email" placeholder="name@hospital.example" aria-invalid={!!errors.email} {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              <UserPlus aria-hidden /> Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- profile */

function weekSchedule(m: DirectoryMember) {
  const seed = m.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const firstOff = seed % 7;
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday.getTime() + i * 86_400_000);
    const off = !m.active || m.shift === "Off" || i === firstOff || i === (firstOff + 1) % 7;
    return {
      date,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(date),
      today: date.toDateString() === new Date().toDateString(),
      shift: (off ? "Off" : m.shift) as Shift,
    };
  });
}

function StaffSheet({ member, onClose }: { member: DirectoryMember | null; onClose: () => void }) {
  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-w-md">{member && <StaffProfile key={member.id + String(member.active)} member={member} />}</SheetContent>
    </Sheet>
  );
}

function StaffProfile({ member: m }: { member: DirectoryMember }) {
  const editStaff = useAdmin((s) => s.editStaff);
  const [role, setRole] = useState<Role>(m.role);
  const [department, setDepartment] = useState(m.department);
  const [shift, setShift] = useState<Shift>(m.shift);
  const dirty = role !== m.role || department !== m.department || shift !== m.shift;
  const schedule = weekSchedule(m);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border p-6 pr-14">
        <div className="flex items-center gap-4">
          <Avatar name={m.name} src={m.avatar} size={64} />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-extrabold">{m.name}</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {m.title} · {deptName(m.department)}
            </SheetDescription>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.active ? <StatusBadge status={m.presence} /> : <StatusBadge status="inactive" />}
              <Badge variant="outline">{roleLabel[m.role]}</Badge>
              {m.added && <Badge variant="blue">New</Badge>}
            </div>
          </div>
        </div>
        <dl className="mt-5 grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Email</dt>
            <dd className="truncate">
              <a href={`mailto:${m.email}`} className="hover:underline">
                {m.email}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Phone</dt>
            <dd>{m.phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <IdCard className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Joined</dt>
            <dd>Joined {m.joined}</dd>
          </div>
        </dl>
      </div>

      <div className="border-b border-border p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Clock className="size-4" aria-hidden /> This week
        </h3>
        <ul className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {schedule.map((d) => (
            <li
              key={d.label}
              className={
                d.today
                  ? "rounded-lg bg-brand-50 p-1.5 ring-1 ring-brand-400 dark:bg-brand-950"
                  : d.shift === "Off"
                    ? "rounded-lg bg-muted/60 p-1.5 text-muted-foreground"
                    : "rounded-lg bg-surface-2 p-1.5"
              }
            >
              <span className="block font-semibold">{d.label.split(" ")[0]}</span>
              <span className="block text-[11px]">{d.shift}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Shift hours: {shiftHours[m.shift]}</p>
      </div>

      <form
        className="space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          editStaff(m.id, m.active ? { role, department, shift } : { role, department });
          toast.success("Saved", { description: `${m.name}'s details are updated.` });
        }}
      >
        <h3 className="text-sm font-bold">Edit assignment</h3>
        <div className="space-y-2">
          <Label htmlFor="e-role">Role</Label>
          <NativeSelect id="e-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {staffRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-dept">Department</Label>
          <NativeSelect id="e-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {deptOptions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="e-shift">Shift</Label>
          <NativeSelect id="e-shift" value={shift} onChange={(e) => setShift(e.target.value as Shift)} disabled={!m.active}>
            {shifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
          {m.active ? (
            <Button
              type="button"
              variant="outline"
              className="text-red-700 hover:border-red-400 hover:text-red-700 dark:text-red-300"
              onClick={() => {
                editStaff(m.id, { active: false });
                toast("Account deactivated", { description: `${m.name} can no longer sign in.` });
              }}
            >
              <UserX aria-hidden /> Deactivate
            </Button>
          ) : (
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                editStaff(m.id, { active: true });
                toast.success("Account reactivated", { description: `${m.name} can sign in again.` });
              }}
            >
              <UserCheck aria-hidden /> Reactivate
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
