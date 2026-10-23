"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, LogIn, UserRound } from "lucide-react";
import { toast } from "sonner";
import { insurersById } from "@/data/insurers";
import { DEMO_PATIENT_ID, demoPatient } from "@/data/patients";
import { makeRef } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useInsurance } from "@/store/insurance";
import { useOrders, type OrderLine } from "@/store/orders";
import { useSession } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { isPhysical, productOf, rentWeeks } from "../shop-utils";
import { ContactStep, InsuranceStep, PaymentStep, ReviewStep, RxStep, type ContactData, type InsuranceChoice, type PaymentData, type RxData } from "./steps";
import { OrderSummary, StepIndicator } from "./summary";
import { computeTotals, isLab, isVideo } from "./totals";

/** Multi-step checkout: contact → insurance → prescription (if needed) → payment → review. */
export function Checkout() {
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const items = useCart((s) => s.items);
  const [placingId, setPlacingId] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[520px] rounded-3xl" />
        <Skeleton className="hidden h-80 rounded-3xl lg:block" />
      </div>
    );
  }
  if (placingId) {
    return (
      <div role="status" className="flex flex-col items-center py-24 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 font-semibold">Opening your order {placingId}…</p>
      </div>
    );
  }
  if (!role) return <SignInGate />;
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border">
        <EmptyState
          image="/images/dashboard/empty-orders.png"
          title="Your cart is empty"
          description="Add lab tests, medicines or devices, then come back to check out."
          action={
            <Button asChild>
              <Link href="/marketplace#catalog">
                Browse the marketplace <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }
  return <CheckoutFlow onPlaced={setPlacingId} />;
}

function SignInGate() {
  const signIn = useSession((s) => s.signIn);
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-8 text-center shadow-soft sm:p-10">
      <Image src="/images/auth/signin.png" alt="" width={200} height={200} className="mx-auto size-40 rounded-3xl object-cover" />
      <h2 className="mt-5 text-2xl font-extrabold">Sign in to check out</h2>
      <p className="mt-2 text-muted-foreground">
        We link your order to your patient record, so your insurance, prescriptions and lab results all land in one place.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/sign-in?next=/marketplace/checkout">
            <LogIn aria-hidden /> Sign in
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            signIn("patient");
            toast.success(`Welcome, ${demoPatient.name.split(" ")[0]}`, { description: "You are signed in as the demo patient." });
          }}
        >
          <UserRound aria-hidden /> Continue as demo patient
        </Button>
      </div>
    </div>
  );
}

function CheckoutFlow({ onPlaced }: { onPlaced: (id: string) => void }) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const profile = useSession((s) => s.profile);
  const allCards = useInsurance((s) => s.cards);
  const createClaim = useInsurance((s) => s.createClaim);
  const submitClaim = useInsurance((s) => s.submitClaim);
  const place = useOrders((s) => s.place);
  const attachClaim = useOrders((s) => s.attachClaim);

  const cards = useMemo(
    () => allCards.filter((c) => c.patientId === DEMO_PATIENT_ID).sort((a, b) => Number(b.primary) - Number(a.primary)),
    [allCards],
  );
  const patientName = profile?.name || demoPatient.name;

  const needsHome = items.some(isLab);
  const needsVideo = items.some(isVideo);
  const hasGoods = items.some(isPhysical);
  const rxItems = items.filter((i) => i.rx).map((i) => i.name);

  const steps = useMemo(
    () => [
      { id: "contact", label: hasGoods ? "Delivery" : "Contact" },
      { id: "insurance", label: "Insurance" },
      ...(rxItems.length ? [{ id: "rx", label: "Prescription" }] : []),
      { id: "payment", label: "Payment" },
      { id: "review", label: "Review" },
    ],
    [hasGoods, rxItems.length],
  );

  const [stepId, setStepId] = useState("contact");
  const [contact, setContact] = useState<ContactData>({
    name: patientName,
    email: profile?.email || "maya.robinson@example.com",
    phone: demoPatient.phone,
    address: "2400 Riverside Ave, Apt 5B",
    city: "Lakeview",
    zip: "60614",
  });
  const defaultCard = cards.find((c) => c.primary && c.status !== "rejected") ?? cards.find((c) => c.status !== "rejected");
  const [choice, setChoice] = useState<InsuranceChoice>(defaultCard ? { mode: "card", cardId: defaultCard.id } : { mode: "new" });
  const [rx, setRx] = useState<RxData>({ mode: "upload" });
  const [payment, setPayment] = useState<PaymentData>();
  const [placing, setPlacing] = useState(false);

  const card = choice.mode === "card" ? cards.find((c) => c.id === choice.cardId) : undefined;
  const insurer = card && card.status !== "rejected" ? insurersById[card.insurerId] : null;
  const totals = useMemo(() => computeTotals(items, insurer), [items, insurer]);

  /** A saved payment choice is stale when the insurance change flips "nothing to pay". */
  const validPayment = payment && (payment.method === "insurance-only") === (totals.total <= 0) ? payment : undefined;

  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const go = (i: number) => {
    setStepId(steps[Math.max(0, Math.min(steps.length - 1, i))].id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => go(index + 1);
  const back = () => go(index - 1);

  async function placeOrder() {
    if (!validPayment) return;
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));

    const lines: OrderLine[] = totals.lines.map((l) => {
      const weeks = rentWeeks(l);
      return {
        productId: l.productId ?? productOf(l)?.id ?? l.id,
        name: weeks ? `${l.name} (rent, ${weeks} ${weeks === 1 ? "week" : "weeks"})` : l.name,
        image: l.image,
        category: l.category ?? "",
        price: l.price,
        quantity: l.quantity,
        mode: l.mode,
        rx: l.rx,
        coverage: l.share,
      };
    });
    const slot = [contact.homeSlot && `Home collection: ${contact.homeSlot}`, contact.videoSlot && `Video visit: ${contact.videoSlot}`].filter(Boolean).join(" · ");

    const orderId = place({
      patientId: DEMO_PATIENT_ID,
      patientName,
      lines,
      subtotal: totals.subtotal,
      deliveryFee: totals.fee,
      insurancePays: totals.insurancePays,
      total: totals.total,
      insurerId: insurer?.id,
      address: `${contact.address}, ${contact.city} ${contact.zip}`,
      slot: slot || undefined,
      payment: validPayment.method,
      rx: rxItems.length
        ? { fileName: rx.mode === "doctor" ? "E-prescription from hospital doctor" : (rx.fileName ?? "prescription"), status: "pending" }
        : undefined,
      lab: needsHome ? { status: "scheduled", sampleId: makeRef("LAB") } : undefined,
    });

    if (insurer && totals.insurancePays > 0) {
      const claimId = createClaim({
        patientId: DEMO_PATIENT_ID,
        insurerId: insurer.id,
        title: lines.length === 1 ? lines[0].name : `Marketplace order ${orderId} (${lines.length} items)`,
        source: "order",
        refId: orderId,
        amount: totals.subtotal,
        insurerPays: totals.insurancePays,
      });
      submitClaim(claimId);
      attachClaim(orderId, claimId);
    }

    onPlaced(orderId);
    clear();
    toast.success("Order placed", { description: `Order ${orderId} is on its way to our team.` });
    router.push(`/marketplace/checkout/success?order=${orderId}`);
  }

  const step = steps[index].id;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
      <div className="min-w-0 space-y-6">
        <StepIndicator steps={steps} current={index} onGo={go} />
        <div className="lg:hidden">
          <OrderSummary totals={totals} insurer={insurer} estimate={card?.status === "pending"} />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
            {step === "contact" && (
              <ContactStep
                defaults={contact}
                needsHome={needsHome}
                needsVideo={needsVideo}
                hasGoods={hasGoods}
                onNext={(d) => {
                  setContact(d);
                  next();
                }}
              />
            )}
            {step === "insurance" && (
              <InsuranceStep cards={cards} choice={choice} setChoice={setChoice} totals={totals} insurer={insurer} holder={patientName} onBack={back} onNext={next} />
            )}
            {step === "rx" && <RxStep items={rxItems} value={rx} onChange={setRx} onBack={back} onNext={next} />}
            {(step === "payment" || (step === "review" && !validPayment)) && (
              <PaymentStep
                total={totals.total}
                holder={contact.name}
                value={payment}
                onBack={back}
                onNext={(p) => {
                  setPayment(p);
                  next();
                }}
              />
            )}
            {step === "review" && validPayment && (
              <ReviewStep
                contact={contact}
                insurer={insurer}
                cardStatus={card?.status}
                rx={rxItems.length ? rx : undefined}
                payment={validPayment}
                totals={totals}
                placing={placing}
                onEdit={(id) => go(steps.findIndex((s) => s.id === id))}
                onBack={back}
                onPlace={placeOrder}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hidden lg:sticky lg:top-24 lg:block">
        <OrderSummary totals={totals} insurer={insurer} estimate={card?.status === "pending"} />
      </div>
    </div>
  );
}
