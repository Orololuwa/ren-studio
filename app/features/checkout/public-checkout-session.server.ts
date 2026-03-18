import { createCookie } from "react-router";
import { createTypedCookie } from "remix-utils/typed-cookie";
import { z } from "zod";

const cookie = createCookie("checkout-access", {
  httpOnly: true,
  path: "/checkout",
  sameSite: "lax",
  secrets: [process.env.COOKIE_SECRET ?? "secret"],
});

const schema = z
  .object({
    checkoutPageSlug: z.string(),
    expiresAt: z.string(),
  })
  .nullable()
  .catch(null);

const typedCookie = createTypedCookie({ cookie, schema });

export async function getCheckoutAccessSession(request: Request) {
  return await typedCookie.parse(request.headers.get("Cookie"));
}

export async function setCheckoutAccessSession({
  checkoutPageSlug,
  ttlMs = 60 * 60 * 1000,
}: {
  checkoutPageSlug: string;
  ttlMs?: number;
}) {
  return await typedCookie.serialize({
    checkoutPageSlug,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  });
}

export async function clearCheckoutAccessSession() {
  return await typedCookie.serialize(null);
}

export function getIsCheckoutAccessValid({
  checkoutPageSlug,
  session,
}: {
  checkoutPageSlug: string;
  session: Awaited<ReturnType<typeof getCheckoutAccessSession>>;
}) {
  if (!session) return false;
  if (session.checkoutPageSlug !== checkoutPageSlug) return false;
  const expiresAtMs = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiresAtMs)) return false;
  return expiresAtMs > Date.now();
}
