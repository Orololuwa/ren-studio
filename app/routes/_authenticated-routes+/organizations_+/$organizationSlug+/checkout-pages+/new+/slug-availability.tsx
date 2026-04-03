import { data } from "react-router";

import type { Route } from "./+types/slug-availability";
import { isCheckoutSlugTakenInDatabase } from "~/features/checkout/checkout-pages-model.server";
import { slugify } from "~/utils/slugify";

/**
 * GET ?slug= — checks only the optional custom slug (same slugify as create).
 * Empty slug means the client should not call this; create assigns checkout-&lt;cuid&gt;.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const slugParam = url.searchParams.get("slug") ?? "";
  const normalized = slugify(slugParam.trim());

  if (!normalized) {
    return data(
      { checked: false as const, available: true as const, normalized: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const taken = await isCheckoutSlugTakenInDatabase({ slug: normalized });

  return data(
    {
      checked: true as const,
      available: !taken,
      normalized,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export default function CheckoutNewSlugAvailability() {
  return null;
}
