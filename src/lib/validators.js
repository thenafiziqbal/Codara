import { z } from "zod";

export const githubUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (u) => /^https:\/\/github\.com\/[^/\s]+\/[^/\s?#]+/.test(u),
    "Must be a valid public GitHub repository URL."
  );

export const analyzeSchema = z.object({
  source: z.enum(["github", "snippet"]).default("github"),
  url: githubUrlSchema.optional(),
  code: z.string().max(200_000).optional(),
  provider: z.enum(["gemini", "grok"]).default("gemini"),
});

export const docsSchema = z.object({
  code: z.string().min(20).max(200_000),
  provider: z.enum(["gemini", "grok"]).default("gemini"),
});

export const aiCheckSchema = z.object({
  code: z.string().min(20).max(50_000),
  provider: z.enum(["gemini", "grok"]).default("gemini"),
});

export const certificateSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  repoUrl: githubUrlSchema.optional().or(z.literal("")),
  metrics: z.object({
    healthScore: z.number().min(0).max(100),
    complexity: z.number().min(0).max(100),
    functions: z.number().min(0),
    securityIssues: z.number().min(0),
  }),
});

export const adminSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(160).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #00b3ff").optional(),
  pricing: z
    .object({
      free: z.object({
        label: z.string(),
        priceText: z.string(),
        features: z.array(z.string()).max(20),
      }),
      premium: z.object({
        label: z.string(),
        priceText: z.string(),
        features: z.array(z.string()).max(20),
      }),
    })
    .optional(),
  features: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        description: z.string().min(1).max(280),
        icon: z.string().max(40).optional(),
      })
    )
    .max(20)
    .optional(),
  links: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      docs: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

export const subscriptionSchema = z.object({
  plan: z.enum(["free", "premium"]),
  paymentRef: z.string().max(120).optional(),
});

export function parseOrThrow(schema, value) {
  const r = schema.safeParse(value);
  if (!r.success) {
    const message = r.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return r.data;
}
