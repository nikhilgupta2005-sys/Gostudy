/**
 * Outgoing email for bulk-enquiry alerts.
 *
 *   resend  → RESEND_API_KEY   (resend.com, 3,000 emails/month free)
 *   brevo   → BREVO_API_KEY    (brevo.com, 300 emails/day free)
 *   log     → no provider configured; the message is written to the server log
 *
 * Both providers are plain HTTPS calls, so there is no SDK to install or keep
 * up to date. The driver is inferred from whichever key is present.
 */

export function resolveMailDriver() {
  if (process.env.MAIL_DRIVER) return process.env.MAIL_DRIVER;
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.BREVO_API_KEY) return "brevo";
  return "log";
}

export function mailerConfigured() {
  return resolveMailDriver() !== "log";
}

const escape = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** wa.me needs a country code; customers usually type a bare 10-digit number. */
function waNumber(phone) {
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

function buildEnquiryEmail(enquiry, settings) {
  const rows = [
    ["Product", enquiry.productName || "General enquiry"],
    ["Name", enquiry.name],
    ["Phone", enquiry.phone],
    ["Email", enquiry.email],
    ["Deliver to", enquiry.deliveryLocation],
    ["Quantity", enquiry.quantity],
    ["Price demand", enquiry.priceDemand ? `₹${enquiry.priceDemand}` : ""],
    ["Message", enquiry.message],
  ].filter(([, v]) => v);

  const wa = waNumber(enquiry.phone);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#eef2fa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e6ef">
    <div style="background:#0d2263;padding:18px 22px">
      <div style="color:#fff;font-size:18px;font-weight:bold">New bulk enquiry</div>
      <div style="color:#ffd200;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px">
        ${escape(settings.siteName || "GoStudy")}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) => `
      <tr>
        <td style="padding:11px 22px;border-bottom:1px solid #eef2fa;color:#666;font-size:12px;
                   text-transform:uppercase;letter-spacing:1px;white-space:nowrap;vertical-align:top">${escape(k)}</td>
        <td style="padding:11px 22px;border-bottom:1px solid #eef2fa;color:#000;font-size:14px;font-weight:600">${escape(v)}</td>
      </tr>`
        )
        .join("")}
    </table>
    <div style="padding:20px 22px">
      <a href="tel:${escape(enquiry.phone)}"
         style="display:inline-block;background:#e31e24;color:#fff;text-decoration:none;
                padding:11px 20px;border-radius:999px;font-size:13px;font-weight:bold">Call ${escape(enquiry.name)}</a>
      <a href="https://wa.me/${escape(wa)}"
         style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;
                padding:11px 20px;border-radius:999px;font-size:13px;font-weight:bold;margin-left:8px">WhatsApp</a>
      ${
        site
          ? `<a href="${escape(site)}/admin?tab=enquiries"
         style="display:inline-block;color:#0d2263;text-decoration:none;padding:11px 8px;
                font-size:13px;font-weight:bold;margin-left:8px">Open dashboard →</a>`
          : ""
      }
    </div>
  </div>
  <p style="max-width:560px;margin:14px auto 0;color:#666;font-size:11px;text-align:center">
    Sent automatically when someone submits the bulk purchase form.
  </p>
</div>`.trim();

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return {
    subject: `New enquiry — ${enquiry.productName || "General"} — ${enquiry.name}`,
    html,
    text,
  };
}

// ── Providers ────────────────────────────────────────────────

async function sendResend({ from, to, replyTo, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function sendBrevo({ from, to, replyTo, subject, html, text }) {
  const match = from.match(/^\s*(.*?)\s*<(.+)>\s*$/);
  const sender = match ? { name: match[1], email: match[2] } : { email: from };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Brevo: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/**
 * Best-effort alert. Never throws: an enquiry is already safely stored by the
 * time this runs, and a mail outage must not turn into a failed submission for
 * the customer. Returns a small result object for the admin "test" button.
 */
export async function sendEnquiryAlert(enquiry, settings) {
  if (settings.enquiryAlertsEnabled === false) {
    return { sent: false, reason: "Alerts are turned off in the dashboard" };
  }

  const to = (settings.enquiryAlertEmail || settings.contactEmail || "").trim();
  if (!to) return { sent: false, reason: "No alert email address is set" };

  const driver = resolveMailDriver();
  const from = process.env.MAIL_FROM || "GoStudy <onboarding@resend.dev>";
  const { subject, html, text } = buildEnquiryEmail(enquiry, settings);
  // Replying to the alert should reach the customer, when they left an address
  const replyTo = enquiry.email || undefined;

  try {
    if (driver === "log") {
      console.info(
        `[mailer] no provider configured — would email ${to}\n` +
          `  subject: ${subject}\n${text.replace(/^/gm, "  ")}`
      );
      return { sent: false, driver, to, reason: "No email provider configured (set RESEND_API_KEY or BREVO_API_KEY)" };
    }

    const payload = { from, to, replyTo, subject, html, text };
    if (driver === "resend") await sendResend(payload);
    else if (driver === "brevo") await sendBrevo(payload);
    else throw new Error(`Unknown MAIL_DRIVER "${driver}". Supported: resend, brevo, log.`);

    return { sent: true, driver, to };
  } catch (err) {
    console.error("[mailer] enquiry alert failed:", err.message);
    return { sent: false, driver, to, error: err.message };
  }
}
