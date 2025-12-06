# Jobs and Clients Dashboard - Implementation Guide

This document outlines the implementation approach for the Jobs and Clients dashboard features. The current codebase contains only the UI components; this guide details how to implement the backend logic, database schema, and data flow for a production-ready system.

## Overview

The Jobs and Clients dashboard consists of four main features:

1. **Urgent Funnel Updates** - Displays time-sensitive candidate actions (pending offers, scheduled interviews, responses needed)
2. **Daily Agenda** - Manages daily tasks and agenda items with completion tracking
3. **Calendar View** - Shows calendar events and interviews with date navigation
4. **AI Assistant** - Interactive chat interface with contextual actions for recruiting tasks

## Database Schema

### Core Models

```prisma
// Job/Position model
model Job {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  title             String
  description       String?
  status            JobStatus @default(open)
  location          String?
  salaryRange       String?
  employmentType    EmploymentType
  stages            JobStage[]
  candidates        Candidate[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status])
}

enum JobStatus {
  open
  closed
  draft
  archived
}

enum EmploymentType {
  full_time
  part_time
  contract
  internship
}

// Job pipeline stages
model JobStage {
  id          String   @id @default(cuid(2))
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  name        String
  order       Int
  candidates  Candidate[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([jobId, order])
  @@index([jobId])
}

// Candidate model
model Candidate {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobId             String?
  job               Job?     @relation(fields: [jobId], references: [id], onDelete: SetNull)
  stageId           String?
  stage             JobStage? @relation(fields: [stageId], references: [id], onDelete: SetNull)
  firstName         String
  lastName          String
  email             String
  phone             String?
  resumeUrl         String?
  linkedInUrl       String?
  portfolioUrl      String?
  notes             String?
  source            String? // Where they came from (referral, job board, etc.)
  status            CandidateStatus @default(applied)
  offers            Offer[]
  interviews        Interview[]
  agendaItems       AgendaItem[]
  aiConversations   AIConversation[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status])
  @@index([jobId, stageId])
  @@index([organizationId, createdAt])
}

enum CandidateStatus {
  applied
  screening
  interview
  offer
  hired
  rejected
  withdrawn
}

// Offer model for tracking pending offers
model Offer {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  candidateId       String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  jobId             String
  job               Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  salary            Decimal?
  startDate         DateTime?
  deadline          DateTime
  status            OfferStatus @default(pending)
  sentAt            DateTime?
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  notes             String?

  @@index([candidateId, status])
  @@index([deadline, status])
}

enum OfferStatus {
  pending
  accepted
  rejected
  expired
  withdrawn
}

// Interview model
model Interview {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  candidateId       String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  jobId             String
  job               Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  scheduledAt       DateTime
  duration          Int      @default(60) // minutes
  type              InterviewType
  location          String?  // "Zoom", "Office", "Phone", etc.
  meetingUrl        String?
  interviewerIds    String[] // Array of UserAccount IDs
  status            InterviewStatus @default(scheduled)
  notes             String?
  feedback          String?

  @@index([candidateId, scheduledAt])
  @@index([scheduledAt, status])
  @@index([organizationId, scheduledAt])
}

enum InterviewType {
  phone_screen
  technical
  behavioral
  final
  panel
}

enum InterviewStatus {
  scheduled
  completed
  cancelled
  rescheduled
  no_show
}

// Daily Agenda model
model AgendaItem {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId            String?  // If assigned to specific user
  user              UserAccount? @relation(fields: [userId], references: [id], onDelete: SetNull)
  candidateId       String?  // If related to a candidate
  candidate         Candidate? @relation(fields: [candidateId], references: [id], onDelete: SetNull)
  jobId             String?  // If related to a job
  job               Job?     @relation(fields: [jobId], references: [id], onDelete: SetNull)
  title             String
  description       String?
  dueDate           DateTime
  completed         Boolean  @default(false)
  completedAt       DateTime?
  priority          Priority @default(medium)
  tags              String[] // For categorization

  @@index([organizationId, dueDate, completed])
  @@index([userId, dueDate, completed])
}

enum Priority {
  low
  medium
  high
  urgent
}

// Calendar Event model (for general events, not just interviews)
model CalendarEvent {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId            String?  // Event creator/owner
  user              UserAccount? @relation(fields: [userId], references: [id], onDelete: SetNull)
  title             String
  description       String?
  startTime         DateTime
  endTime           DateTime
  type              CalendarEventType
  interviewId       String?  // If linked to an interview
  interview         Interview? @relation(fields: [interviewId], references: [id], onDelete: SetNull)
  location          String?
  meetingUrl        String?
  attendees         String[] // Array of UserAccount IDs
  isAllDay          Boolean  @default(false)
  recurrenceRule    String?  // iCal RRULE format for recurring events

  @@index([organizationId, startTime])
  @@index([userId, startTime])
  @@index([startTime, endTime])
}

enum CalendarEventType {
  interview
  meeting
  reminder
  other
}

// AI Assistant Conversation model
model AIConversation {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId            String
  user              UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
  title             String?  // Auto-generated from first message
  context           Json?     // Contextual data (selected candidate, job, etc.)
  messages          AIMessage[]
  isArchived        Boolean  @default(false)
  archivedAt        DateTime?

  @@index([organizationId, userId, createdAt])
  @@index([organizationId, isArchived])
}

// AI Message model
model AIMessage {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  conversationId    String
  conversation      AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role              MessageRole
  content           String
  metadata          Json?    // For storing function calls, tool usage, etc.
  tokensUsed        Int?     // For cost tracking

  @@index([conversationId, createdAt])
}

enum MessageRole {
  user
  assistant
  system
}

// Add relations to existing Organization model
model Organization {
  // ... existing fields ...
  jobs              Job[]
  candidates        Candidate[]
  agendaItems       AgendaItem[]
  calendarEvents    CalendarEvent[]
  aiConversations   AIConversation[]
}

// Add relation to existing UserAccount model
model UserAccount {
  // ... existing fields ...
  agendaItems       AgendaItem[]
  calendarEvents    CalendarEvent[]
  aiConversations   AIConversation[]
}
```

## Data Flow Architecture

### 1. Urgent Funnel Updates

**Data Flow:**
```
Database → Server Loader → Component Props → UI Rendering
```

**Server Implementation:**

```typescript
// app/features/jobs-and-clients/jobs-and-clients-model.server.ts

export async function getUrgentFunnelUpdates({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const endOfDay = endOfDay(now);

  // Get pending offers with deadlines
  const pendingOffers = await db.offer.findMany({
    where: {
      candidate: {
        organizationId,
      },
      status: "pending",
      deadline: {
        lte: tomorrow, // Urgent if deadline is today or tomorrow
      },
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      deadline: "asc",
    },
  });

  // Get scheduled interviews in next 48 hours
  const upcomingInterviews = await db.interview.findMany({
    where: {
      candidate: {
        organizationId,
      },
      status: "scheduled",
      scheduledAt: {
        gte: now,
        lte: addHours(now, 48),
      },
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  // Get candidates awaiting response (no activity in 3+ days)
  const responseNeeded = await db.candidate.findMany({
    where: {
      organizationId,
      status: {
        in: ["applied", "screening", "interview"],
      },
      updatedAt: {
        lte: subDays(now, 3),
      },
      // Exclude if they have a recent interview or offer
      interviews: {
        none: {
          scheduledAt: {
            gte: subDays(now, 3),
          },
        },
      },
      offers: {
        none: {
          status: "pending",
        },
      },
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      stage: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "asc",
    },
    take: 10, // Limit to most urgent
  });

  // Transform to UI format
  const updates: UrgentFunnelUpdate[] = [
    ...pendingOffers.map((offer) => ({
      id: offer.id,
      candidateName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
      role: offer.job.title,
      type: "offer_pending" as const,
      deadline: formatDistanceToNow(offer.deadline, { addSuffix: true }),
      isHigh: isBefore(offer.deadline, endOfDay), // High if deadline is today
    })),
    ...upcomingInterviews.map((interview) => ({
      id: interview.id,
      candidateName: `${interview.candidate.firstName} ${interview.candidate.lastName}`,
      role: interview.job.title,
      type: "interview_scheduled" as const,
      deadline: formatDistanceToNow(interview.scheduledAt, { addSuffix: true }),
      isHigh: isBefore(interview.scheduledAt, addHours(now, 24)), // High if within 24 hours
    })),
    ...responseNeeded.map((candidate) => ({
      id: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      role: candidate.job?.title || "Unknown Role",
      type: "response_needed" as const,
      deadline: formatDistanceToNow(candidate.updatedAt, { addSuffix: true }),
      isHigh: differenceInDays(now, candidate.updatedAt) >= 7, // High if 7+ days
    })),
  ];

  // Sort by urgency (high priority first, then by deadline)
  return updates.sort((a, b) => {
    if (a.isHigh !== b.isHigh) return a.isHigh ? -1 : 1;
    return 0; // Could add deadline sorting here
  });
}

// Action to send reminder
export async function sendReminderForUpdate({
  updateId,
  updateType,
  userId,
  organizationId,
}: {
  updateId: string;
  updateType: "offer_pending" | "interview_scheduled" | "response_needed";
  userId: string;
  organizationId: string;
}) {
  // Verify user has permission
  await verifyUserHasAccess({ userId, organizationId });

  switch (updateType) {
    case "offer_pending":
      // Send email reminder to candidate
      const offer = await db.offer.findUnique({
        where: { id: updateId },
        include: { candidate: true, job: true },
      });
      if (offer) {
        await sendEmail({
          to: offer.candidate.email,
          template: "offer_reminder",
          data: {
            candidateName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
            jobTitle: offer.job.title,
            deadline: offer.deadline,
          },
        });
        // Log the action
        await createActivityLog({
          organizationId,
          userId,
          type: "reminder_sent",
          entityType: "offer",
          entityId: offer.id,
        });
      }
      break;
    case "interview_scheduled":
      // Send interview reminder
      const interview = await db.interview.findUnique({
        where: { id: updateId },
        include: { candidate: true, job: true },
      });
      if (interview) {
        await sendInterviewReminder(interview);
      }
      break;
    case "response_needed":
      // Create a follow-up task or send internal notification
      await createAgendaItem({
        organizationId,
        userId,
        title: `Follow up with ${updateId}`,
        dueDate: addDays(new Date(), 1),
        priority: "high",
        candidateId: updateId,
      });
      break;
  }
}
```

**Loader Integration:**

```typescript
// app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/jobs-and-clients.tsx

export async function loader({ params, context }: Route.LoaderArgs) {
  const { userId, organizationId } = await requireUser(context);
  
  const urgentFunnelUpdates = await getUrgentFunnelUpdates({
    organizationId,
    userId,
  });

  return {
    urgentFunnelUpdates,
    // ... other data
  };
}
```

### 2. Daily Agenda

**Data Flow:**
```
Database → Server Loader → Component Props → Local State → UI Rendering
```

**Server Implementation:**

```typescript
// app/features/jobs-and-clients/agenda-model.server.ts

export async function getDailyAgenda({
  organizationId,
  userId,
  date,
}: {
  organizationId: string;
  userId: string;
  date: Date;
}) {
  const startOfDay = startOfDay(date);
  const endOfDay = endOfDay(date);

  const items = await db.agendaItem.findMany({
    where: {
      organizationId,
      userId, // User-specific agenda
      dueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { priority: "desc" }, // Urgent first
      { dueDate: "asc" },
    ],
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    completed: item.completed,
    dueDate: item.dueDate,
    priority: item.priority,
    candidate: item.candidate,
    job: item.job,
  }));
}

// Action to toggle completion
export async function toggleAgendaItemCompletion({
  itemId,
  userId,
  organizationId,
  completed,
}: {
  itemId: string;
  userId: string;
  organizationId: string;
  completed: boolean;
}) {
  // Verify ownership/permission
  const item = await db.agendaItem.findFirst({
    where: {
      id: itemId,
      organizationId,
      userId,
    },
  });

  if (!item) {
    throw new Response("Not found", { status: 404 });
  }

  await db.agendaItem.update({
    where: { id: itemId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  return { success: true };
}
```

**Action Handler:**

```typescript
// app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/jobs-and-clients.tsx

export async function action({ request, params, context }: Route.ActionArgs) {
  const { userId, organizationId } = await requireUser(context);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggleAgendaItem") {
    const itemId = formData.get("itemId") as string;
    const completed = formData.get("completed") === "true";

    await toggleAgendaItemCompletion({
      itemId,
      userId,
      organizationId,
      completed,
    });

    return json({ success: true });
  }

  // ... other actions
}
```

### 3. Calendar View

**Data Flow:**
```
Database → Server Loader (with date filter) → Component Props → Local State → UI Rendering
```

**Server Implementation:**

```typescript
// app/features/jobs-and-clients/calendar-model.server.ts

export async function getCalendarEvents({
  organizationId,
  userId,
  startDate,
  endDate,
}: {
  organizationId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  // Get user's calendar events and organization-wide events
  const events = await db.calendarEvent.findMany({
    where: {
      organizationId,
      OR: [
        { userId }, // User's personal events
        { attendees: { has: userId } }, // Events user is invited to
        { type: "interview" }, // All interviews in org
      ],
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      interview: {
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    date: format(event.startTime, "yyyy-MM-dd"),
    startTime: format(event.startTime, "h:mm a"),
    endTime: format(event.endTime, "h:mm a"),
    type: event.type,
    interview: event.interview,
    location: event.location,
    meetingUrl: event.meetingUrl,
  }));
}
```

### 4. AI Assistant

**Data Flow:**
```
Database → Server Loader → Component Props → Local State → API Calls → Database Updates → UI Updates
```

**Server Implementation:**

```typescript
// app/features/jobs-and-clients/ai-assistant-model.server.ts

export async function getAIConversation({
  organizationId,
  userId,
  conversationId,
}: {
  organizationId: string;
  userId: string;
  conversationId?: string;
}) {
  if (conversationId) {
    // Get existing conversation
    const conversation = await db.aIConversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      throw new Response("Not found", { status: 404 });
    }

    return conversation;
  }

  // Get or create active conversation
  let conversation = await db.aIConversation.findFirst({
    where: {
      organizationId,
      userId,
      isArchived: false,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 50, // Last 50 messages
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!conversation) {
    conversation = await db.aIConversation.create({
      data: {
        organizationId,
        userId,
        messages: {
          create: {
            role: "assistant",
            content: "Hello! I'm your AI Assistant. How can I help you today?",
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  return conversation;
}

// Action to send message
export async function sendAIMessage({
  organizationId,
  userId,
  conversationId,
  content,
  context,
}: {
  organizationId: string;
  userId: string;
  conversationId: string;
  content: string;
  context?: {
    candidateId?: string;
    jobId?: string;
    action?: string;
  };
}) {
  // Save user message
  const userMessage = await db.aIMessage.create({
    data: {
      conversationId,
      role: "user",
      content,
    },
  });

  // Get conversation context
  const conversation = await db.aIConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20, // Last 20 messages for context
      },
    },
  });

  if (!conversation) {
    throw new Response("Conversation not found", { status: 404 });
  }

  // Call AI service (OpenAI, Anthropic, etc.)
  const aiResponse = await callAIService({
    messages: [
      ...conversation.messages.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content },
    ],
    context: {
      organizationId,
      userId,
      ...context,
    },
    tools: getAITools(), // Function calling for contextual actions
  });

  // Save assistant response
  const assistantMessage = await db.aIMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: aiResponse.content,
      metadata: aiResponse.metadata,
      tokensUsed: aiResponse.tokensUsed,
    },
  });

  // Update conversation
  await db.aIConversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      context: context ? { ...conversation.context, ...context } : conversation.context,
    },
  });

  return {
    userMessage,
    assistantMessage,
  };
}

// AI Service integration
async function callAIService({
  messages,
  context,
  tools,
}: {
  messages: Array<{ role: string; content: string }>;
  context: Record<string, unknown>;
  tools: Array<AITool>;
}) {
  // Example using OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant for a recruiting platform. Help users with candidate management, scheduling, and pipeline tasks.`,
      },
      ...messages,
    ],
    tools: tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
    tool_choice: "auto",
  });

  const message = response.choices[0]?.message;

  return {
    content: message?.content || "",
    metadata: {
      toolCalls: message?.tool_calls,
      finishReason: response.choices[0]?.finish_reason,
    },
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

// AI Tools for contextual actions
function getAITools(): Array<AITool> {
  return [
    {
      name: "schedule_interview",
      description: "Schedule an interview with a candidate",
      parameters: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
          jobId: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          type: { type: "string", enum: ["phone_screen", "technical", "behavioral", "final"] },
        },
        required: ["candidateId", "jobId", "scheduledAt"],
      },
    },
    {
      name: "summarize_candidate",
      description: "Get a summary of a candidate's profile and status",
      parameters: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
        },
        required: ["candidateId"],
      },
    },
    {
      name: "move_candidate_stage",
      description: "Move a candidate to the next stage in the pipeline",
      parameters: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
          stageId: { type: "string" },
        },
        required: ["candidateId", "stageId"],
      },
    },
    {
      name: "send_to_marketplace",
      description: "Share a candidate profile to the marketplace",
      parameters: {
        type: "object",
        properties: {
          candidateId: { type: "string" },
        },
        required: ["candidateId"],
      },
    },
  ];
}
```

**Action Handler:**

```typescript
// app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/jobs-and-clients.tsx

export async function action({ request, params, context }: Route.ActionArgs) {
  const { userId, organizationId } = await requireUser(context);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sendAIMessage") {
    const conversationId = formData.get("conversationId") as string;
    const content = formData.get("content") as string;
    const candidateId = formData.get("candidateId") as string | null;
    const jobId = formData.get("jobId") as string | null;

    const result = await sendAIMessage({
      organizationId,
      userId,
      conversationId,
      content,
      context: {
        candidateId: candidateId || undefined,
        jobId: jobId || undefined,
      },
    });

    return json({
      success: true,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
    });
  }

  if (intent === "executeAIAction") {
    const actionType = formData.get("actionType") as string;
    const candidateId = formData.get("candidateId") as string;
    const jobId = formData.get("jobId") as string;

    // Execute the contextual action
    switch (actionType) {
      case "schedule_interview":
        // Handle interview scheduling
        break;
      case "summarize_candidate":
        // Return candidate summary
        break;
      // ... other actions
    }

    return json({ success: true });
  }
}
```

## Real-time Updates

For production, implement real-time updates using:

1. **Server-Sent Events (SSE)** for urgent updates
2. **WebSockets** for collaborative features
3. **Polling** as fallback for calendar and agenda updates

```typescript
// app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/jobs-and-clients.stream.tsx

export async function loader({ request, params, context }: Route.LoaderArgs) {
  return eventStream(request.signal, (send) => {
    const interval = setInterval(async () => {
      const updates = await getUrgentFunnelUpdates({
        organizationId: params.organizationSlug,
        userId: context.userId,
      });

      send({ data: JSON.stringify({ type: "updates", data: updates }) });
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
    };
  });
}
```

## Security & Permissions

1. **Organization-level access control**: All queries filter by `organizationId`
2. **User permissions**: Verify user membership in organization
3. **Role-based access**: Different permissions for owners, admins, members
4. **Data isolation**: Ensure users can only see data from their organization

```typescript
async function verifyUserHasAccess({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const membership = await db.organizationMembership.findUnique({
    where: {
      memberId_organizationId: {
        memberId: userId,
        organizationId,
      },
      deactivatedAt: null,
    },
  });

  if (!membership) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return membership;
}
```

## Performance Considerations

1. **Database Indexing**: All foreign keys and frequently queried fields are indexed
2. **Pagination**: Implement pagination for large datasets (candidates, events)
3. **Caching**: Cache frequently accessed data (organization settings, user preferences)
4. **Query Optimization**: Use `select` to limit fields, avoid N+1 queries with `include`
5. **Background Jobs**: Use queues for email sending, AI processing, and notifications

## Testing Strategy

1. **Unit Tests**: Test individual model functions and transformations
2. **Integration Tests**: Test database queries and data flow
3. **E2E Tests**: Test complete user workflows
4. **Mock External Services**: Mock AI service, email service for testing

## Migration Path

1. Create database migrations for new models
2. Seed initial data for development
3. Implement gradual rollout with feature flags
4. Monitor performance and adjust queries as needed

