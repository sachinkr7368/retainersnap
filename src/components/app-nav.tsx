"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/clients", label: "Clients" },
  { href: "/app/reports", label: "Reports" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({ currentPath }: { currentPath?: string }) {
  const livePath = usePathname();
  const pathname = currentPath ?? livePath;
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:grid md:px-3">
      {links.map((link) => {
        const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${active ? "bg-ink text-paper" : "hover:bg-card"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}