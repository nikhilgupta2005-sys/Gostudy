import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, withAdmin, withPublic } from "@/lib/api";
import { getEnquiries, getSettings } from "@/lib/queries";
import { sendEnquiryAlert } from "@/lib/mailer";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) return fail("Please sign in again", 401);
  return ok({ enquiries: await getEnquiries() });
}

const EnquirySchema = z.object({
  productId: z.number().int().nullable().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  email: z.string().trim().max(160).default(""),
  deliveryLocation: z.string().trim().max(200).default(""),
  priceDemand: z.string().trim().max(60).default(""),
  quantity: z.string().trim().max(60).default(""),
  message: z.string().trim().max(2000).default(""),
});

/** This endpoint is unauthenticated and sends email, so it has to be throttled. */
const MAX_PER_IP_PER_HOUR = 8;
const MAX_PER_PHONE_PER_HOUR = 4;

export const POST = withPublic(EnquirySchema, async (data, { req }) => {
  // x-forwarded-for is set by the platform's proxy; the first hop is the client
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const [fromIp, fromPhone] = await Promise.all([
    ip === "unknown"
      ? 0
      : prisma.enquiry.count({ where: { ip, createdAt: { gte: since } } }),
    prisma.enquiry.count({ where: { phone: data.phone, createdAt: { gte: since } } }),
  ]);

  if (fromIp >= MAX_PER_IP_PER_HOUR || fromPhone >= MAX_PER_PHONE_PER_HOUR) {
    return fail(
      "We already have your enquiry — our team will call you shortly. " +
        "Please try again later if you need to send another.",
      429
    );
  }

  const product = data.productId
    ? await prisma.product.findUnique({ where: { id: data.productId } })
    : null;

  const enquiry = await prisma.enquiry.create({
    data: {
      ...data,
      ip,
      productId: product?.id ?? null,
      productName: product?.name ?? "",
    },
  });

  // The enquiry is already stored, so the alert is best effort — sendEnquiryAlert
  // swallows its own errors and a mail outage must never fail the customer's form.
  // Awaited rather than fired-and-forgotten: serverless kills pending work once
  // the response is sent.
  const alert = await sendEnquiryAlert(enquiry, await getSettings());

  return ok({ ...enquiry, alert: { sent: alert.sent } });
});

export const PUT = withAdmin(
  z.object({
    id: z.number().int(),
    status: z.enum(["new", "contacted", "closed"]).optional(),
    adminNote: z.string().max(2000).optional(),
  }),
  async ({ id, ...patch }) => ok(await prisma.enquiry.update({ where: { id }, data: patch }))
);

export const DELETE = withAdmin(z.object({ id: z.number().int() }), async ({ id }) => {
  await prisma.enquiry.delete({ where: { id } });
  return ok();
});
