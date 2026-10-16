"use client";

import { buttonSecondary } from "@/components/styles";

export function PrintButton() {
  return (
    <button type="button" className={`${buttonSecondary} no-print`} onClick={() => window.print()}>
      Save as PDF
    </button>
  );
}
