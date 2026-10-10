import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  color = "#0ea5a4",
  size = 40,
  className,
}: {
  name: string;
  src?: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, background: src ? undefined : `${color}22`, color }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover object-top" />
      ) : (
        <span className="font-display font-bold" style={{ fontSize: size * 0.38 }}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
