import { z } from "zod";

export const platformSchema = z.enum(["framer", "webflow", "nextjs"]);
export const paidPlanSchema = z.enum(["solo", "studio"]);
export const intervalSchema = z.enum(["month", "year"]);

export const checkoutSchema = z.object({
  plan: paidPlanSchema,
  interval: intervalSchema,
});

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(200);
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = loginSchema.extend({
  studio_name: z.string().trim().min(2, "Studio name is required.").max(80),
});

export const emailFormSchema = z.object({
  email: emailSchema,
});

export const passwordFormSchema = z.object({
  password: passwordSchema,
});

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required.").max(120),
  contact_email: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email or leave it blank."),
});

export const siteSchema = z.object({
  client_id: z.string().uuid("Pick a client."),
  url: z.string().trim().min(4, "Enter a public site URL.").max(2000),
  platform: platformSchema,
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Studio name is required.").max(80, "Studio name must be 1–80 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use 3–40 lowercase letters, numbers, and hyphens.")
    .max(40, "Use 3–40 lowercase letters, numbers, and hyphens."),
  brand_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #1f6b45."),
  report_footer: z.string().trim().max(280, "Footer must be 280 characters or fewer."),
});

export const summarySchema = z.object({
  summary: z.string().trim().max(2000, "Keep the summary under 2000 characters."),
});

export const reportItemSchema = z.object({
  kind: z.enum(["work_done", "recommendation"]),
  title: z.string().trim().min(1, "Title is required.").max(140),
  body: z.string().trim().max(2000),
  price: z.string().trim().max(20),
});

export const healthUrlSchema = z.object({
  url: z.string().trim().min(4, "Enter a site URL.").max(2000),
});

export function zodMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
