# Template Builder Implementation Guide

## Overview

This guide provides a comprehensive implementation plan for a canvas-based template builder system. Users can create, customize, and export templates (resumes, invoices, certificates, report cards) with drag-and-drop functionality, real-time editing, and server-side PDF generation.

## Architecture Overview

### Data Flow

```
Canvas (React Components) 
  ↓
State Store (Zustand) - Template Data Structure
  ↓
API Route (Server) - Receives JSON
  ↓
HTML Generator - Converts JSON → HTML/CSS
  ↓
Puppeteer - Renders HTML → PDF
```

### Key Principles

1. **Single Source of Truth**: Template data structure (`TemplateSection[]`) drives both canvas rendering and HTML generation
2. **Separation of Concerns**: React components for canvas, HTML strings for export
3. **Server-Side Rendering**: All PDF generation happens server-side using Puppeteer
4. **Extensible Style System**: Flat style object that can grow to support complex CSS

---

## Phase 1: Foundation & Dependencies

### Step 1.1: Install Required Packages

```bash
bun install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
bun install zustand
bun install puppeteer
bun install @types/puppeteer --save-dev
```

### Step 1.2: Create Type Definitions

**File**: `app/features/builder/types.ts`

```typescript
export type TemplateType = "resume" | "invoice" | "certificate" | "report-cards";

export type SectionType = 
  | "header"
  | "personal-info"
  | "experience"
  | "education"
  | "skills"
  | "summary"
  | "invoice-header"
  | "invoice-items"
  | "invoice-footer"
  | "certificate-header"
  | "certificate-body"
  | "report-header"
  | "report-grades";

export interface SectionStyles {
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  alignSelf?: string;
  flexWrap?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  
  // Colors & Backgrounds
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  background?: string;
  color?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  textShadow?: string;
  
  // Borders
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  
  // Effects
  boxShadow?: string;
  opacity?: string;
  transform?: string;
  transition?: string;
  filter?: string;
  backdropFilter?: string;
  
  // Positioning
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  
  // Sizing
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  
  // Overflow
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
  
  // Advanced
  clipPath?: string;
  maskImage?: string;
  objectFit?: string;
  cursor?: string;
}

export interface TemplateSection {
  id: string;
  type: SectionType;
  order: number;
  data: Record<string, unknown>;
  styles: SectionStyles;
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  sections: TemplateSection[];
  globalStyles: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentDefinition {
  type: SectionType;
  label: string;
  icon: string;
  defaultData: Record<string, unknown>;
  defaultStyles: SectionStyles;
  configurableProperties: string[];
}
```

---

## Phase 2: State Management

### Step 2.1: Create Builder Store

**File**: `app/features/builder/store/builder-store.ts`

```typescript
import { create } from "zustand";
import type { Template, TemplateSection } from "../types";

interface BuilderState {
  currentTemplate: Template | null;
  selectedSectionId: string | null;
  isDirty: boolean;
  setCurrentTemplate: (template: Template) => void;
  addSection: (section: TemplateSection) => void;
  updateSection: (id: string, updates: Partial<TemplateSection>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (sections: TemplateSection[]) => void;
  selectSection: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  currentTemplate: null,
  selectedSectionId: null,
  isDirty: false,
  
  setCurrentTemplate: (template) => 
    set({ currentTemplate: template, isDirty: false }),
  
  addSection: (section) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      const maxOrder = Math.max(...state.currentTemplate.sections.map(s => s.order), -1);
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: [...state.currentTemplate.sections, { ...section, order: maxOrder + 1 }],
        },
        isDirty: true,
      };
    }),
  
  updateSection: (id, updates) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: state.currentTemplate.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        },
        isDirty: true,
      };
    }),
  
  deleteSection: (id) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: state.currentTemplate.sections.filter((s) => s.id !== id),
        },
        selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
        isDirty: true,
      };
    }),
  
  reorderSections: (sections) =>
    set((state) => {
      if (!state.currentTemplate) return state;
      return {
        currentTemplate: {
          ...state.currentTemplate,
          sections: sections.map((section, index) => ({
            ...section,
            order: index,
          })),
        },
        isDirty: true,
      };
    }),
  
  selectSection: (id) => set({ selectedSectionId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),
}));
```

---

## Phase 3: Component Library

### Step 3.1: Create Component Definitions

**File**: `app/features/builder/components/component-library.ts`

```typescript
import type { ComponentDefinition } from "../types";

export const componentLibrary: Record<string, ComponentDefinition> = {
  header: {
    type: "header",
    label: "Header",
    icon: "Heading",
    defaultData: { 
      name: "", 
      title: "", 
      contact: "",
      email: "",
      phone: "",
      location: "",
    },
    defaultStyles: { 
      padding: "2rem",
      backgroundColor: "#ffffff",
      textAlign: "center",
    },
    configurableProperties: ["name", "title", "contact", "email", "phone", "location"],
  },
  experience: {
    type: "experience",
    label: "Work Experience",
    icon: "Briefcase",
    defaultData: { entries: [] },
    defaultStyles: { 
      padding: "1rem",
      marginTop: "1rem",
    },
    configurableProperties: ["entries"],
  },
  education: {
    type: "education",
    label: "Education",
    icon: "GraduationCap",
    defaultData: { entries: [] },
    defaultStyles: { 
      padding: "1rem",
      marginTop: "1rem",
    },
    configurableProperties: ["entries"],
  },
  skills: {
    type: "skills",
    label: "Skills",
    icon: "Star",
    defaultData: { 
      items: [],
      category: "",
    },
    defaultStyles: { 
      padding: "1rem",
      marginTop: "1rem",
    },
    configurableProperties: ["items", "category"],
  },
  summary: {
    type: "summary",
    label: "Summary",
    icon: "FileText",
    defaultData: { 
      content: "",
    },
    defaultStyles: { 
      padding: "1rem",
      marginTop: "1rem",
    },
    configurableProperties: ["content"],
  },
};
```

---

## Phase 4: Template Seed System

Before users can customize templates, we need predefined templates they can start with. This phase sets up the template seed system.

### Step 4.1: Create Template Seed Data

**File**: `app/features/builder/templates/resume-templates.ts`

```typescript
import type { Template } from "../types";

export const resumeTemplates: Template[] = [
  {
    id: "resume-modern-professional",
    name: "Modern Professional",
    type: "resume",
    sections: [
      {
        id: "header-1",
        type: "header",
        order: 0,
        data: {
          name: "John Doe",
          title: "Software Engineer",
          email: "john.doe@example.com",
          phone: "+1 (555) 123-4567",
          location: "San Francisco, CA",
        },
        styles: {
          padding: "2rem",
          backgroundColor: "#ffffff",
          textAlign: "center",
          borderBottom: "2px solid #667eea",
          paddingBottom: "1rem",
        },
      },
      {
        id: "summary-1",
        type: "summary",
        order: 1,
        data: {
          content: "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership.",
        },
        styles: {
          padding: "1.5rem",
          marginTop: "1rem",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        },
      },
      {
        id: "experience-1",
        type: "experience",
        order: 2,
        data: {
          entries: [
            {
              company: "Tech Corp",
              position: "Senior Software Engineer",
              startDate: "2020",
              endDate: "Present",
              description: "Led development of microservices architecture serving 1M+ users. Mentored junior developers and improved code quality.",
            },
            {
              company: "StartupXYZ",
              position: "Full Stack Developer",
              startDate: "2018",
              endDate: "2020",
              description: "Built and maintained React/Node.js applications. Implemented CI/CD pipelines reducing deployment time by 60%.",
            },
          ],
        },
        styles: {
          padding: "1.5rem",
          marginTop: "1rem",
        },
      },
      {
        id: "education-1",
        type: "education",
        order: 3,
        data: {
          entries: [
            {
              institution: "University of Technology",
              degree: "Bachelor of Science in Computer Science",
              year: "2018",
            },
          ],
        },
        styles: {
          padding: "1.5rem",
          marginTop: "1rem",
        },
      },
      {
        id: "skills-1",
        type: "skills",
        order: 4,
        data: {
          category: "Technical Skills",
          items: ["React", "TypeScript", "Node.js", "AWS", "Docker", "PostgreSQL"],
        },
        styles: {
          padding: "1.5rem",
          marginTop: "1rem",
        },
      },
    ],
    globalStyles: {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "resume-classic-elegant",
    name: "Classic Elegant",
    type: "resume",
    sections: [
      {
        id: "header-2",
        type: "header",
        order: 0,
        data: {
          name: "Jane Smith",
          title: "Product Manager",
          email: "jane.smith@example.com",
          phone: "+1 (555) 987-6543",
        },
        styles: {
          padding: "3rem 2rem",
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          textAlign: "center",
        },
      },
      {
        id: "experience-2",
        type: "experience",
        order: 1,
        data: {
          entries: [
            {
              company: "Innovation Labs",
              position: "Product Manager",
              startDate: "2019",
              endDate: "Present",
              description: "Drive product strategy and roadmap for B2B SaaS platform.",
            },
          ],
        },
        styles: {
          padding: "2rem",
          marginTop: "2rem",
          borderLeft: "4px solid #1a1a1a",
          paddingLeft: "1.5rem",
        },
      },
      {
        id: "education-2",
        type: "education",
        order: 2,
        data: {
          entries: [
            {
              institution: "Business School",
              degree: "MBA",
              year: "2017",
            },
          ],
        },
        styles: {
          padding: "2rem",
          marginTop: "1rem",
          borderLeft: "4px solid #1a1a1a",
          paddingLeft: "1.5rem",
        },
      },
    ],
    globalStyles: {
      fontFamily: "Georgia, serif",
      fontSize: "12pt",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
```

### Step 4.2: Create Template Index

**File**: `app/features/builder/templates/index.ts`

```typescript
import { resumeTemplates } from "./resume-templates";
import type { Template } from "../types";

// Add more template imports as you create them
// import { invoiceTemplates } from "./invoice-templates";
// import { certificateTemplates } from "./certificate-templates";

export const predefinedTemplates: Record<string, Template[]> = {
  resume: resumeTemplates,
  invoice: [],
  certificate: [],
  "report-cards": [],
};

// Helper to get template by ID
export function getTemplateById(id: string): Template | undefined {
  for (const templates of Object.values(predefinedTemplates)) {
    const found = templates.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

// Helper to get templates by type
export function getTemplatesByType(type: string): Template[] {
  return predefinedTemplates[type] || [];
}
```

### Step 4.3: Create Template Factory

**File**: `app/features/builder/utils/template-factory.ts`

```typescript
import type { Template, TemplateType, TemplateSection } from "../types";
import { getTemplateById } from "../templates";

export function createTemplateFromBase(
  baseTemplateId: string,
  organizationId: string,
  name: string
): Template {
  const baseTemplate = getTemplateById(baseTemplateId);
  
  if (!baseTemplate) {
    throw new Error(`Base template not found: ${baseTemplateId}`);
  }
  
  // Clone and customize
  return {
    ...baseTemplate,
    id: crypto.randomUUID(),
    name,
    organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Deep clone sections with new IDs and reset data
    sections: baseTemplate.sections.map((section) => ({
      ...section,
      id: crypto.randomUUID(),
      data: resetSectionData(section.type),
    })),
  };
}

export function createEmptyTemplate(
  type: TemplateType,
  organizationId: string,
  name: string
): Template {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    organizationId,
    sections: [],
    globalStyles: {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function resetSectionData(type: string): Record<string, unknown> {
  switch (type) {
    case "header":
      return { name: "", title: "", email: "", phone: "", location: "" };
    case "experience":
    case "education":
      return { entries: [] };
    case "skills":
      return { category: "", items: [] };
    case "summary":
      return { content: "" };
    default:
      return {};
  }
}
```

### Step 4.4: Update Builder Route to Load Templates

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.tsx`

```typescript
import { useState } from "react";
import { href, useNavigate } from "react-router";
import type { Route } from "./+types/builder";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { getTemplatesByType } from "~/features/builder/templates";
import { db } from "~/utils/database.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);
  const { organization } = context.get(organizationMembershipContext);

  // Load predefined templates
  const predefinedResume = getTemplatesByType("resume");
  const predefinedInvoice = getTemplatesByType("invoice");
  const predefinedCertificate = getTemplatesByType("certificate");
  const predefinedReportCards = getTemplatesByType("report-cards");

  // Load user's custom templates from database
  const userTemplates = await db.template.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group templates by type
  const templatesByType = {
    resume: [...predefinedResume, ...userTemplates.filter((t) => t.type === "resume")],
    invoice: [...predefinedInvoice, ...userTemplates.filter((t) => t.type === "invoice")],
    certificate: [
      ...predefinedCertificate,
      ...userTemplates.filter((t) => t.type === "certificate"),
    ],
    "report-cards": [
      ...predefinedReportCards,
      ...userTemplates.filter((t) => t.type === "report-cards"),
    ],
  };

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
    templatesByType,
    organizationSlug: params.organizationSlug,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function BuilderRoute({ loaderData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<string>("resume");
  const navigate = useNavigate();
  const { templatesByType, organizationSlug } = loaderData;

  const handleCreateNew = () => {
    // Navigate to create new template (empty template)
    navigate(`/organizations/${organizationSlug}/builder/new`);
  };

  const handleCustomize = (templateId: string) => {
    // Navigate to editor with template loaded
    navigate(`/organizations/${organizationSlug}/builder/${templateId}`);
  };

  const templates = templatesByType[activeTab as keyof typeof templatesByType] || [];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Template Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a template and customize it to your needs
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          Create New
        </Button>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value={activeTab}>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No templates available. Click "Create New" to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card className="flex flex-col" key={template.id}>
                  <CardHeader>
                    <div className="bg-muted/50 aspect-4/3 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        {template.name} Preview
                      </span>
                    </div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)} Template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1" />
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleCustomize(template.id)}
                      variant="outline"
                    >
                      Customize
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 4.5: Create Route for New Template

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.new.tsx`

```typescript
import { redirect } from "react-router";
import type { Route } from "./+types/builder.new";
import { createEmptyTemplate } from "~/features/builder/utils/template-factory";
import { db } from "~/utils/database.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  
  // Create a new empty template
  const newTemplate = createEmptyTemplate(
    "resume", // Default type, can be made configurable
    organization.id,
    "Untitled Template"
  );

  // Save to database
  const savedTemplate = await db.template.create({
    data: {
      id: newTemplate.id,
      organizationId: newTemplate.organizationId,
      name: newTemplate.name,
      type: newTemplate.type,
      sections: newTemplate.sections as any,
      globalStyles: newTemplate.globalStyles as any,
    },
  });

  // Redirect to editor
  return redirect(
    `/organizations/${params.organizationSlug}/builder/${savedTemplate.id}`
  );
}
```

### Step 4.6: Update Builder Editor Route to Handle Predefined Templates

Update the editor route loader to handle both predefined and database templates:

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.$templateId.tsx` (update loader)

```typescript
import { getTemplateById } from "~/features/builder/templates";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  
  // First check if it's a predefined template
  const predefinedTemplate = getTemplateById(params.templateId);
  
  if (predefinedTemplate) {
    // For predefined templates, create a copy for the user
    const userTemplate = await db.template.findFirst({
      where: {
        organizationId: organization.id,
        // You might want to track which predefined template this is based on
        // For now, we'll just load it directly
      },
    });
    
    // If user already has a copy, use that, otherwise create one
    if (!userTemplate) {
      const newTemplate = createTemplateFromBase(
        params.templateId,
        organization.id,
        `${predefinedTemplate.name} (Copy)`
      );
      
      const saved = await db.template.create({
        data: {
          id: newTemplate.id,
          organizationId: newTemplate.organizationId,
          name: newTemplate.name,
          type: newTemplate.type,
          sections: newTemplate.sections as any,
          globalStyles: newTemplate.globalStyles as any,
        },
      });
      
      return { template: saved };
    }
    
    return { template: userTemplate };
  }
  
  // Otherwise, load from database
  const template = await db.template.findUnique({
    where: {
      id: params.templateId,
      organizationId: organization.id,
    },
  });

  if (!template) {
    throw new Response("Template not found", { status: 404 });
  }

  return { template };
}
```

### Step 4.7: Template Flow Summary

The template system works as follows:

1. **Predefined Templates**: Static template definitions stored in `app/features/builder/templates/`
   - These serve as starting points for users
   - Can be version controlled and updated independently
   - Examples: "Modern Professional", "Classic Elegant" resume templates

2. **Template Selection**: User visits `/builder` route
   - Sees both predefined templates and their custom templates
   - Can click "Customize" on any template

3. **Template Customization Flow**:
   - **Predefined Template**: When user clicks "Customize" on a predefined template:
     - System creates a copy in the database
     - User gets their own editable version
     - Original predefined template remains unchanged
   - **Custom Template**: When user clicks "Customize" on their own template:
     - Loads directly from database
     - User can edit and save changes

4. **Create New**: User clicks "Create New"
   - Creates empty template or template from base
   - Saves to database immediately
   - Redirects to editor

5. **Editor**: User edits template in `/builder/:templateId`
   - Changes stored in Zustand store
   - Auto-save or manual save updates database
   - Export generates PDF from current state

**Key Benefits**:
- Predefined templates can be updated without affecting user's custom versions
- Users can create multiple versions of the same template
- Easy to add new template types (invoice, certificate, etc.)
- Templates are organization-scoped for multi-tenancy

---

## Phase 5: Canvas Implementation

### Step 5.1: Create Section Renderer

**File**: `app/features/builder/components/section-renderer.tsx`

```typescript
import type { TemplateSection } from "../types";

interface SectionRendererProps {
  section: TemplateSection;
  isSelected: boolean;
  onSelect: () => void;
}

export function SectionRenderer({ section, isSelected, onSelect }: SectionRendererProps) {
  const renderSection = () => {
    const sectionStyles = section.styles as React.CSSProperties;
    
    switch (section.type) {
      case "header":
        return (
          <div style={sectionStyles}>
            <h1>{section.data.name as string}</h1>
            <h2>{section.data.title as string}</h2>
            <div>{section.data.contact as string}</div>
            {section.data.email && <div>{section.data.email as string}</div>}
            {section.data.phone && <div>{section.data.phone as string}</div>}
            {section.data.location && <div>{section.data.location as string}</div>}
          </div>
        );
      
      case "experience":
        const experiences = Array.isArray(section.data.entries) 
          ? section.data.entries 
          : [];
        return (
          <div style={sectionStyles}>
            <h2>Work Experience</h2>
            {experiences.map((exp: any, idx: number) => (
              <div key={idx} className="mb-4">
                <h3>{exp.company} - {exp.position}</h3>
                <p className="text-sm text-muted-foreground">
                  {exp.startDate} - {exp.endDate}
                </p>
                <p>{exp.description}</p>
              </div>
            ))}
          </div>
        );
      
      case "education":
        const educations = Array.isArray(section.data.entries) 
          ? section.data.entries 
          : [];
        return (
          <div style={sectionStyles}>
            <h2>Education</h2>
            {educations.map((edu: any, idx: number) => (
              <div key={idx} className="mb-4">
                <h3>{edu.institution}</h3>
                <p>{edu.degree} - {edu.year}</p>
              </div>
            ))}
          </div>
        );
      
      case "skills":
        const skills = Array.isArray(section.data.items) 
          ? section.data.items 
          : [];
        return (
          <div style={sectionStyles}>
            <h2>{section.data.category as string || "Skills"}</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-muted rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      
      case "summary":
        return (
          <div style={sectionStyles}>
            <h2>Summary</h2>
            <p>{section.data.content as string}</p>
          </div>
        );
      
      default:
        return <div style={sectionStyles}>{JSON.stringify(section.data)}</div>;
    }
  };

  return (
    <div
      className={`relative ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onClick={onSelect}
    >
      {renderSection()}
    </div>
  );
}
```

### Step 5.2: Create Canvas Component with Drag & Drop

**File**: `app/features/builder/components/template-canvas.tsx`

```typescript
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { useBuilderStore } from "../store/builder-store";
import { SectionRenderer } from "./section-renderer";
import type { TemplateSection } from "../types";

export function TemplateCanvas() {
  const { currentTemplate, selectedSectionId, selectSection, reorderSections } =
    useBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No template selected
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = currentTemplate.sections.findIndex(
      (s) => s.id === active.id
    );
    const newIndex = currentTemplate.sections.findIndex(
      (s) => s.id === over.id
    );

    const newSections = [...currentTemplate.sections];
    const [moved] = newSections.splice(oldIndex, 1);
    newSections.splice(newIndex, 0, moved);

    const reordered = newSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    reorderSections(reordered);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 bg-muted/20 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-[800px] p-8">
          <SortableContext
            items={currentTemplate.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentTemplate.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => selectSection(section.id)}
                />
              ))}
          </SortableContext>
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50">
            <SectionRenderer
              section={currentTemplate.sections.find((s) => s.id === activeId)!}
              isSelected={false}
              onSelect={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableSection({
  section,
  isSelected,
  onSelect,
}: {
  section: TemplateSection;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVerticalIcon className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          {section.type}
        </span>
      </div>
      <SectionRenderer
        section={section}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </div>
  );
}
```

---

## Phase 6: Side Panel & Component Palette

### Step 5.1: Create Component Palette

**File**: `app/features/builder/components/component-palette.tsx`

```typescript
import { useDraggable } from "@dnd-kit/core";
import { componentLibrary } from "./component-library";
import { useBuilderStore } from "../store/builder-store";
import type { ComponentDefinition, TemplateSection } from "../types";

export function ComponentPalette() {
  const { addSection } = useBuilderStore();

  return (
    <div className="w-64 border-r bg-background p-4 overflow-auto">
      <h3 className="font-semibold mb-4">Components</h3>
      <div className="space-y-2">
        {Object.values(componentLibrary).map((component) => (
          <DraggableComponent
            key={component.type}
            component={component}
            onAdd={addSection}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableComponent({
  component,
  onAdd,
}: {
  component: ComponentDefinition;
  onAdd: (section: TemplateSection) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${component.type}`,
    data: { component },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = () => {
    const newSection: TemplateSection = {
      id: crypto.randomUUID(),
      type: component.type,
      order: 0, // Will be recalculated in store
      data: { ...component.defaultData },
      styles: { ...component.defaultStyles },
    };
    onAdd(newSection);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 border rounded cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{component.label}</span>
      </div>
    </div>
  );
}
```

### Step 5.2: Create Properties Panel

**File**: `app/features/builder/components/properties-panel.tsx`

```typescript
import { useBuilderStore } from "../store/builder-store";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import type { TemplateSection } from "../types";

export function PropertiesPanel() {
  const { currentTemplate, selectedSectionId, updateSection, deleteSection } = useBuilderStore();

  const section = currentTemplate?.sections.find(
    (s) => s.id === selectedSectionId
  );

  if (!section) {
    return (
      <div className="w-80 border-l bg-background p-4">
        <p className="text-muted-foreground text-sm">
          Select a section to edit properties
        </p>
      </div>
    );
  }

  const updateData = (key: string, value: unknown) => {
    updateSection(section.id, {
      data: { ...section.data, [key]: value },
    });
  };

  const updateStyle = (key: keyof typeof section.styles, value: string) => {
    updateSection(section.id, {
      styles: {
        ...section.styles,
        [key]: value || undefined,
      },
    });
  };

  return (
    <div className="w-80 border-l bg-background p-4 overflow-auto">
      <h3 className="font-semibold mb-4">Properties</h3>
      
      {/* Content Properties */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium">Content</h4>
        {Object.entries(section.data).map(([key, value]) => {
          if (Array.isArray(value)) return null; // Handle arrays separately
          return (
            <div key={key}>
              <Label htmlFor={key} className="text-xs">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Label>
              <Input
                id={key}
                size="sm"
                value={String(value || "")}
                onChange={(e) => updateData(key, e.target.value)}
                className="mt-1"
              />
            </div>
          );
        })}
      </div>

      {/* Style Properties */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Styles</h4>
        
        {/* Spacing */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Spacing</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="padding" className="text-xs">Padding</Label>
              <Input
                id="padding"
                size="sm"
                value={section.styles.padding || ""}
                onChange={(e) => updateStyle("padding", e.target.value)}
                placeholder="1rem"
              />
            </div>
            <div>
              <Label htmlFor="margin" className="text-xs">Margin</Label>
              <Input
                id="margin"
                size="sm"
                value={section.styles.margin || ""}
                onChange={(e) => updateStyle("margin", e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Layout</Label>
          <div>
            <Label htmlFor="display" className="text-xs">Display</Label>
            <select
              id="display"
              value={section.styles.display || ""}
              onChange={(e) => updateStyle("display", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1"
            >
              <option value="">Default</option>
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
              <option value="inline-block">Inline Block</option>
            </select>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Colors</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="backgroundColor" className="text-xs">Background</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={section.styles.backgroundColor || "#ffffff"}
                onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="color" className="text-xs">Text Color</Label>
              <Input
                id="color"
                type="color"
                value={section.styles.color || "#000000"}
                onChange={(e) => updateStyle("color", e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Typography</Label>
          <div>
            <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
            <Input
              id="fontSize"
              size="sm"
              value={section.styles.fontSize || ""}
              onChange={(e) => updateStyle("fontSize", e.target.value)}
              placeholder="16px"
            />
          </div>
          <div>
            <Label htmlFor="textAlign" className="text-xs">Text Align</Label>
            <select
              id="textAlign"
              value={section.styles.textAlign || ""}
              onChange={(e) => updateStyle("textAlign", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1"
            >
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Effects</Label>
          <div>
            <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
            <Input
              id="borderRadius"
              size="sm"
              value={section.styles.borderRadius || ""}
              onChange={(e) => updateStyle("borderRadius", e.target.value)}
              placeholder="8px"
            />
          </div>
          <div>
            <Label htmlFor="boxShadow" className="text-xs">Box Shadow</Label>
            <Input
              id="boxShadow"
              size="sm"
              value={section.styles.boxShadow || ""}
              onChange={(e) => updateStyle("boxShadow", e.target.value)}
              placeholder="0 4px 6px rgba(0,0,0,0.1)"
            />
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <Button
        variant="destructive"
        className="mt-6 w-full"
        onClick={() => deleteSection(section.id)}
      >
        Delete Section
      </Button>
    </div>
  );
}
```

---

## Phase 7: Main Builder Layout

### Step 6.1: Create Builder Editor Route

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.$templateId.tsx`

```typescript
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useFetcher } from "react-router";
import type { Route } from "./+types/builder.$templateId";
import { TemplateCanvas } from "~/features/builder/components/template-canvas";
import { ComponentPalette } from "~/features/builder/components/component-palette";
import { PropertiesPanel } from "~/features/builder/components/properties-panel";
import { PreviewModal } from "~/features/builder/components/preview-modal";
import { ExportButton } from "~/features/builder/components/export-button";
import { Button } from "~/components/ui/button";
import { useBuilderStore } from "~/features/builder/store/builder-store";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { href } from "react-router";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder/:templateId", {
        organizationSlug: params.organizationSlug,
        templateId: params.templateId,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function BuilderEditorRoute({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { currentTemplate, setCurrentTemplate } = useBuilderStore();
  const fetcher = useFetcher();

  // Load template on mount
  useEffect(() => {
    if (params.templateId && fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/organizations/${params.organizationSlug}/builder/${params.templateId}/api`);
    }
  }, [params.templateId, params.organizationSlug]);

  useEffect(() => {
    if (fetcher.data?.template) {
      setCurrentTemplate(fetcher.data.template);
    }
  }, [fetcher.data, setCurrentTemplate]);

  return (
    <div className="flex h-screen">
      <ComponentPalette />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{currentTemplate?.name || "Untitled"}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <ExportButton />
          </div>
        </div>
        <TemplateCanvas />
      </div>
      <PropertiesPanel />
      <PreviewModal open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
```

---

## Phase 8: Database Schema

### Step 7.1: Add Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model Template {
  id            String   @id @default(cuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name          String
  type          String   // "resume" | "invoice" | "certificate" | "report-cards"
  sections      Json     // Array of TemplateSection
  globalStyles  Json     // Record<string, string>
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([organizationId, type])
  @@map("templates")
}
```

Run migration:
```bash
bun run prisma:migrate dev --name add_templates
```

---

## Phase 9: API Routes

### Step 8.1: Create API Route

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.$templateId.api.ts`

```typescript
import puppeteer from "puppeteer";
import type { Route } from "./+types/builder.$templateId.api";
import { generateExportHTML, generatePreviewHTML } from "~/features/builder/utils/html-generator.server";
import { generatePDF, generateImage } from "~/features/builder/utils/pdf-generator.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { db } from "~/utils/database.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { user, organization } = context.get(organizationMembershipContext);
  
  const template = await db.template.findUnique({
    where: { 
      id: params.templateId,
      organizationId: organization.id,
    },
  });

  if (!template) {
    throw new Response("Template not found", { status: 404 });
  }

  return { template };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { user, organization } = context.get(organizationMembershipContext);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const sections = JSON.parse(formData.get("sections") as string);
    const globalStyles = JSON.parse(formData.get("globalStyles") as string || "{}");
    
    await db.template.update({
      where: { 
        id: params.templateId,
        organizationId: organization.id,
      },
      data: { 
        sections, 
        globalStyles,
        updatedAt: new Date() 
      },
    });
    
    return { success: true };
  }

  if (intent === "preview") {
    const sections = JSON.parse(formData.get("sections") as string);
    const globalStyles = JSON.parse(formData.get("globalStyles") as string || "{}");
    const templateType = formData.get("templateType") as string;
    
    const previewHtml = generatePreviewHTML(sections, globalStyles, templateType as any);
    const pdfBuffer = await generatePDF(previewHtml, { format: "A4" });
    
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=preview.pdf",
      },
    });
  }

  if (intent === "export-pdf") {
    const sections = JSON.parse(formData.get("sections") as string);
    const globalStyles = JSON.parse(formData.get("globalStyles") as string || "{}");
    const templateType = formData.get("templateType") as string;
    const filename = formData.get("filename") as string || "template.pdf";
    
    const html = generateExportHTML(sections, globalStyles, templateType as any);
    const pdfBuffer = await generatePDF(html, { 
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });
    
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (intent === "preview-image") {
    const sections = JSON.parse(formData.get("sections") as string);
    const globalStyles = JSON.parse(formData.get("globalStyles") as string || "{}");
    const templateType = formData.get("templateType") as string;
    
    const html = generatePreviewHTML(sections, globalStyles, templateType as any);
    const imageBuffer = await generateImage(html, { 
      width: 1200,
      height: 1600,
    });
    
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=preview.png",
      },
    });
  }

  throw new Response("Invalid intent", { status: 400 });
}
```

---

## Phase 10: HTML Generation Utilities

### Step 9.1: Create HTML Generator

**File**: `app/features/builder/utils/html-generator.server.ts`

```typescript
import type { TemplateSection, TemplateType } from "../types";

export function generatePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  templateType: TemplateType
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  const sectionHTML = sortedSections
    .map((section) => renderSectionToHTML(section))
    .join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${globalStyles.fontFamily || "Arial, sans-serif"};
      font-size: ${globalStyles.fontSize || "14px"};
      color: ${globalStyles.textColor || "#000000"};
      background-color: ${globalStyles.backgroundColor || "#ffffff"};
      line-height: 1.6;
      padding: 20px;
    }
    
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="template-container">
    ${sectionHTML}
  </div>
</body>
</html>
  `.trim();
}

export function generateExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  templateType: TemplateType
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  const sectionHTML = sortedSections
    .map((section) => renderSectionToHTML(section))
    .join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Template Export</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${globalStyles.fontFamily || "Arial, sans-serif"};
      font-size: ${globalStyles.fontSize || "12pt"};
      color: ${globalStyles.textColor || "#000000"};
      background-color: ${globalStyles.backgroundColor || "#ffffff"};
      line-height: 1.5;
    }
    
    .template-container {
      width: 100%;
      padding: 20mm;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .template-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="template-container">
    ${sectionHTML}
  </div>
</body>
</html>
  `.trim();
}

function renderSectionToHTML(section: TemplateSection): string {
  const inlineStyles = objectToCSS(section.styles);
  
  switch (section.type) {
    case "header":
      return `
        <section class="template-section section-header" style="${inlineStyles}">
          <h1>${escapeHtml(String(section.data.name || ""))}</h1>
          <h2>${escapeHtml(String(section.data.title || ""))}</h2>
          <div class="contact-info">
            ${escapeHtml(String(section.data.contact || ""))}
          </div>
          ${section.data.email ? `<div>${escapeHtml(String(section.data.email))}</div>` : ""}
          ${section.data.phone ? `<div>${escapeHtml(String(section.data.phone))}</div>` : ""}
          ${section.data.location ? `<div>${escapeHtml(String(section.data.location))}</div>` : ""}
        </section>
      `;
    
    case "experience":
      const experiences = Array.isArray(section.data.entries) 
        ? section.data.entries 
        : [];
      return `
        <section class="template-section section-experience" style="${inlineStyles}">
          <h2>Work Experience</h2>
          ${experiences.map((exp: any) => `
            <div class="experience-entry">
              <h3>${escapeHtml(String(exp.company || ""))} - ${escapeHtml(String(exp.position || ""))}</h3>
              <p class="date-range">${escapeHtml(String(exp.startDate || ""))} - ${escapeHtml(String(exp.endDate || ""))}</p>
              <p>${escapeHtml(String(exp.description || ""))}</p>
            </div>
          `).join("")}
        </section>
      `;
    
    case "education":
      const educations = Array.isArray(section.data.entries) 
        ? section.data.entries 
        : [];
      return `
        <section class="template-section section-education" style="${inlineStyles}">
          <h2>Education</h2>
          ${educations.map((edu: any) => `
            <div class="education-entry">
              <h3>${escapeHtml(String(edu.institution || ""))}</h3>
              <p>${escapeHtml(String(edu.degree || ""))} - ${escapeHtml(String(edu.year || ""))}</p>
            </div>
          `).join("")}
        </section>
      `;
    
    case "skills":
      const skills = Array.isArray(section.data.items) 
        ? section.data.items 
        : [];
      return `
        <section class="template-section section-skills" style="${inlineStyles}">
          <h2>${escapeHtml(String(section.data.category || "Skills"))}</h2>
          <div class="skills-list">
            ${skills.map((skill: string) => `
              <span class="skill-item">${escapeHtml(String(skill))}</span>
            `).join("")}
          </div>
        </section>
      `;
    
    case "summary":
      return `
        <section class="template-section section-summary" style="${inlineStyles}">
          <h2>Summary</h2>
          <p>${escapeHtml(String(section.data.content || ""))}</p>
        </section>
      `;
    
    default:
      return `
        <section class="template-section section-${section.type}" style="${inlineStyles}">
          ${JSON.stringify(section.data)}
        </section>
      `;
  }
}

function objectToCSS(styles: Record<string, string | undefined>): string {
  return Object.entries(styles)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const cssProperty = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(" ");
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
```

---

## Phase 11: Puppeteer PDF Generation

### Step 10.1: Create PDF Generator Utility

**File**: `app/features/builder/utils/pdf-generator.server.ts`

```typescript
import puppeteer from "puppeteer";

interface PDFOptions {
  format?: "A4" | "Letter" | "Legal";
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  landscape?: boolean;
  scale?: number;
}

let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

export async function generatePDF(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: options.printBackground ?? true,
      margin: options.margin || {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      landscape: options.landscape || false,
      scale: options.scale || 1,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function generateImage(
  html: string,
  options: { width?: number; height?: number } = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: options.width || 1200,
      height: options.height || 1600,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

// Cleanup function for graceful shutdown
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
```

---

## Phase 12: Preview & Export Components

### Step 11.1: Create Preview Modal

**File**: `app/features/builder/components/preview-modal.tsx`

```typescript
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useBuilderStore } from "../store/builder-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export function PreviewModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { currentTemplate } = useBuilderStore();
  const fetcher = useFetcher();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = () => {
    if (!currentTemplate) return;

    const formData = new FormData();
    formData.append("intent", "preview");
    formData.append("sections", JSON.stringify(currentTemplate.sections));
    formData.append("globalStyles", JSON.stringify(currentTemplate.globalStyles));
    formData.append("templateType", currentTemplate.type);

    fetcher.submit(formData, {
      method: "POST",
      action: `/organizations/${currentTemplate.organizationId}/builder/${currentTemplate.id}/api`,
    });
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data instanceof Blob) {
      const url = URL.createObjectURL(fetcher.data);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fetcher.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 mb-4">
          <Button onClick={handlePreview} disabled={fetcher.state === "submitting"}>
            {fetcher.state === "submitting" ? "Generating..." : "Generate Preview"}
          </Button>
          
          {previewUrl && (
            <Button
              variant="outline"
              onClick={() => {
                const a = document.createElement("a");
                a.href = previewUrl;
                a.download = "preview.pdf";
                a.click();
              }}
            >
              Download Preview
            </Button>
          )}
        </div>

        {previewUrl && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full h-[600px]"
              title="PDF Preview"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Step 11.2: Create Export Button

**File**: `app/features/builder/components/export-button.tsx`

```typescript
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useBuilderStore } from "../store/builder-store";
import { Button } from "~/components/ui/button";
import { DownloadIcon } from "lucide-react";

export function ExportButton() {
  const { currentTemplate } = useBuilderStore();
  const fetcher = useFetcher();

  const handleExport = () => {
    if (!currentTemplate) return;

    const formData = new FormData();
    formData.append("intent", "export-pdf");
    formData.append("sections", JSON.stringify(currentTemplate.sections));
    formData.append("globalStyles", JSON.stringify(currentTemplate.globalStyles));
    formData.append("templateType", currentTemplate.type);
    formData.append("filename", `${currentTemplate.name}.pdf`);

    fetcher.submit(formData, {
      method: "POST",
      action: `/organizations/${currentTemplate.organizationId}/builder/${currentTemplate.id}/api`,
    });
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data instanceof Blob) {
      const url = URL.createObjectURL(fetcher.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentTemplate?.name || "template"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [fetcher.data, currentTemplate?.name]);

  return (
    <Button
      onClick={handleExport}
      disabled={fetcher.state === "submitting" || !currentTemplate}
    >
      <DownloadIcon className="w-4 h-4 mr-2" />
      {fetcher.state === "submitting" ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
```

---

## Phase 13: Drop Zones

### Step 12.1: Update Canvas to Handle Drops from Palette

Update `template-canvas.tsx` to add drop zone support:

```typescript
// Add to TemplateCanvas component
import { useDroppable } from "@dnd-kit/core";

function CanvasDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] border-2 border-dashed rounded-lg p-4 ${
        isOver ? "border-primary bg-primary/10" : "border-muted"
      }`}
    >
      <p className="text-center text-muted-foreground">
        Drag components here or click to add
      </p>
    </div>
  );
}
```

---

## Phase 14: Unit Tests

Unit tests should be written alongside implementation. Tests are colocated with implementation files (e.g., `builder-store.ts` → `builder-store.test.ts`).

### Step 14.1: Test HTML Generation Utilities

**File**: `app/features/builder/utils/html-generator.server.test.ts`

```typescript
import { describe, expect, test } from "vitest";
import { renderSectionToHTML, objectToCSS, escapeHtml } from "./html-generator.server";
import type { TemplateSection } from "../types";

describe("html-generator.server", () => {
  describe("objectToCSS", () => {
    test("given: styles object with padding and backgroundColor, should: convert to CSS string", () => {
      const styles = {
        padding: "2rem",
        backgroundColor: "#ffffff",
      };

      const actual = objectToCSS(styles);

      const expected = "padding: 2rem; background-color: #ffffff;";

      expect(actual).toEqual(expected);
    });

    test("given: styles object with camelCase properties, should: convert to kebab-case CSS properties", () => {
      const styles = {
        paddingTop: "1rem",
        marginBottom: "2rem",
        borderTopLeftRadius: "8px",
      };

      const actual = objectToCSS(styles);

      const expected = "padding-top: 1rem; margin-bottom: 2rem; border-top-left-radius: 8px;";

      expect(actual).toEqual(expected);
    });

    test("given: styles object with undefined values, should: filter out undefined values", () => {
      const styles = {
        padding: "1rem",
        margin: undefined,
        backgroundColor: "#ffffff",
      };

      const actual = objectToCSS(styles);

      const expected = "padding: 1rem; background-color: #ffffff;";

      expect(actual).toEqual(expected);
    });
  });

  describe("escapeHtml", () => {
    test("given: string with HTML special characters, should: escape all special characters", () => {
      const input = '<div>Hello & "World"</div>';

      const actual = escapeHtml(input);

      const expected = "&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;";

      expect(actual).toEqual(expected);
    });

    test("given: string without special characters, should: return unchanged", () => {
      const input = "Plain text";

      const actual = escapeHtml(input);

      const expected = "Plain text";

      expect(actual).toEqual(expected);
    });
  });

  describe("renderSectionToHTML", () => {
    test("given: header section with data, should: render header HTML", () => {
      const section: TemplateSection = {
        id: "header-1",
        type: "header",
        order: 0,
        data: {
          name: "John Doe",
          title: "Software Engineer",
          email: "john@example.com",
        },
        styles: {
          padding: "2rem",
          backgroundColor: "#ffffff",
        },
      };

      const actual = renderSectionToHTML(section);

      expect(actual).toContain("John Doe");
      expect(actual).toContain("Software Engineer");
      expect(actual).toContain("john@example.com");
      expect(actual).toContain("padding: 2rem");
      expect(actual).toContain("background-color: #ffffff");
    });

    test("given: experience section with entries, should: render experience HTML", () => {
      const section: TemplateSection = {
        id: "exp-1",
        type: "experience",
        order: 1,
        data: {
          entries: [
            {
              company: "Tech Corp",
              position: "Developer",
              startDate: "2020",
              endDate: "2023",
              description: "Built apps",
            },
          ],
        },
        styles: {
          padding: "1rem",
        },
      };

      const actual = renderSectionToHTML(section);

      expect(actual).toContain("Work Experience");
      expect(actual).toContain("Tech Corp");
      expect(actual).toContain("Developer");
      expect(actual).toContain("2020");
      expect(actual).toContain("2023");
      expect(actual).toContain("Built apps");
    });

    test("given: section with empty entries array, should: render section without entries", () => {
      const section: TemplateSection = {
        id: "exp-1",
        type: "experience",
        order: 1,
        data: {
          entries: [],
        },
        styles: {},
      };

      const actual = renderSectionToHTML(section);

      expect(actual).toContain("Work Experience");
      expect(actual).not.toContain("experience-entry");
    });
  });
});
```

### Step 14.2: Test Template Factory Functions

**File**: `app/features/builder/utils/template-factory.test.ts`

```typescript
import { describe, expect, test } from "vitest";
import { createTemplateFromBase, createEmptyTemplate, resetSectionData } from "./template-factory";
import type { TemplateType } from "../types";

describe("template-factory", () => {
  describe("createEmptyTemplate", () => {
    test("given: type resume and organizationId, should: create template with empty sections", () => {
      const organizationId = "org-123";
      const name = "My Resume";

      const actual = createEmptyTemplate("resume", organizationId, name);

      expect(actual.type).toEqual("resume");
      expect(actual.name).toEqual(name);
      expect(actual.organizationId).toEqual(organizationId);
      expect(actual.sections).toEqual([]);
      expect(actual.globalStyles).toBeDefined();
      expect(actual.id).toBeDefined();
      expect(actual.createdAt).toBeInstanceOf(Date);
      expect(actual.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("resetSectionData", () => {
    test("given: header type, should: return empty header data structure", () => {
      const actual = resetSectionData("header");

      const expected = {
        name: "",
        title: "",
        email: "",
        phone: "",
        location: "",
      };

      expect(actual).toEqual(expected);
    });

    test("given: experience type, should: return empty entries array", () => {
      const actual = resetSectionData("experience");

      const expected = {
        entries: [],
      };

      expect(actual).toEqual(expected);
    });

    test("given: skills type, should: return empty skills data", () => {
      const actual = resetSectionData("skills");

      const expected = {
        category: "",
        items: [],
      };

      expect(actual).toEqual(expected);
    });

    test("given: unknown type, should: return empty object", () => {
      const actual = resetSectionData("unknown");

      const expected = {};

      expect(actual).toEqual(expected);
    });
  });
});
```

### Step 14.3: Test Builder Store Actions

**File**: `app/features/builder/store/builder-store.test.ts`

```typescript
import { describe, expect, test, beforeEach } from "vitest";
import { useBuilderStore } from "./builder-store";
import type { Template, TemplateSection } from "../types";

describe("builder-store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useBuilderStore.setState({
      currentTemplate: null,
      selectedSectionId: null,
      isDirty: false,
    });
  });

  describe("setCurrentTemplate", () => {
    test("given: template object, should: set currentTemplate and reset isDirty", () => {
      const template: Template = {
        id: "template-1",
        name: "Test Template",
        type: "resume",
        organizationId: "org-1",
        sections: [],
        globalStyles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useBuilderStore.getState().setCurrentTemplate(template);

      const actual = useBuilderStore.getState().currentTemplate;
      const isDirty = useBuilderStore.getState().isDirty;

      expect(actual).toEqual(template);
      expect(isDirty).toEqual(false);
    });
  });

  describe("addSection", () => {
    test("given: template with sections and new section, should: add section with correct order", () => {
      const template: Template = {
        id: "template-1",
        name: "Test",
        type: "resume",
        organizationId: "org-1",
        sections: [
          {
            id: "section-1",
            type: "header",
            order: 0,
            data: {},
            styles: {},
          },
        ],
        globalStyles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useBuilderStore.getState().setCurrentTemplate(template);

      const newSection: TemplateSection = {
        id: "section-2",
        type: "experience",
        order: 0,
        data: {},
        styles: {},
      };

      useBuilderStore.getState().addSection(newSection);

      const actual = useBuilderStore.getState().currentTemplate?.sections;
      const isDirty = useBuilderStore.getState().isDirty;

      expect(actual?.length).toEqual(2);
      expect(actual?.[1].id).toEqual("section-2");
      expect(actual?.[1].order).toEqual(1);
      expect(isDirty).toEqual(true);
    });

    test("given: no current template, should: not add section", () => {
      const section: TemplateSection = {
        id: "section-1",
        type: "header",
        order: 0,
        data: {},
        styles: {},
      };

      useBuilderStore.getState().addSection(section);

      const actual = useBuilderStore.getState().currentTemplate;

      expect(actual).toBeNull();
    });
  });

  describe("updateSection", () => {
    test("given: section id and updates, should: update section data", () => {
      const template: Template = {
        id: "template-1",
        name: "Test",
        type: "resume",
        organizationId: "org-1",
        sections: [
          {
            id: "section-1",
            type: "header",
            order: 0,
            data: { name: "Old Name" },
            styles: {},
          },
        ],
        globalStyles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useBuilderStore.getState().setCurrentTemplate(template);
      useBuilderStore.getState().updateSection("section-1", {
        data: { name: "New Name" },
      });

      const actual = useBuilderStore.getState().currentTemplate?.sections[0].data;

      const expected = { name: "New Name" };

      expect(actual).toEqual(expected);
      expect(useBuilderStore.getState().isDirty).toEqual(true);
    });
  });

  describe("deleteSection", () => {
    test("given: section id, should: remove section from template", () => {
      const template: Template = {
        id: "template-1",
        name: "Test",
        type: "resume",
        organizationId: "org-1",
        sections: [
          {
            id: "section-1",
            type: "header",
            order: 0,
            data: {},
            styles: {},
          },
          {
            id: "section-2",
            type: "experience",
            order: 1,
            data: {},
            styles: {},
          },
        ],
        globalStyles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useBuilderStore.getState().setCurrentTemplate(template);
      useBuilderStore.getState().selectSection("section-1");
      useBuilderStore.getState().deleteSection("section-1");

      const actual = useBuilderStore.getState().currentTemplate?.sections;
      const selectedId = useBuilderStore.getState().selectedSectionId;

      expect(actual?.length).toEqual(1);
      expect(actual?.[0].id).toEqual("section-2");
      expect(selectedId).toBeNull();
      expect(useBuilderStore.getState().isDirty).toEqual(true);
    });
  });

  describe("reorderSections", () => {
    test("given: reordered sections array, should: update section orders", () => {
      const template: Template = {
        id: "template-1",
        name: "Test",
        type: "resume",
        organizationId: "org-1",
        sections: [
          {
            id: "section-1",
            type: "header",
            order: 0,
            data: {},
            styles: {},
          },
          {
            id: "section-2",
            type: "experience",
            order: 1,
            data: {},
            styles: {},
          },
        ],
        globalStyles: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useBuilderStore.getState().setCurrentTemplate(template);

      const reordered = [
        template.sections[1],
        template.sections[0],
      ];

      useBuilderStore.getState().reorderSections(reordered);

      const actual = useBuilderStore.getState().currentTemplate?.sections;

      expect(actual?.[0].id).toEqual("section-2");
      expect(actual?.[0].order).toEqual(0);
      expect(actual?.[1].id).toEqual("section-1");
      expect(actual?.[1].order).toEqual(1);
      expect(useBuilderStore.getState().isDirty).toEqual(true);
    });
  });
});
```

### Step 14.4: Test Template Helpers

**File**: `app/features/builder/templates/index.test.ts`

```typescript
import { describe, expect, test } from "vitest";
import { getTemplateById, getTemplatesByType } from "./index";

describe("templates/index", () => {
  describe("getTemplateById", () => {
    test("given: valid template id, should: return template", () => {
      const templateId = "resume-modern-professional";

      const actual = getTemplateById(templateId);

      expect(actual).toBeDefined();
      expect(actual?.id).toEqual(templateId);
    });

    test("given: invalid template id, should: return undefined", () => {
      const templateId = "non-existent-template";

      const actual = getTemplateById(templateId);

      expect(actual).toBeUndefined();
    });
  });

  describe("getTemplatesByType", () => {
    test("given: resume type, should: return resume templates", () => {
      const actual = getTemplatesByType("resume");

      expect(actual.length).toBeGreaterThan(0);
      expect(actual.every((t) => t.type === "resume")).toEqual(true);
    });

    test("given: non-existent type, should: return empty array", () => {
      const actual = getTemplatesByType("non-existent");

      expect(actual).toEqual([]);
    });
  });
});
```

---

## Phase 15: Integration Tests

Integration tests verify API routes work correctly with the database and external services.

### Step 15.1: Test API Route Loader

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.$templateId.api.test.ts`

```typescript
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { createTestContextProvider } from "~/test/test-utils";
import { db } from "~/utils/database.server";
import { loader } from "./builder.$templateId.api";

describe("builder.$templateId.api loader", () => {
  let organizationId: string;
  let userId: string;
  let templateId: string;

  beforeEach(async () => {
    // Create test organization and user
    const org = await db.organization.create({
      data: {
        name: "Test Org",
        slug: "test-org",
      },
    });
    organizationId = org.id;

    const user = await db.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });
    userId = user.id;

    // Create test template
    const template = await db.template.create({
      data: {
        organizationId: org.id,
        name: "Test Template",
        type: "resume",
        sections: [],
        globalStyles: {},
      },
    });
    templateId = template.id;
  });

  afterEach(async () => {
    await db.template.deleteMany();
    await db.organization.deleteMany();
    await db.user.deleteMany();
  });

  test("given: valid template id and organization membership, should: return template", async () => {
    const context = await createTestContextProvider({
      params: {
        organizationSlug: "test-org",
        templateId,
      },
      request: new Request("http://localhost/builder/test"),
      pattern: "/organizations/:organizationSlug/builder/:templateId/api",
    });

    const actual = await loader({
      params: { organizationSlug: "test-org", templateId },
      context,
      request: new Request("http://localhost"),
    } as any);

    expect(actual.template).toBeDefined();
    expect(actual.template.id).toEqual(templateId);
    expect(actual.template.name).toEqual("Test Template");
  });

  test("given: template from different organization, should: throw 404", async () => {
    const otherOrg = await db.organization.create({
      data: {
        name: "Other Org",
        slug: "other-org",
      },
    });

    const context = await createTestContextProvider({
      params: {
        organizationSlug: "other-org",
        templateId,
      },
      request: new Request("http://localhost/builder/test"),
      pattern: "/organizations/:organizationSlug/builder/:templateId/api",
    });

    await expect(
      loader({
        params: { organizationSlug: "other-org", templateId },
        context,
        request: new Request("http://localhost"),
      } as any)
    ).rejects.toThrow();
  });
});
```

### Step 15.2: Test API Route Actions

**File**: `app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/builder.$templateId.api.test.ts` (add action tests)

```typescript
import { action } from "./builder.$templateId.api";

describe("builder.$templateId.api action", () => {
  // ... setup from above

  test("given: save intent with valid sections, should: update template in database", async () => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("sections", JSON.stringify([
      {
        id: "section-1",
        type: "header",
        order: 0,
        data: { name: "John Doe" },
        styles: {},
      },
    ]));
    formData.append("globalStyles", JSON.stringify({ fontSize: "14px" }));

    const context = await createTestContextProvider({
      params: { organizationSlug: "test-org", templateId },
      request: new Request("http://localhost", { method: "POST", body: formData }),
      pattern: "/organizations/:organizationSlug/builder/:templateId/api",
    });

    const actual = await action({
      params: { organizationSlug: "test-org", templateId },
      context,
      request: new Request("http://localhost", { method: "POST", body: formData }),
    } as any);

    expect(actual.success).toEqual(true);

    const updated = await db.template.findUnique({ where: { id: templateId } });
    expect(updated?.sections).toHaveLength(1);
    expect((updated?.globalStyles as any).fontSize).toEqual("14px");
  });

  test("given: preview intent, should: return PDF buffer", async () => {
    const formData = new FormData();
    formData.append("intent", "preview");
    formData.append("sections", JSON.stringify([]));
    formData.append("globalStyles", JSON.stringify({}));
    formData.append("templateType", "resume");

    const context = await createTestContextProvider({
      params: { organizationSlug: "test-org", templateId },
      request: new Request("http://localhost", { method: "POST", body: formData }),
      pattern: "/organizations/:organizationSlug/builder/:templateId/api",
    });

    const actual = await action({
      params: { organizationSlug: "test-org", templateId },
      context,
      request: new Request("http://localhost", { method: "POST", body: formData }),
    } as any);

    expect(actual).toBeInstanceOf(Response);
    expect(actual.headers.get("Content-Type")).toEqual("application/pdf");
  });

  test("given: invalid intent, should: throw 400", async () => {
    const formData = new FormData();
    formData.append("intent", "invalid-intent");

    const context = await createTestContextProvider({
      params: { organizationSlug: "test-org", templateId },
      request: new Request("http://localhost", { method: "POST", body: formData }),
      pattern: "/organizations/:organizationSlug/builder/:templateId/api",
    });

    await expect(
      action({
        params: { organizationSlug: "test-org", templateId },
        context,
        request: new Request("http://localhost", { method: "POST", body: formData }),
      } as any)
    ).rejects.toThrow();
  });
});
```

---

## Phase 16: Component Tests

Component tests verify React components render and behave correctly.

### Step 16.1: Test Section Renderer

**File**: `app/features/builder/components/section-renderer.test.tsx`

```typescript
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionRenderer } from "./section-renderer";
import type { TemplateSection } from "../types";

describe("SectionRenderer", () => {
  test("given: header section with data, should: render header content", () => {
    const section: TemplateSection = {
      id: "header-1",
      type: "header",
      order: 0,
      data: {
        name: "John Doe",
        title: "Software Engineer",
        email: "john@example.com",
      },
      styles: {
        padding: "2rem",
      },
    };

    render(
      <SectionRenderer
        section={section}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Software Engineer")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
  });

  test("given: selected section, should: apply selected styling", () => {
    const section: TemplateSection = {
      id: "header-1",
      type: "header",
      order: 0,
      data: {},
      styles: {},
    };

    const { container } = render(
      <SectionRenderer
        section={section}
        isSelected={true}
        onSelect={() => {}}
      />
    );

    expect(container.querySelector(".ring-2")).toBeDefined();
  });

  test("given: experience section with entries, should: render experience entries", () => {
    const section: TemplateSection = {
      id: "exp-1",
      type: "experience",
      order: 0,
      data: {
        entries: [
          {
            company: "Tech Corp",
            position: "Developer",
            startDate: "2020",
            endDate: "2023",
            description: "Built apps",
          },
        ],
      },
      styles: {},
    };

    render(
      <SectionRenderer
        section={section}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("Work Experience")).toBeDefined();
    expect(screen.getByText("Tech Corp")).toBeDefined();
    expect(screen.getByText("Developer")).toBeDefined();
  });
});
```

### Step 16.2: Test Properties Panel

**File**: `app/features/builder/components/properties-panel.test.tsx`

```typescript
import { describe, expect, test, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertiesPanel } from "./properties-panel";
import { useBuilderStore } from "../store/builder-store";
import type { Template } from "../types";

describe("PropertiesPanel", () => {
  beforeEach(() => {
    const template: Template = {
      id: "template-1",
      name: "Test",
      type: "resume",
      organizationId: "org-1",
      sections: [
        {
          id: "section-1",
          type: "header",
          order: 0,
          data: { name: "John Doe" },
          styles: { padding: "1rem" },
        },
      ],
      globalStyles: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    useBuilderStore.setState({
      currentTemplate: template,
      selectedSectionId: "section-1",
    });
  });

  test("given: selected section, should: display section properties", () => {
    render(<PropertiesPanel />);

    expect(screen.getByText("Properties")).toBeDefined();
    expect(screen.getByLabelText("Name")).toBeDefined();
  });

  test("given: no selected section, should: display placeholder message", () => {
    useBuilderStore.setState({ selectedSectionId: null });

    render(<PropertiesPanel />);

    expect(screen.getByText("Select a section to edit properties")).toBeDefined();
  });

  test("given: user updates input field, should: update section data", async () => {
    const user = userEvent.setup();
    render(<PropertiesPanel />);

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Smith");

    const updatedSection = useBuilderStore
      .getState()
      .currentTemplate?.sections.find((s) => s.id === "section-1");

    expect(updatedSection?.data.name).toEqual("Jane Smith");
  });
});
```

---

## Phase 17: E2E Tests

E2E tests verify complete user flows using Playwright.

### Step 17.1: Test Template Customization Flow

**File**: `playwright/builder-customization.e2e.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Template Builder - Customization Flow", () => {
  test("given: user selects template and customizes it, should: save and export successfully", async ({
    page,
  }) => {
    // Navigate to builder
    await page.goto("/organizations/test-org/builder");

    // Wait for templates to load
    await page.waitForSelector("text=Template Builder");

    // Click on first resume template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    await firstTemplate.locator("text=Customize").click();

    // Wait for editor to load
    await page.waitForSelector("text=Untitled");

    // Add a new section from palette
    const addButton = page.locator("text=Skills");
    await addButton.click();

    // Verify section appears in canvas
    await expect(page.locator("text=Skills")).toBeVisible();

    // Select the header section
    await page.locator("text=John Doe").click();

    // Update header name in properties panel
    const nameInput = page.locator('input[aria-label="Name"]');
    await nameInput.clear();
    await nameInput.fill("Jane Smith");

    // Verify update in canvas
    await expect(page.locator("text=Jane Smith")).toBeVisible();

    // Click preview
    await page.locator("text=Preview").click();
    await page.locator("text=Generate Preview").click();

    // Wait for PDF to generate
    await page.waitForSelector("iframe", { timeout: 10000 });

    // Close preview
    await page.locator('[aria-label="Close"]').click();

    // Export PDF
    await page.locator("text=Export PDF").click();

    // Verify download started (check for download or success message)
    // This depends on your implementation
  });
});

test.describe("Template Builder - Create New Flow", () => {
  test("given: user creates new template, should: redirect to editor with empty template", async ({
    page,
  }) => {
    await page.goto("/organizations/test-org/builder");

    // Click Create New
    await page.locator("text=Create New").click();

    // Should redirect to editor
    await expect(page).toHaveURL(/\/builder\/[^/]+$/);

    // Canvas should be empty
    await expect(page.locator("text=No template selected")).toBeVisible();
  });
});
```

### Step 17.2: Test Template Export Flow

**File**: `playwright/builder-export.e2e.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Template Builder - Export Flow", () => {
  test("given: user exports template, should: download PDF file", async ({
    page,
  }) => {
    await page.goto("/organizations/test-org/builder/test-template-id");

    // Wait for editor to load
    await page.waitForSelector("text=Untitled");

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export
    await page.locator("text=Export PDF").click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain(".pdf");
    expect(download.url()).toBeTruthy();
  });
});
```

---

## Testing Best Practices

### Test Organization

1. **Colocate tests**: Place test files next to implementation files
   - `builder-store.ts` → `builder-store.test.ts`
   - `html-generator.server.ts` → `html-generator.server.test.ts`

2. **Test structure**: Follow the project's pattern
   ```typescript
   describe("component-name", () => {
     test("given: ... should: ...", () => {
       // Arrange
       // Act
       const actual = ...
       const expected = ...
       // Assert
       expect(actual).toEqual(expected);
     });
   });
   ```

3. **Test isolation**: Each test should be independent
   - Use `beforeEach`/`afterEach` for setup/teardown
   - Don't rely on test execution order
   - Clean up database records after tests

### When to Write Tests

- **Unit tests**: Write alongside implementation (TDD or immediately after)
- **Integration tests**: Write after API routes are complete
- **Component tests**: Write after components are built
- **E2E tests**: Write after full feature is complete

### Running Tests

```bash
# Unit and integration tests
bun run test

# Watch mode
bun run test:watch

# E2E tests
bun run test:e2e

# E2E tests with UI
bun run test:e2e:ui
```

---

## Implementation Checklist

- [ ] Phase 1: Install dependencies and create type definitions
- [ ] Phase 2: Set up Zustand store for state management
- [ ] Phase 3: Create component library definitions
- [ ] Phase 4: Create template seed system (predefined templates)
- [ ] Phase 5: Implement canvas with drag-and-drop
- [ ] Phase 6: Build component palette and properties panel
- [ ] Phase 7: Create main builder editor route
- [ ] Phase 8: Add database schema and run migration
- [ ] Phase 9: Create API routes for save/load/export
- [ ] Phase 10: Implement HTML generation utilities
- [ ] Phase 11: Set up Puppeteer PDF generation
- [ ] Phase 12: Create preview modal and export button
- [ ] Phase 13: Add drop zones for component palette
- [ ] Phase 14: Write unit tests for utilities and store
- [ ] Phase 15: Write integration tests for API routes
- [ ] Phase 16: Write component tests for React components
- [ ] Phase 17: Write E2E tests for complete user flows

---

## Key Considerations

### Performance
- Reuse Puppeteer browser instance across requests
- Consider browser pooling for high-traffic scenarios
- Implement debounced auto-save

### Error Handling
- Handle Puppeteer launch failures gracefully
- Validate template data before saving
- Provide user feedback for export errors

### Security
- Validate HTML content to prevent XSS
- Sanitize user input in template data
- Ensure proper authentication/authorization

### Future Enhancements
- Undo/Redo functionality
- Template versioning
- Collaborative editing
- Template marketplace/sharing
- Advanced styling (hover effects, animations)
- Responsive preview modes

---

## Data Transformation Flow

### Canvas → HTML/CSS

1. **User edits on canvas**: React components render from `TemplateSection[]` data
2. **State updates**: Zustand store updates the data structure
3. **Export triggered**: JSON data sent to server API
4. **Server receives**: Same JSON structure
5. **HTML generation**: Server converts JSON → HTML strings with inline CSS
6. **Puppeteer renders**: HTML → PDF buffer → Sent to client

### Key Principle

The same data structure (`TemplateSection[]`) drives both:
- **Canvas rendering** (React components)
- **HTML generation** (Server-side string concatenation)

This ensures consistency between what users see and what gets exported.

---

## Deployment Notes

- Ensure Puppeteer dependencies are installed in production
- Set up proper browser instance cleanup on server shutdown
- Monitor memory usage (Puppeteer can be memory-intensive)
- Consider queue system for PDF generation if high volume

