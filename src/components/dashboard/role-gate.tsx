"use client";

import Image from "next/image";
import Link from "next/link";
import { roles, type Role } from "@/config/navigation";
import { useSession } from "@/store/session";
import { Button } from "@/components/ui/button";

/**
 * Shows children only to the listed roles. Other roles see a friendly note with
 * a one-click switch to a role that can open the screen (it is a demo).
 * The dashboard shell already guarantees a signed-in role.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const role = useSession((s) => s.role);
  const signIn = useSession((s) => s.signIn);
  if (role && allow.includes(role)) return <>{children}</>;

  const names = allow.map((r) => roles.find((x) => x.id === r)?.label ?? r);
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-sm">
        <Image src="/images/dashboard/empty-search.png" alt="" width={200} height={200} className="mx-auto size-40" />
        <h1 className="mt-4 text-2xl font-extrabold">Not part of your dashboard</h1>
        <p className="mt-2 text-muted-foreground">This screen is for {names.join(" or ")} accounts.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => signIn(allow[0])}>Switch to {names[0]}</Button>
          <Button asChild variant="soft">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
