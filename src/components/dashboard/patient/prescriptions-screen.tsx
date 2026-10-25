"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, CalendarClock, Check, Pill, RefreshCw, Send, Upload } from "lucide-react";
import { doctorsById } from "@/data/doctors";
import { DEMO_PATIENT_ID, demoPatient } from "@/data/patients";
import { productsById } from "@/data/products";
import { useCart } from "@/store/cart";
import { useOrders, RX_UPLOAD_ID } from "@/store/orders";
import { useSession } from "@/store/session";
import { formatDay } from "@/lib/dates";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/form-controls";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { activeMedicines, pastMedicines, type Medicine } from "./prescriptions-data";
import { UploadDropzone } from "./upload-dropzone";

/** Active and past medicines, refills, prescription upload and dose reminders. */
export function PrescriptionsScreen() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [requested, setRequested] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Record<string, boolean>>({ amlodipine: true, atorvastatin: true, "vitamin-d3": false });
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const router = useRouter();

  useEffect(() => {
    if (window.location.hash === "#upload") setUploadOpen(true);
  }, []);

  function requestRefill(m: Medicine) {
    setRequested((r) => [...r, m.id]);
    const product = m.productId ? productsById[m.productId] : undefined;
    if (product) {
      add({
        id: product.id,
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        rx: product.rx,
        category: product.category,
        coverage: product.coverage,
        mode: "buy",
      });
      toast.success(`Refill requested for ${m.name}`, {
        description: "Your doctor's prescription is on file. We also added it to your cart for delivery.",
        action: {
          label: "View cart",
          onClick: () => {
            setCartOpen(true);
            router.push("/marketplace");
          },
        },
      });
    } else {
      toast.success(`Refill requested for ${m.name}`, { description: "Collect it at the hospital pharmacy in 1 working day." });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="My care"
        title="Prescriptions"
        description="Your medicines, refills and reminders. Our pharmacists check every prescription."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload aria-hidden /> Upload a prescription
          </Button>
        }
      />

      <section aria-labelledby="active-meds">
        <h2 id="active-meds" className="mb-4 text-lg font-bold">
          Active medicines
        </h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {activeMedicines.map((m) => {
            const doctor = doctorsById[m.doctorId];
            const done = requested.includes(m.id);
            const low = m.daysLeft <= 7;
            return (
              <li key={m.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                    <Pill className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold">{m.name}</h3>
                    <p className="text-sm text-muted-foreground">{m.dose}</p>
                  </div>
                  <Badge variant="muted">{m.reason}</Badge>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">How to take</dt>
                    <dd className="text-right font-semibold">{m.schedule}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Prescribed by</dt>
                    <dd className="text-right font-semibold">{doctor?.name}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Refills left</dt>
                    <dd className="font-semibold tabular-nums">
                      {m.refillsLeft} of {m.refillsTotal}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{m.daysLeft} days of tablets left</span>
                    <span className="text-muted-foreground">Next refill {formatDay(m.nextRefill)}</span>
                  </div>
                  <Progress value={m.daysLeft} max={30} tone={low ? "coral" : "brand"} className="mt-2" label={`${m.name}: ${m.daysLeft} of 30 days left`} />
                </div>
                <Button className="mt-4" variant={low ? "primary" : "soft"} disabled={done || m.refillsLeft === 0} onClick={() => requestRefill(m)}>
                  {done ? <Check aria-hidden /> : <RefreshCw aria-hidden />}
                  {done ? "Refill requested" : "Request refill"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Panel title="Medicine reminders" description="We send a push and SMS at these times" className="lg:col-span-2">
          <ul className="space-y-3">
            {activeMedicines.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <BellRing className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <label htmlFor={`rem-${m.id}`} className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">{m.reminderTimes.join(", ")} daily</span>
                </label>
                <Switch
                  id={`rem-${m.id}`}
                  checked={!!reminders[m.id]}
                  onCheckedChange={(v) => {
                    setReminders((r) => ({ ...r, [m.id]: v }));
                    toast.success(v ? `Reminder on for ${m.name}` : `Reminder off for ${m.name}`);
                  }}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Past medicines" className="lg:col-span-3" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {pastMedicines.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <CalendarClock className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {m.name} <span className="font-normal text-muted-foreground">{m.dose}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.from)} – {formatDate(m.to)} · {doctorsById[m.doctorId]?.name}
                  </p>
                  <p className="mt-1 text-sm">{m.stopReason}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <UploadRxDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

function UploadRxDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const place = useOrders((s) => s.place);
  const profile = useSession((s) => s.profile);
  const router = useRouter();

  async function send() {
    if (!file) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    // A prescription-only order: the pharmacist checks it and adds the medicines, so it lands in the Rx queue.
    const orderId = place({
      patientId: DEMO_PATIENT_ID,
      patientName: profile?.name || demoPatient.name,
      lines: [
        {
          productId: RX_UPLOAD_ID,
          name: "Medicines on uploaded prescription",
          image: "/images/marketplace/categories/pharmacy.png",
          category: "pharmacy",
          price: 0,
          quantity: 1,
          rx: true,
          coverage: 0,
        },
      ],
      subtotal: 0,
      deliveryFee: 0,
      insurancePays: 0,
      total: 0,
      address: "2400 Riverside Ave, Apt 5B, Lakeview 60614",
      payment: "card",
      rx: { fileName: file.name, status: "pending", patientNote: note.trim() || undefined },
    });
    setSending(false);
    toast.success("Sent to pharmacy", {
      description: `Order ${orderId}: our pharmacist will check ${file.name}, usually within 2 hours.`,
      action: { label: "View order", onClick: () => router.push("/dashboard/orders") },
    });
    setFile(null);
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Upload a prescription</DialogTitle>
        <DialogDescription>A clear photo or PDF of the full page, with the doctor&apos;s signature and date.</DialogDescription>
        <div className="mt-5 space-y-4">
          <UploadDropzone image="/images/dashboard/upload-rx.png" label="Add your prescription" file={file} onFile={setFile} />
          <div className="space-y-2">
            <Label htmlFor="rx-note">
              Note for the pharmacist <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="rx-note" className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please deliver after 5 pm" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={send} disabled={!file || sending}>
            <Send aria-hidden /> {sending ? "Sending…" : "Send to pharmacy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
