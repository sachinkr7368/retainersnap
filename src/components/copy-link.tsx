"use client";

import { useState } from "react";
import { buttonSecondary } from "@/components/styles";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonSecondary}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
