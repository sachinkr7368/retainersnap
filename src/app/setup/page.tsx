import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupRequired } from "@/components/setup-required";
import { missingCoreEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Setup" };

export default function SetupPage() {
  const missing = missingCoreEnv();
  if (missing.length === 0) redirect("/app");
  return <SetupRequired missing={missing} />;
}
