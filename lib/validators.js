import { z } from "zod";

/**
 * Anything the admin types that later becomes an href or src has to be checked.
 * A `javascript:` or `data:` URL saved here would render as stored XSS on the
 * public site — so a compromised admin account must not be able to plant one.
 */
const SAFE_SCHEME = /^https?:\/\//i;

/** An outbound link: empty, or an explicit http(s) URL. */
export const externalUrl = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || SAFE_SCHEME.test(v), {
    message: "Link must start with http:// or https://",
  });

/** An image or video: an uploaded path (/uploads/…) or an http(s) URL. */
export const mediaUrl = z
  .string()
  .trim()
  .refine((v) => SAFE_SCHEME.test(v) || /^\/[^/]/.test(v), {
    message: "Must be an uploaded file or an http(s) URL",
  });

/** Same as mediaUrl but allowed to be blank (no logo / no promo media). */
export const optionalMediaUrl = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || SAFE_SCHEME.test(v) || /^\/[^/]/.test(v), {
    message: "Must be an uploaded file or an http(s) URL",
  });
