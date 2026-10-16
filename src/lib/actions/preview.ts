"use server";

import { succeed } from "@/lib/action-state";
import type { ActionState } from "@/lib/types";

export async function previewAction(): Promise<ActionState> {
  return succeed("Preview only. Nothing was saved.");
}
