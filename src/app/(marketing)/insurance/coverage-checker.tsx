"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { insurers, insurersById } from "@/data/insurers";
import { formatPrice } from "@/lib/utils";
import { Label, NativeSelect } from "@/components/ui/form-controls";

const services = [
  { id: "visit", name: "Specialist visit", price: 120, factor: 1 },
  { id: "video", name: "Video visit", price: 80, factor: 1 },
  { id: "package", name: "Full body check-up", price: 199, factor: 0.9 },
  { id: "mri", name: "MRI scan", price: 650, factor: 0.85 },
  { id: "device", name: "Blood pressure monitor", price: 59, factor: 0.5 },
];

export function CoverageChecker() {
  const [insurer, setInsurer] = useState(insurers[0].id);
  const [service, setService] = useState(services[0].id);

  const plan = insurersById[insurer];
  const svc = services.find((s) => s.id === service)!;
  const share = Math.round(plan.coverage * svc.factor * (plan.network === "partial" ? 0.85 : 1));
  const youPay = Math.round(svc.price * (1 - share / 100));
  const full = plan.network === "in-network";

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-lift sm:p-8">
      <h3 className="text-xl font-bold">Estimate your cost</h3>
      <p className="mt-1 text-sm text-muted-foreground">A quick guide. Your exact share shows after billing checks your card.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cc-insurer">Insurance</Label>
          <NativeSelect id="cc-insurer" value={insurer} onChange={(e) => setInsurer(e.target.value)}>
            {insurers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-service">Service</Label>
          <NativeSelect id="cc-service" value={service} onChange={(e) => setService(e.target.value)}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </NativeSelect>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl bg-muted/60 p-5 sm:grid-cols-3" aria-live="polite">
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="font-display text-xl font-bold">{formatPrice(svc.price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Insurance pays</p>
          <p className="font-display text-xl font-bold text-green-700 dark:text-green-400">{share}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">You pay about</p>
          <p className="font-display text-2xl font-extrabold">{formatPrice(youPay)}</p>
        </div>
      </div>
      <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${full ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
        {full ? <ShieldCheck className="size-4" aria-hidden /> : <ShieldAlert className="size-4" aria-hidden />}
        {full ? `${plan.name} is fully in network.` : `${plan.name} is partly in network; some doctors may be out of network.`}
      </p>
    </div>
  );
}
