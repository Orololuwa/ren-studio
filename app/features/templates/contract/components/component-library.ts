import type { ComponentDefinition } from "../../shared/types";

export const contractComponentLibrary: Record<string, ComponentDefinition> = {
  "contract-header": {
    configurableProperties: [
      "contractTitle",
      "partyAName",
      "partyAAddress",
      "partyBName",
      "partyBAddress",
      "effectiveDate",
      "contractRef",
    ],
    defaultData: {
      contractTitle: "",
      partyAName: "",
      partyAAddress: "",
      partyBName: "",
      partyBAddress: "",
      effectiveDate: "",
      contractRef: "",
    },
    defaultStyles: {
      padding: "2rem",
    },
    icon: "FileText",
    label: "Contract Header",
    type: "contract-header",
  },
  "contract-body": {
    configurableProperties: ["content"],
    defaultData: {
      content: "",
    },
    defaultStyles: {
      padding: "1rem 2rem",
    },
    icon: "FileText",
    label: "Contract Body",
    type: "contract-body",
  },
  "contract-signature": {
    configurableProperties: [
      "partyASignatureName",
      "partyASignatureTitle",
      "partyADate",
      "partyBSignatureName",
      "partyBSignatureTitle",
      "partyBDate",
    ],
    defaultData: {
      partyASignatureName: "",
      partyASignatureTitle: "",
      partyADate: "",
      partyBSignatureName: "",
      partyBSignatureTitle: "",
      partyBDate: "",
    },
    defaultStyles: {
      padding: "2rem",
    },
    icon: "FileText",
    label: "Contract Signature",
    type: "contract-signature",
  },
};
