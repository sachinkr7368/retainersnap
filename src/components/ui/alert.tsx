import { cn } from "@/lib/utils";
import { userMessage } from "@/lib/user-message";

export function Alert({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const content = tone === "danger" && typeof children === "string" ? userMessage(children, "Something went wrong. Try again.") : children;
  return (
    <p role={tone === "success" ? "status" : "alert"} className={cn(tone === "success" ? "text-sm text-moss" : "text-sm text-clay", className)}>
      {content}
    </p>
  );
}
