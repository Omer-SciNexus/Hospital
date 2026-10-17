"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { departments } from "@/config/departments";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/form-controls";

const topics = ["Appointments", "Billing & insurance", "Marketplace order", "Medical records", "Feedback", "Other"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.email("Please enter a valid email"),
  phone: z.string().trim().optional(),
  topic: z.enum(topics, { message: "Choose a topic" }),
  department: z.string().optional(),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(1000, "Please keep it under 1,000 characters"),
  consent: z.literal(true, { message: "Please agree so we can reply" }),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 900));
    setSent(true);
    reset();
  }

  if (sent) {
    return (
      <div role="status" className="mt-8 flex flex-col items-center rounded-3xl bg-brand-50 p-10 text-center dark:bg-brand-950">
        <Image src="/images/dashboard/success-order.png" alt="" width={140} height={140} className="size-32" />
        <h3 className="mt-2 text-xl font-bold">Message sent</h3>
        <p className="mt-1 text-sm text-muted-foreground">Thanks for reaching out. We&apos;ll reply within one working day.</p>
        <Button variant="soft" className="mt-5" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Full name</Label>
        <Input id="contact-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "contact-name-error" : undefined} {...register("name")} />
        <FieldError id="contact-name-error" message={errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "contact-email-error" : undefined} {...register("email")} />
        <FieldError id="contact-email-error" message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="contact-phone" type="tel" autoComplete="tel" {...register("phone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-topic">Topic</Label>
        <NativeSelect id="contact-topic" defaultValue="" aria-invalid={!!errors.topic} aria-describedby={errors.topic ? "contact-topic-error" : undefined} {...register("topic")}>
          <option value="" disabled>Choose a topic</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </NativeSelect>
        <FieldError id="contact-topic-error" message={errors.topic?.message} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="contact-department">
          Department <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <NativeSelect id="contact-department" defaultValue="" {...register("department")}>
          <option value="">Not sure / general</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>{d.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" aria-invalid={!!errors.message} aria-describedby={errors.message ? "contact-message-error" : undefined} {...register("message")} />
        <FieldError id="contact-message-error" message={errors.message?.message} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...register("consent")} />
          <span className="text-muted-foreground">I agree that the hospital may use these details to reply to my message.</span>
        </label>
        <FieldError message={errors.consent?.message} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {isSubmitting ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
