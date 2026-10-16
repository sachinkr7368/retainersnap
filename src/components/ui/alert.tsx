import { cn } from "@/lib/utils";

export function Alert({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p role={tone === "success" ? "status" : "alert"} className={cn(tone === "success" ? "text-sm text-moss" : "text-sm text-clay", className)}>
      {children}
    </p>
  );
}
