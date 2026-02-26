import type { Template } from "../../shared/types";

export const contractTemplates: Template[] = [
  {
    createdAt: new Date(),
    colorPalette: ["#ffffff", "#000000"],
    globalStyles: {
      backgroundColor: "$colorPalette[0]",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      textColor: "$colorPalette[1]",
    },
    id: "contract-simple",
    name: "Simple Contract",
    organizationId: "",
    type: "contract",
    sections: [
      {
        data: {
          contractTitle: "Service Agreement",
          partyAName: "Acme Inc.",
          partyAAddress:
            "123 Business Street\nCity, State 12345\nUnited States",
          partyBName: "Client Corp",
          partyBAddress:
            "456 Customer Avenue\nCity, State 67890\nUnited States",
          effectiveDate: new Date().toLocaleDateString(),
          contractRef: "AGR-2024-001",
        },
        id: "contract-header",
        order: 0,
        styles: {
          padding: "2rem",
        },
        type: "contract-header",
      },
      {
        data: {
          content:
            "<p>This Agreement is entered into as of the Effective Date between the parties listed above.</p><p><strong>1. Scope of Services</strong></p><p>The Provider agrees to deliver the services as described in the attached statement of work. The Client agrees to pay the fees as specified.</p><p><strong>2. Term</strong></p><p>This Agreement shall commence on the Effective Date and continue until terminated by either party with 30 days written notice.</p><p><strong>3. Payment Terms</strong></p><p>Payment is due within 30 days of receipt of invoice. Late payments may incur interest at 1.5% per month.</p>",
        },
        id: "contract-body",
        order: 1,
        styles: {
          padding: "1rem 2rem",
        },
        type: "contract-body",
      },
      {
        data: {
          partyASignatureName: "",
          partyASignatureTitle: "Authorized Signatory",
          partyADate: "",
          partyBSignatureName: "",
          partyBSignatureTitle: "Authorized Signatory",
          partyBDate: "",
        },
        id: "contract-signature",
        order: 2,
        styles: {
          padding: "2rem",
        },
        type: "contract-signature",
      },
    ],
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    colorPalette: ["#1e3a5f", "#ffffff", "#3b82f6", "#f8fafc"],
    globalStyles: {
      backgroundColor: "$colorPalette[3]",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "$colorPalette[0]",
    },
    id: "contract-professional",
    name: "Professional Contract",
    organizationId: "",
    type: "contract",
    sections: [
      {
        data: {
          contractTitle: "Master Service Agreement",
          partyAName: "Acme Corporation",
          partyAAddress:
            "123 Business Street\nSuite 100\nCity, State 12345\nUnited States",
          partyBName: "Client Corporation",
          partyBAddress:
            "456 Customer Avenue\nBuilding B, Floor 3\nCity, State 67890\nUnited States",
          effectiveDate: new Date().toLocaleDateString(),
          contractRef: "MSA-2024-001",
        },
        id: "contract-header",
        order: 0,
        styles: {
          backgroundColor: "$colorPalette[0]",
          color: "$colorPalette[1]",
          padding: "2rem",
          paddingBottom: "1.5rem",
        },
        type: "contract-header",
      },
      {
        data: {
          content:
            "<p>This Master Service Agreement (“Agreement”) is made and entered into as of the Effective Date by and between the Parties.</p><p><strong>1. Definitions</strong></p><p>“Services” means the services described in any attached Statement of Work. “Fees” means the amounts payable as specified in the applicable SOW.</p><p><strong>2. Services and Delivery</strong></p><p>The Provider shall perform the Services in accordance with the terms of this Agreement and any applicable SOW. Deliverables shall be delivered in the format and timeline specified.</p><p><strong>3. Term and Termination</strong></p><p>This Agreement shall remain in effect until terminated. Either party may terminate with 30 days written notice. Upon termination, the Client shall pay for all Services rendered prior to the termination date.</p><p><strong>4. Payment</strong></p><p>All invoices are due within Net 30 of the invoice date. Late payments shall bear interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.</p><p><strong>5. Confidentiality</strong></p><p>Each party agrees to maintain the confidentiality of the other party’s confidential information and to use such information only for the purpose of performing under this Agreement.</p>",
        },
        id: "contract-body",
        order: 1,
        styles: {
          backgroundColor: "$colorPalette[3]",
          color: "$colorPalette[0]",
          padding: "1.5rem 2rem",
        },
        type: "contract-body",
      },
      {
        data: {
          partyASignatureName: "",
          partyASignatureTitle: "Authorized Signatory",
          partyADate: "",
          partyBSignatureName: "",
          partyBSignatureTitle: "Authorized Signatory",
          partyBDate: "",
        },
        id: "contract-signature",
        order: 2,
        styles: {
          backgroundColor: "$colorPalette[3]",
          color: "$colorPalette[0]",
          padding: "2rem",
          borderTop: "2px solid $colorPalette[2]",
        },
        type: "contract-signature",
      },
    ],
    updatedAt: new Date(),
  },
];
