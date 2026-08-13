import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withAdmin } from "@/lib/api";
import { getSettings } from "@/lib/queries";
import { isAdmin } from "@/lib/auth";
import { externalUrl, optionalMediaUrl } from "@/lib/validators";

const str = z.string().default("");

const SettingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  tagline: str,
  logoUrl: optionalMediaUrl,
  heroTitle: str,
  heroText: str,
  promoMediaUrl: optionalMediaUrl,
  promoMediaType: z.enum(["image", "video"]).default("image"),
  enquiryMode: z.enum(["form", "whatsapp", "both"]).default("both"),
  whatsappNumber: z
    .string()
    .default("")
    .transform((v) => v.replace(/\D/g, "")),
  enquiryAlertsEnabled: z.boolean().default(true),
  enquiryAlertEmail: str,
  legalName: str,
  gst: str,
  contactEmail: str,
  contactPhone: str,
  contactAddress: str,
  mapsLink: externalUrl,
  instagramHandle: str,
  instagramUrl: externalUrl,
  facebookHandle: str,
  facebookUrl: externalUrl,
  stats: z
    .array(
      z.object({
        label: z.string().trim().default(""),
        value: z.coerce.number().int().min(0).default(0),
        suffix: z.string().default("+"),
      })
    )
    .default([]),
});

/**
 * The public site needs branding and contact details, but not the shop's
 * internal alert routing — that is admin-only configuration.
 */
export async function GET() {
  const settings = await getSettings();
  if (await isAdmin()) return ok({ settings });

  const { enquiryAlertEmail, enquiryAlertsEnabled, ...publicSettings } = settings;
  return ok({ settings: publicSettings });
}

export const PUT = withAdmin(SettingsSchema, async ({ stats, ...fields }) => {
  await prisma.$transaction([
    prisma.setting.upsert({ where: { id: 1 }, update: fields, create: { id: 1, ...fields } }),
    prisma.stat.deleteMany({ where: { settingId: 1 } }),
    prisma.stat.createMany({
      data: stats.map((s, i) => ({ ...s, position: i, settingId: 1 })),
    }),
  ]);
  return ok({ settings: await getSettings() });
});
