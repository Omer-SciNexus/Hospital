"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Send } from "lucide-react";
import type { Patient } from "@/data/patients";
import { labTests } from "@/data/services";
import { useOrders } from "@/store/orders";
import { makeRef } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label, NativeSelect, Textarea } from "@/components/ui/form-controls";

const clinicalTests = [
  { id: "troponin", name: "Troponin I", price: 30 },
  { id: "bnp", name: "BNP (heart failure marker)", price: 45 },
  { id: "renal", name: "Kidney function and electrolytes", price: 24 },
  { id: "inr", name: "INR (clotting)", price: 15 },
  { id: "ecg", name: "12-lead ECG", price: 40 },
  { id: "echo", name: "Echocardiogram", price: 180 },
  ...labTests.map((t) => ({ id: t.id, name: t.name, price: t.price, image: t.image })),
];

/** Orders a test for a patient. It lands in the shared orders store, so the lab queue sees it. */
export function OrderTestDialog({ patient, trigger }: { patient: Patient; trigger?: React.ReactNode }) {
  const place = useOrders((s) => s.place);
  const [open, setOpen] = useState(false);
  const [testId, setTestId] = useState(clinicalTests[0].id);
  const [priority, setPriority] = useState<"routine" | "urgent">("routine");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const test = clinicalTests.find((t) => t.id === testId)!;
    const coverage = patient.insurerId ? 80 : 0;
    const insurancePays = Math.round(test.price * coverage) / 100;
    place({
      patientId: patient.id,
      patientName: patient.name,
      lines: [
        {
          productId: `test-${test.id}`,
          name: test.name,
          image: ("image" in test && test.image) || "/images/marketplace/categories/lab-tests.png",
          category: "lab-tests",
          price: test.price,
          quantity: 1,
          coverage,
        },
      ],
      subtotal: test.price,
      deliveryFee: 0,
      insurancePays,
      total: test.price - insurancePays,
      insurerId: patient.insurerId,
      address: patient.ward ? `${patient.ward}, bed ${patient.bed}` : "Heart Center clinic",
      slot: `${priority === "urgent" ? "Urgent" : "Routine"}${patient.ward ? `, ${patient.ward} bed ${patient.bed}` : ", clinic"}${note ? ` · ${note}` : ""}`,
      payment: "insurance-only",
      lab: { status: "scheduled", sampleId: makeRef("LAB") },
    });
    toast.success(`${test.name} ordered`, { description: `${priority === "urgent" ? "Urgent" : "Routine"} for ${patient.name}. The lab has it in their queue.` });
    setOpen(false);
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <FlaskConical aria-hidden /> Order a test
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="sm">
        <form onSubmit={submit}>
          <DialogTitle>Order a test</DialogTitle>
          <DialogDescription>
            For {patient.name} ({patient.mrn})
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="order-test">Test</Label>
              <NativeSelect id="order-test" value={testId} onChange={(e) => setTestId(e.target.value)}>
                {clinicalTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold">Priority</legend>
              <div className="flex gap-2">
                {(["routine", "urgent"] as const).map((p) => (
                  <label
                    key={p}
                    className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium capitalize has-[:checked]:border-primary has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-950"
                  >
                    <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} className="accent-[var(--primary)]" />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="order-note">
                Note for the lab <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="order-note" className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={160} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Send aria-hidden /> Send order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
