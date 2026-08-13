import { ok, withAdmin } from "@/lib/api";
import { getSettings } from "@/lib/queries";
import { sendEnquiryAlert, resolveMailDriver } from "@/lib/mailer";

/**
 * Fires a sample alert so the shop can confirm email delivery from the dashboard
 * without waiting for a real customer. Nothing is written to the database.
 */
export const POST = withAdmin(null, async () => {
  const settings = await getSettings();

  const sample = {
    id: 0,
    productName: "Green & White Board (test)",
    name: "Test Enquiry",
    phone: "9876543210",
    email: "",
    deliveryLocation: "Kaithal, Haryana",
    quantity: "50 pcs",
    priceDemand: "350",
    message: "This is a test alert sent from the GoStudy dashboard.",
  };

  const result = await sendEnquiryAlert(sample, settings);

  return ok({
    ...result,
    driver: result.driver ?? resolveMailDriver(),
    to: result.to ?? settings.enquiryAlertEmail ?? settings.contactEmail,
  });
});
