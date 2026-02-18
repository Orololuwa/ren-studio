# Workflow Feature Documentation

## Overview

The Workflow feature enables organizations to create automated document workflows that automatically generate and send documents based on triggers, conditions, and user responses. Users can build visual workflows connecting different document types (Quote, Estimate, Purchase Order, Sales Order, Order Confirmation, Invoice, Payment, Receipt) with conditional logic, wait periods, and response handling. Workflows can be exported to n8n format for integration with external automation platforms.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [User Flows](#user-flows)
4. [Workflow Components](#workflow-components)
5. [Workflow Execution](#workflow-execution)
6. [n8n Integration](#n8n-integration)
7. [UI/UX Specifications](#uiux-specifications)
8. [Implementation Phases](#implementation-phases)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Organization Dashboard                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Workflow Management                            │   │
│  │  - List workflows                                     │   │
│  │  - Create new workflow                                │   │
│  │  - Edit workflow                                      │   │
│  │  - View execution history                             │   │
│  │  - Export to n8n                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Visual Workflow Builder                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Trigger    │  │   Document    │  │  Condition   │    │
│  │   Nodes      │  │   Nodes       │  │   Nodes      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │   Wait       │  │   Action      │                      │
│  │   Nodes      │  │   Nodes       │                      │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Workflow Execution Engine                       │
│  - Process workflow definitions                             │
│  - Execute nodes in sequence                                │
│  - Handle conditions and branching                          │
│  - Manage wait states and responses                         │
│  - Track execution status                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Document Generation & Delivery                  │
│  - Load templates from database                             │
│  - Merge context data into templates                        │
│  - Generate PDF documents                                   │
│  - Send emails with attachments                             │
│  - Store execution records                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Response Handling                               │
│  - Webhook endpoints for external triggers                  │
│  - Response collection forms                                │
│  - Resume workflow execution                                │
│  - Update workflow context                                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Workflow Builder**: Visual drag-and-drop interface for creating workflows
2. **Workflow Storage**: Database models for workflow definitions and execution history
3. **Execution Engine**: Server-side engine that processes workflows and executes nodes
4. **Document Integration**: Seamless integration with existing template system
5. **Response System**: Mechanism for collecting user responses and continuing workflows
6. **n8n Export**: Export functionality to convert workflows to n8n format

---

## Database Schema

### Workflow Model

Stores workflow definitions created by users. Each workflow contains a JSON structure representing the visual workflow (nodes and connections).

**Key Fields:**
- `id`: Unique identifier
- `organizationId`: Organization that owns the workflow
- `name`: User-friendly name for the workflow
- `description`: Optional description of what the workflow does
- `isActive`: Whether the workflow is currently active and can be executed
- `workflowData`: JSON structure containing nodes, edges, and configuration
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one Organization
- Has many WorkflowExecutions

### WorkflowExecution Model

Tracks individual instances of workflow execution. Created when a workflow is triggered.

**Key Fields:**
- `id`: Unique identifier
- `workflowId`: Reference to the workflow definition
- `status`: Current execution status (running, completed, failed, paused, canceled)
- `currentStepId`: Reference to the current step being executed
- `contextData`: JSON object containing data passed through the workflow
- `createdAt` / `updatedAt`: Timestamps

**Relations:**
- Belongs to one Workflow
- Has many WorkflowSteps

### WorkflowStep Model

Represents individual step execution within a workflow instance. Each node execution creates a step record.

**Key Fields:**
- `id`: Unique identifier
- `executionId`: Reference to the workflow execution
- `stepId`: Reference to the node ID in the workflow definition
- `documentType`: Type of document if this step generates a document
- `templateId`: Template ID used for document generation
- `status`: Step status (pending, waiting_for_response, completed, failed, skipped)
- `responseData`: JSON object containing user response or trigger data
- `documentGenerated`: Reference to generated document (if applicable)
- `executedAt`: Timestamp when step was completed

**Relations:**
- Belongs to one WorkflowExecution

### Enums

**WorkflowExecutionStatus:**
- `running`: Workflow is currently executing
- `completed`: Workflow finished successfully
- `failed`: Workflow encountered an error and stopped
- `paused`: Workflow is paused waiting for manual intervention
- `canceled`: Workflow was manually canceled

**WorkflowStepStatus:**
- `pending`: Step is queued but not yet executed
- `waiting_for_response`: Step is waiting for user input or external response
- `completed`: Step finished successfully
- `failed`: Step encountered an error
- `skipped`: Step was skipped due to condition evaluation

---

## User Flows

### Creating a Workflow

1. **Access Workflow Builder**
   - User navigates to Workflows section in organization dashboard
   - Clicks "Create New Workflow" button

2. **Design Workflow**
   - Visual canvas appears with node palette
   - User drags nodes onto canvas:
     - Trigger node (defines how workflow starts)
     - Document nodes (specify which template to use)
     - Condition nodes (add branching logic)
     - Wait nodes (pause for time or response)
     - Action nodes (custom actions)
   - User connects nodes by drawing edges between them
   - User configures each node with required settings

3. **Configure Nodes**
   - **Trigger Node**: Select trigger type (manual, webhook, schedule, document_created)
   - **Document Node**: Select document type, choose template, set recipient email, subject, and body
   - **Condition Node**: Define condition (field, operator, value)
   - **Wait Node**: Set wait type (time duration, response field, webhook)
   - **Action Node**: Define custom action (API call, data transformation, etc.)

4. **Save Workflow**
   - User provides workflow name and optional description
   - Workflow is saved to database
   - Workflow appears in workflow list

### Executing a Workflow

1. **Trigger Workflow**
   - Manual trigger: User clicks "Run" button on workflow
   - Webhook trigger: External system calls webhook endpoint
   - Schedule trigger: System automatically triggers at scheduled time
   - Document trigger: Workflow starts when a document of specified type is created

2. **Execution Begins**
   - System creates WorkflowExecution record
   - Execution engine starts processing from trigger node
   - Each node executes in sequence based on connections

3. **Document Generation**
   - When document node executes:
     - System loads specified template
     - Merges context data into template sections
     - Generates PDF
     - Sends email with PDF attachment (if recipient specified)
     - Creates WorkflowStep record with status "completed"

4. **Conditional Branching**
   - When condition node executes:
     - System evaluates condition against context data
     - Follows appropriate edge based on condition result
     - Continues execution down selected path

5. **Wait States**
   - When wait node executes:
     - If time-based: System pauses for specified duration
     - If response-based: System creates response endpoint and waits
     - If webhook-based: System creates webhook endpoint and waits
   - WorkflowStep status set to "waiting_for_response"
   - Execution pauses until condition is met

6. **Response Handling**
   - User or external system provides response
   - System updates WorkflowStep with response data
   - Execution resumes from wait node
   - Context data updated with response information

7. **Completion**
   - Workflow reaches end node or completes all paths
   - WorkflowExecution status set to "completed"
   - User can view execution history and results

### Viewing Execution History

1. **Access History**
   - User navigates to workflow detail page
   - Clicks "Execution History" tab

2. **View Executions**
   - List of all executions for the workflow
   - Shows status, start time, completion time
   - User can click to view detailed execution log

3. **Execution Details**
   - Timeline view of all steps executed
   - Shows step status, execution time, response data
   - Displays generated documents with download links
   - Shows any errors or failures

### Exporting to n8n

1. **Export Workflow**
   - User clicks "Export to n8n" button on workflow
   - System converts workflow definition to n8n format
   - JSON file is generated and downloaded

2. **Import to n8n**
   - User opens n8n interface
   - Imports downloaded JSON file
   - Workflow appears in n8n with all nodes and connections
   - User can further customize in n8n if needed

---

## Workflow Components

### Node Types

#### Trigger Node
Initiates workflow execution. Must be the starting point of every workflow.

**Trigger Types:**
- **Manual**: User manually starts the workflow
- **Webhook**: External system calls webhook URL to start workflow
- **Schedule**: Workflow runs on a schedule (daily, weekly, monthly, custom cron)
- **Document Created**: Workflow starts when a document of specified type is created

**Configuration:**
- Trigger type selection
- For webhook: URL path generation
- For schedule: Schedule configuration
- For document: Document type filter

#### Document Node
Generates and sends a document using a template.

**Configuration:**
- Document type selection (Quote, Invoice, Receipt, etc.)
- Template selection (from organization's templates)
- Recipient email address
- Email subject line
- Email body (HTML supported)
- From email address (defaults to organization email)

**Behavior:**
- Loads template from database
- Merges workflow context data into template
- Generates PDF
- Sends email with PDF attachment
- Stores reference to generated document

#### Condition Node
Adds branching logic to workflows based on data evaluation.

**Configuration:**
- Field to evaluate (from context data)
- Operator (equals, contains, greater than, less than, etc.)
- Value to compare against
- True/false paths

**Behavior:**
- Evaluates condition against current context data
- Follows appropriate edge based on result
- Updates context with condition result

#### Wait Node
Pauses workflow execution for a specified duration or until a response is received.

**Wait Types:**
- **Time**: Wait for specified duration (hours, days, weeks)
- **Response**: Wait for user response via form or API
- **Webhook**: Wait for external webhook call

**Configuration:**
- Wait type selection
- For time: Duration and unit
- For response: Response field name and form configuration
- For webhook: Webhook URL path

**Behavior:**
- Pauses execution
- Creates response endpoint if needed
- Updates step status to "waiting_for_response"
- Resumes execution when condition is met

#### Action Node
Performs custom actions like API calls, data transformations, or integrations.

**Configuration:**
- Action type selection
- API endpoint configuration
- Data transformation rules
- Integration settings

**Behavior:**
- Executes configured action
- Updates context data with results
- Continues to next node

### Edge Types

#### Standard Edge
Connects two nodes in sequence. Execution flows from source to target.

#### Conditional Edge
Connects from a condition node. Only followed if condition evaluates to specified value (true/false).

#### Parallel Edge
Allows multiple paths to execute simultaneously. Workflow continues when all parallel paths complete.

---

## Workflow Execution

### Execution Flow

1. **Initialization**
   - WorkflowExecution record created
   - Context data initialized with trigger data
   - Execution status set to "running"

2. **Node Processing**
   - Execution engine identifies next node to process
   - Creates WorkflowStep record with status "pending"
   - Executes node based on node type
   - Updates WorkflowStep with results

3. **Context Management**
   - Context data accumulates as workflow progresses
   - Each node can read from and write to context
   - Document data, responses, and action results added to context
   - Context passed to subsequent nodes

4. **Error Handling**
   - If node execution fails:
     - WorkflowStep status set to "failed"
     - Error details stored in step record
     - WorkflowExecution status set to "failed"
     - Execution stops
   - User can view error details and retry or fix workflow

5. **Completion**
   - When all paths complete or end node reached:
     - WorkflowExecution status set to "completed"
     - Final context data stored
     - Execution summary generated

### Context Data Structure

Context data is a JSON object that flows through the workflow. It contains:

- **Trigger Data**: Initial data from workflow trigger
- **Document Data**: Data merged into templates
- **Response Data**: User responses and webhook payloads
- **Action Results**: Results from action nodes
- **Condition Results**: Results from condition evaluations
- **Metadata**: Execution timestamps, step IDs, etc.

### Response Collection

When a wait node is configured for response:

1. **Response Endpoint Created**
   - Unique URL generated for this execution step
   - Endpoint accepts POST requests with response data

2. **User Notification**
   - Email sent to specified recipient with response link
   - Link includes execution ID and step ID
   - User clicks link to access response form

3. **Response Form**
   - Form displays fields configured in wait node
   - User fills form and submits
   - Response data added to context
   - Workflow execution resumes

4. **Webhook Response**
   - External system calls webhook URL
   - Payload data added to context
   - Workflow execution resumes

---

## n8n Integration

### Export Format

Workflows can be exported to n8n JSON format, which is the standard workflow format used by n8n automation platform.

### Export Process

1. **Node Mapping**
   - Each workflow node type maps to corresponding n8n node type
   - Trigger nodes → n8n webhook/trigger nodes
   - Document nodes → n8n HTTP request nodes (calling document API)
   - Condition nodes → n8n IF nodes
   - Wait nodes → n8n Wait or Webhook nodes
   - Action nodes → n8n Code or HTTP request nodes

2. **Connection Mapping**
   - Workflow edges map to n8n connections
   - Conditional edges map to true/false output connections
   - Standard edges map to main output connections

3. **Configuration Translation**
   - Node configurations translated to n8n parameter format
   - API endpoints configured to point to application's API
   - Authentication configured using API keys
   - Data mappings preserved

4. **Export File**
   - JSON file generated with n8n workflow structure
   - File includes all nodes, connections, and configurations
   - User downloads file for import into n8n

### Import Considerations

While the primary focus is export, the system could support importing n8n workflows in the future:

- Parse n8n JSON format
- Map n8n nodes to workflow nodes
- Validate node types and configurations
- Create workflow definition in database

### Use Cases for Export

- **Advanced Automation**: Users can export workflows to n8n for more complex automation needs
- **External Integration**: Connect workflows with external systems via n8n
- **Backup**: Export workflows as backup before modifications
- **Sharing**: Share workflows between organizations or with community
- **Migration**: Move workflows to n8n for self-hosted automation

---

## UI/UX Specifications

### Workflow List View

**Layout:**
- Table or card grid layout
- Shows workflow name, description, status (active/inactive)
- Last execution time and status
- Execution count
- Actions: Edit, Duplicate, Delete, Export, Run

**Filters:**
- Filter by status (active/inactive)
- Filter by last execution date
- Search by name or description

**Empty State:**
- Message: "No workflows yet"
- Call-to-action button: "Create Your First Workflow"

### Workflow Builder

**Canvas:**
- Drag-and-drop interface
- Zoom and pan controls
- Grid background for alignment
- Minimap for navigation

**Node Palette:**
- Collapsible sidebar with node types
- Icons and labels for each node type
- Drag nodes from palette to canvas

**Node Configuration:**
- Side panel opens when node selected
- Form fields for node-specific configuration
- Validation and error messages
- Save and cancel buttons

**Connections:**
- Click and drag from node output to node input
- Visual feedback during connection
- Delete connections by clicking and pressing delete

**Toolbar:**
- Save workflow button
- Run workflow button (test execution)
- Export to n8n button
- Undo/redo buttons
- Zoom controls
- View execution history button

### Execution History View

**Timeline:**
- Vertical timeline showing all executions
- Each execution shows:
  - Execution ID
  - Start time and duration
  - Status badge (running, completed, failed)
  - Number of steps executed

**Execution Details:**
- Expandable view for each execution
- Step-by-step breakdown:
  - Step name and type
  - Execution time
  - Status
  - Response data (if applicable)
  - Generated documents (with download links)
  - Errors (if any)

**Filters:**
- Filter by status
- Filter by date range
- Search by execution ID

### Response Collection Form

**Design:**
- Clean, branded form matching organization theme
- Fields configured in wait node
- Required field indicators
- Validation messages
- Submit button

**Success State:**
- Confirmation message
- "Thank you for your response"
- Option to close or return to organization

---

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)

**Database Schema:**
- Create Workflow, WorkflowExecution, and WorkflowStep models
- Add relations to Organization model
- Create database migrations
- Add indexes for performance

**Basic Execution Engine:**
- Implement workflow execution engine
- Support for trigger, document, and action nodes
- Basic context data management
- Error handling and logging

**API Endpoints:**
- Create workflow (POST)
- List workflows (GET)
- Get workflow (GET)
- Update workflow (PUT)
- Delete workflow (DELETE)
- Execute workflow (POST)
- Get execution history (GET)

### Phase 2: Visual Builder (Weeks 3-4)

**UI Components:**
- Integrate React Flow or similar library
- Create node palette component
- Create node configuration panel
- Implement canvas with drag-and-drop
- Add connection drawing functionality

**Node Types:**
- Implement all node type components
- Create configuration forms for each node type
- Add validation for node configurations
- Implement node rendering on canvas

**Workflow Management:**
- Save workflow functionality
- Load workflow functionality
- Workflow list view
- Workflow detail view

### Phase 3: Advanced Features (Weeks 5-6)

**Conditional Logic:**
- Implement condition node execution
- Add conditional edge support
- Context data evaluation
- Branching logic

**Wait States:**
- Implement time-based waits
- Implement response-based waits
- Create response collection endpoints
- Response form generation
- Webhook wait support

**Document Integration:**
- Deep integration with template system
- Template selection in document nodes
- Context data merging
- PDF generation and email sending

### Phase 4: n8n Export (Week 7)

**Export Functionality:**
- Implement n8n format conversion
- Node type mapping
- Connection mapping
- Configuration translation
- JSON file generation

**Testing:**
- Test exported workflows in n8n
- Verify all node types export correctly
- Test with complex workflows
- Document export process

### Phase 5: Polish & Optimization (Week 8)

**Performance:**
- Optimize execution engine
- Add caching where appropriate
- Optimize database queries
- Add execution limits and timeouts

**User Experience:**
- Improve error messages
- Add loading states
- Add success notifications
- Improve empty states
- Add help tooltips

**Documentation:**
- User guide for creating workflows
- API documentation
- Video tutorials
- Example workflows

**Testing:**
- End-to-end testing
- Load testing
- Security testing
- User acceptance testing

---

## Security Considerations

### Access Control

- Workflows are organization-scoped
- Users can only access workflows in their organization
- Role-based permissions (owners/admins can create/edit, members can view/execute)
- API endpoints require authentication

### Data Privacy

- Context data encrypted at rest
- Response data encrypted in transit
- Email addresses validated before sending
- No sensitive data in execution logs

### Execution Limits

- Maximum execution time per workflow
- Maximum number of steps per workflow
- Rate limiting on workflow execution
- Resource usage monitoring

### Webhook Security

- Unique, unguessable webhook URLs
- Webhook signature verification
- Expiration dates for response endpoints
- Rate limiting on webhook endpoints

---

## Future Enhancements

### Workflow Templates

- Pre-built workflow templates for common use cases
- Template marketplace
- Community-contributed workflows

### Advanced Triggers

- Email trigger (workflow starts on incoming email)
- Database trigger (workflow starts on database change)
- Calendar trigger (workflow starts on calendar event)
- API trigger (workflow starts on external API call)

### Collaboration Features

- Share workflows with team members
- Workflow versioning
- Change history and rollback
- Comments and annotations

### Analytics & Reporting

- Workflow execution analytics
- Success/failure rates
- Performance metrics
- Cost tracking (API calls, email sends)

### Integration Enhancements

- Direct integration with popular tools (Slack, Teams, etc.)
- Custom action node library
- Webhook node for calling external APIs
- Database node for reading/writing data

### AI Features

- AI-powered workflow suggestions
- Natural language workflow creation
- Automatic error recovery
- Smart condition recommendations

---

## Conclusion

The Workflow feature provides powerful automation capabilities for document generation and delivery. By combining visual workflow building with robust execution engine and n8n export functionality, organizations can automate complex document workflows while maintaining flexibility to extend automation beyond the platform when needed.

The phased implementation approach ensures core functionality is delivered first, followed by advanced features and polish. This allows for early user feedback and iterative improvement while building toward a comprehensive automation platform.
