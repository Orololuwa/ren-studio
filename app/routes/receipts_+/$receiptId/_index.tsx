import type { Route } from "./+types/_index";
import { generateReceiptPreviewHtmlForReceiptInDatabaseById } from "~/features/checkout/receipt-generation.server";
import { notFound } from "~/utils/http-responses.server";

export async function loader({ params }: Route.LoaderArgs) {
  const html = await generateReceiptPreviewHtmlForReceiptInDatabaseById({
    receiptId: params.receiptId,
  });

  if (!html) throw notFound();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
