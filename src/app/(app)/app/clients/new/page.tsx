import type { Metadata } from "next";
import Link from "next/link";
import { ClientForm } from "@/components/forms";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="max-w-lg">
      <Link href="/app/clients" className="text-sm text-muted underline">
        Clients
      </Link>
      <h1 className="mt-3 font-serif text-4xl">New client</h1>
      <div className="mt-6">
        <ClientForm defaults={{ name: "", contact_email: "" }} />
      </div>
    </div>
  );
}
