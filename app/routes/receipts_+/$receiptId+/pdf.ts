import type { Route } from "./+types/pdf";
import { generateReceiptExportHTML } from "~/features/templates/receipt/utils/html-generator-receipt.server";
import type { TemplateSection } from "~/features/templates/shared/types";
import { generatePDF } from "~/features/templates/shared/utils/pdf-generator.server";
import { prisma } from "~/utils/database.server";
import { notFound } from "~/utils/http-responses.server";

export async function loader({ params }: Route.LoaderArgs) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.receiptId },
  });

  if (!receipt) throw notFound();

  const sections = receipt.sections as unknown as TemplateSection[];
  const globalStyles = receipt.globalStyles as unknown as Record<
    string,
    string
  >;
  const colorPalette = (receipt.colorPalette as unknown as string[]) || [];

  const html = generateReceiptExportHTML(sections, globalStyles, colorPalette);
  const pdfBuffer = await generatePDF(html);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${receipt.receiptNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
