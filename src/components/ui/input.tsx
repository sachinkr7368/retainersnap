import { inputClass } from "@/components/styles";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(inputClass, "h-11", className)} {...props} />;
}
