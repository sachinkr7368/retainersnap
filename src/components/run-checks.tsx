"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { buttonMoss } from "@/components/styles";
import { readApi } from "@/lib/api-client";

async function runSiteChecks(siteId: string) {
  const response = await fetch(`/api/sites/${siteId}/run`, { method: "POST" });
  const result = await readApi<{ processed: number }>(response);
  if (!result.ok) throw new Error(result.message);
  return result.data.processed;
}

export function RunChecksButton({ siteId }: { siteId: string }) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: runSiteChecks,
    onSettled() {
      router.refresh();
    },
  });
  const message = mutation.isSuccess
    ? `Finished ${mutation.data} queued checks.`
    : mutation.error instanceof Error
      ? mutation.error.message
      : "";

  return (
    <>
      <button type="button" onClick={() => mutation.mutate(siteId)} disabled={mutation.isPending} className={buttonMoss}>
        {mutation.isPending ? "Checking…" : "Run checks now"}
      </button>
      {message ? <p className="w-full text-sm text-muted">{message}</p> : null}
    </>
  );
}
