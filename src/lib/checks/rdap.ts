import { registrableDomain } from "@/lib/urls";

export type DomainResult = {
  ok: boolean;
  expiresAt: string | null;
  registrar: string | null;
  domain: string;
  error?: string;
};

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = { roles?: string[]; vcardArray?: unknown[] };

function registrarName(entities: RdapEntity[]): string | null {
  for (const entity of entities) {
    if (!(entity.roles ?? []).includes("registrar")) continue;
    const vcard = entity.vcardArray?.[1];
    if (!Array.isArray(vcard)) continue;
    for (const item of vcard) {
      if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") return item[3];
    }
  }
  return null;
}

export async function runRdap(hostname: string): Promise<DomainResult> {
  const domain = registrableDomain(hostname);
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { accept: "application/rdap+json, application/json", "user-agent": "RetainerSnapBot/1.0" },
    });
    if (response.status === 404) {
      return { ok: false, expiresAt: null, registrar: null, domain, error: "No RDAP record for this domain." };
    }
    if (!response.ok) {
      throw new Error(`RDAP returned ${response.status}`);
    }
    const json = (await response.json()) as { events?: RdapEvent[]; entities?: RdapEntity[] };
    const expiration = (json.events ?? []).find((event) => event.eventAction === "expiration");
    const expiresAt = expiration?.eventDate ?? null;
    const date = expiresAt ? new Date(expiresAt) : null;
    const validDate = date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
    return {
      ok: Boolean(validDate && date && date.getTime() > Date.now()),
      expiresAt: validDate,
      registrar: registrarName(json.entities ?? []),
      domain,
      error: validDate ? undefined : "The domain registry did not list an expiration date.",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Domain lookup failed");
  }
}
