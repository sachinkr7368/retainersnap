"use client";

import { PasswordField, SelectField, TextAreaField, TextField } from "@/components/form-fields";
import { SchemaForm } from "@/components/schema-form";
import { buttonClass } from "@/components/styles";
import { addClient } from "@/lib/actions/clients";
import { login, sendMagicLink, sendPasswordReset, signup, updatePassword } from "@/lib/actions/auth";
import { previewAction } from "@/lib/actions/preview";
import { addReportItem, saveSummary } from "@/lib/actions/reports";
import { createInvite, saveBrand } from "@/lib/actions/settings";
import { addSite } from "@/lib/actions/sites";
import type { ActionState } from "@/lib/types";
import { brandSchema, clientSchema, emailFormSchema, loginSchema, passwordFormSchema, reportItemSchema, signupSchema, siteSchema, summarySchema } from "@/lib/validators";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function LoginPasswordForm({ next }: { next: string }) {
  return (
    <SchemaForm
      schema={loginSchema}
      action={login}
      defaultValues={{ email: "", password: "" }}
      hidden={{ next }}
      submit="Sign in"
      pendingLabel="Signing in…"
      submitClassName={`${buttonClass} w-full`}
    >
      {(form) => (
        <>
          <TextField form={form} name="email" label="Email" type="email" autoComplete="email" />
          <PasswordField form={form} name="password" label="Password" autoComplete="current-password" />
        </>
      )}
    </SchemaForm>
  );
}

export function MagicLinkForm({ next }: { next: string }) {
  return (
    <SchemaForm
      schema={emailFormSchema}
      action={sendMagicLink}
      defaultValues={{ email: "" }}
      hidden={{ next }}
      submit="Send link"
      pendingLabel="Sending…"
      submitClassName={`${buttonClass} w-full`}
    >
      {(form) => <TextField form={form} name="email" id="magic-email" label="Email" type="email" autoComplete="email" />}
    </SchemaForm>
  );
}

export function SignupForm({ next }: { next: string }) {
  return (
    <SchemaForm
      schema={signupSchema}
      action={signup}
      defaultValues={{ studio_name: "", email: "", password: "" }}
      hidden={{ next }}
      submit="Create account"
      pendingLabel="Creating…"
      submitClassName={`${buttonClass} w-full`}
    >
      {(form) => (
        <>
          <TextField form={form} name="studio_name" label="Studio name" autoComplete="organization" placeholder="North Studio" />
          <TextField form={form} name="email" label="Email" type="email" autoComplete="email" />
          <PasswordField form={form} name="password" label="Password" autoComplete="new-password" showRules />
        </>
      )}
    </SchemaForm>
  );
}

export function ResetPasswordForm() {
  return (
    <SchemaForm
      schema={emailFormSchema}
      action={sendPasswordReset}
      defaultValues={{ email: "" }}
      submit="Send reset link"
      pendingLabel="Sending…"
      submitClassName={`${buttonClass} w-full`}
    >
      {(form) => <TextField form={form} name="email" label="Email" type="email" autoComplete="email" />}
    </SchemaForm>
  );
}

export function ClientForm({
  defaults,
  clientId,
  submit = "Save client",
  pendingLabel = "Saving…",
  action = addClient,
}: {
  defaults: { name: string; contact_email: string };
  clientId?: string;
  submit?: string;
  pendingLabel?: string;
  action?: FormAction;
}) {
  return (
    <SchemaForm
      schema={clientSchema}
      action={action}
      defaultValues={defaults}
      hidden={clientId ? { client_id: clientId } : undefined}
      submit={submit}
      pendingLabel={pendingLabel}
    >
      {(form) => (
        <>
          <TextField form={form} name="name" label="Name" placeholder="Harbor Goods" />
          <TextField form={form} name="contact_email" label="Contact email" type="email" placeholder="optional" />
        </>
      )}
    </SchemaForm>
  );
}

export function SiteForm({
  clients,
  defaults,
  action = addSite,
}: {
  clients: { id: string; name: string }[];
  defaults: { client_id: string; url: string; platform: "framer" | "webflow" | "nextjs" };
  action?: FormAction;
}) {
  return (
    <SchemaForm schema={siteSchema} action={action} defaultValues={defaults} submit="Add site" pendingLabel="Saving…">
      {(form) => (
        <>
          <SelectField
            form={form}
            name="client_id"
            label="Client"
            placeholder="Choose a client"
            options={clients.map((client) => ({ value: client.id, label: client.name }))}
          />
          <TextField form={form} name="url" label="Public URL" placeholder="https://client.framer.app" />
          <SelectField
            form={form}
            name="platform"
            label="Platform"
            options={[
              { value: "framer", label: "Framer" },
              { value: "webflow", label: "Webflow" },
              { value: "nextjs", label: "Next.js" },
            ]}
          />
        </>
      )}
    </SchemaForm>
  );
}

export function BrandForm({
  defaults,
  action = saveBrand,
}: {
  defaults: { name: string; slug: string; brand_color: string; report_footer: string };
  action?: FormAction;
}) {
  return (
    <SchemaForm schema={brandSchema} action={action} defaultValues={defaults} submit="Save brand">
      {(form) => (
        <>
          <TextField form={form} name="name" label="Studio name" />
          <TextField form={form} name="slug" label="Report slug" />
          <TextField form={form} name="brand_color" label="Colour" />
          <TextAreaField form={form} name="report_footer" label="Footer, used when the watermark is off" rows={3} />
        </>
      )}
    </SchemaForm>
  );
}

export function PasswordForm() {
  return (
    <SchemaForm schema={passwordFormSchema} action={updatePassword} defaultValues={{ password: "" }} submit="Update password">
      {(form) => <PasswordField form={form} name="password" label="New password" autoComplete="new-password" showRules />}
    </SchemaForm>
  );
}

export function InviteForm({ action = createInvite }: { action?: FormAction }) {
  return (
    <SchemaForm schema={emailFormSchema} action={action} defaultValues={{ email: "" }} submit="Send invite" pendingLabel="Sending…">
      {(form) => <TextField form={form} name="email" label="Email" type="email" />}
    </SchemaForm>
  );
}

export function SummaryForm({ reportId, summary }: { reportId: string; summary: string }) {
  return (
    <SchemaForm schema={summarySchema} action={saveSummary} defaultValues={{ summary }} hidden={{ report_id: reportId }} submit="Save summary">
      {(form) => <TextAreaField form={form} name="summary" label="Summary" rows={6} />}
    </SchemaForm>
  );
}

export function ReportItemForm({ reportId }: { reportId: string }) {
  return (
    <SchemaForm
      schema={reportItemSchema}
      action={addReportItem}
      defaultValues={{ kind: "work_done", title: "", body: "", price: "" }}
      hidden={{ report_id: reportId }}
      submit="Add item"
      pendingLabel="Adding…"
    >
      {(form) => (
        <>
          <SelectField
            form={form}
            name="kind"
            label="Kind"
            options={[
              { value: "work_done", label: "Work done" },
              { value: "recommendation", label: "Recommended next" },
            ]}
          />
          <TextField form={form} name="title" label="Title" />
          <TextAreaField form={form} name="body" label="Detail" rows={3} />
          <TextField form={form} name="price" label="Price in USD" placeholder="350" />
        </>
      )}
    </SchemaForm>
  );
}
