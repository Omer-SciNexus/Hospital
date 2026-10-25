import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResultFlag } from "./records-data";

/** In range / High / Low badge for a lab value. Icon + text, never color alone. */
export function FlagBadge({ flag }: { flag: ResultFlag }) {
  if (flag === "high")
    return (
      <Badge variant="red">
        <ArrowUp aria-hidden /> High
      </Badge>
    );
  if (flag === "low")
    return (
      <Badge variant="coral">
        <ArrowDown aria-hidden /> Low
      </Badge>
    );
  return (
    <Badge variant="green">
      <Check aria-hidden /> In range
    </Badge>
  );
}
