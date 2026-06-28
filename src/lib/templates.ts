export interface DocTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  html: string;
}

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Agenda, discussion, action items',
    icon: '📋',
    category: 'Productivity',
    html: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Facilitator:</strong></p>
<p><strong>Attendees:</strong></p>
<h2>Agenda</h2>
<ol><li>Topic one</li><li>Topic two</li><li>Topic three</li></ol>
<h2>Discussion</h2>
<p>Key points discussed during the meeting...</p>
<h2>Decisions</h2>
<ul><li>Decision 1</li><li>Decision 2</li></ul>
<h2>Action Items</h2>
<ul><li>[ ] Action item — Owner — Due date</li><li>[ ] Action item — Owner — Due date</li></ul>
<h2>Next Meeting</h2>
<p><strong>Date:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Agenda items:</strong></p>`,
  },
  {
    id: 'prd',
    title: 'Product Requirements',
    description: 'PRD with goals, user stories, specs',
    icon: '📐',
    category: 'Product',
    html: `<h1>Product Requirements Document</h1>
<p><strong>Product:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Status:</strong> Draft</p>
<h2>Overview</h2>
<p>Brief description of the product or feature being built...</p>
<h2>Problem Statement</h2>
<p>What problem are we solving, and for whom?</p>
<h2>Goals &amp; Success Metrics</h2>
<ul><li>Goal 1 — Metric: ...</li><li>Goal 2 — Metric: ...</li></ul>
<h2>User Stories</h2>
<p>As a <em>[user type]</em>, I want to <em>[action]</em> so that <em>[benefit]</em>.</p>
<p>As a <em>[user type]</em>, I want to <em>[action]</em> so that <em>[benefit]</em>.</p>
<h2>Functional Requirements</h2>
<ol><li>Requirement 1</li><li>Requirement 2</li></ol>
<h2>Non-functional Requirements</h2>
<ul><li>Performance: ...</li><li>Security: ...</li><li>Accessibility: ...</li></ul>
<h2>Out of Scope</h2>
<ul><li>Feature not included in this release</li></ul>
<h2>Open Questions</h2>
<ul><li>Question 1</li></ul>
<h2>Timeline</h2>
<ul><li>Milestone 1: [Date]</li><li>Launch: [Date]</li></ul>`,
  },
  {
    id: 'sprint-retro',
    title: 'Sprint Retrospective',
    description: 'What went well, improvements, actions',
    icon: '🔄',
    category: 'Engineering',
    html: `<h1>Sprint Retrospective</h1>
<p><strong>Sprint:</strong> #&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Date:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Team:</strong></p>
<h2>What Went Well ✅</h2>
<ul><li>Positive thing 1</li><li>Positive thing 2</li><li>Positive thing 3</li></ul>
<h2>What Could Be Improved 🔧</h2>
<ul><li>Improvement area 1</li><li>Improvement area 2</li></ul>
<h2>Action Items 🎯</h2>
<ul><li>[ ] Action item — Owner — Target sprint</li><li>[ ] Action item — Owner — Target sprint</li></ul>
<h2>Team Metrics</h2>
<ul><li><strong>Velocity:</strong> planned pts → delivered pts</li><li><strong>Bugs opened:</strong> &nbsp;<strong>Bugs closed:</strong></li></ul>
<h2>Shout-outs 🙌</h2>
<p>Recognise team members who went above and beyond...</p>`,
  },
  {
    id: 'bug-report',
    title: 'Bug Report',
    description: 'Steps to reproduce, expected vs actual',
    icon: '🐛',
    category: 'Engineering',
    html: `<h1>Bug Report</h1>
<p><strong>Reported by:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Date:</strong></p>
<p><strong>Severity:</strong> Critical / High / Medium / Low &nbsp;&nbsp;&nbsp;<strong>Status:</strong> Open</p>
<h2>Summary</h2>
<p>One-line description of the bug...</p>
<h2>Steps to Reproduce</h2>
<ol><li>Navigate to ...</li><li>Click on ...</li><li>Observe that ...</li></ol>
<h2>Expected Behaviour</h2>
<p>What should happen when the steps above are followed...</p>
<h2>Actual Behaviour</h2>
<p>What actually happens instead...</p>
<h2>Environment</h2>
<ul><li><strong>OS:</strong></li><li><strong>Browser / Version:</strong></li><li><strong>App version / commit:</strong></li></ul>
<h2>Screenshots / Logs</h2>
<p>Paste error messages, stack traces, or attach screenshots here.</p>
<h2>Possible Root Cause</h2>
<p>Any hypothesis about what might be causing the issue...</p>`,
  },
  {
    id: 'api-docs',
    title: 'API Documentation',
    description: 'Endpoints, parameters, response schemas',
    icon: '📡',
    category: 'Engineering',
    html: `<h1>API Documentation</h1>
<p><strong>Version:</strong> 1.0 &nbsp;&nbsp;&nbsp;<strong>Base URL:</strong> <code>https://api.example.com/v1</code></p>
<h2>Authentication</h2>
<p>All requests require a Bearer token in the <code>Authorization</code> header:</p>
<blockquote><code>Authorization: Bearer &lt;token&gt;</code></blockquote>
<h2>Endpoints</h2>
<h3>GET /resources</h3>
<p>Retrieve a paginated list of resources.</p>
<p><strong>Query parameters:</strong></p>
<ul><li><code>page</code> (integer, optional) — Page number, default 1</li><li><code>limit</code> (integer, optional) — Results per page, default 20</li></ul>
<p><strong>Response 200:</strong></p>
<blockquote><code>{ "data": [], "total": 0, "page": 1 }</code></blockquote>
<h3>POST /resources</h3>
<p>Create a new resource.</p>
<p><strong>Request body:</strong></p>
<blockquote><code>{ "name": "string", "description": "string" }</code></blockquote>
<p><strong>Response 201:</strong></p>
<blockquote><code>{ "id": "string", "name": "string", "createdAt": "ISO8601" }</code></blockquote>
<h2>Error Codes</h2>
<ul><li><code>400</code> — Bad request / validation error</li><li><code>401</code> — Unauthorized</li><li><code>404</code> — Resource not found</li><li><code>500</code> — Internal server error</li></ul>`,
  },
  {
    id: 'tech-spec',
    title: 'Technical Spec',
    description: 'Architecture, design decisions, tradeoffs',
    icon: '⚙️',
    category: 'Engineering',
    html: `<h1>Technical Specification</h1>
<p><strong>Feature:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&strong>Status:</strong> Draft</p>
<h2>Background</h2>
<p>Context and motivation for this technical work...</p>
<h2>Goals</h2>
<ul><li>Goal 1</li><li>Goal 2</li></ul>
<h2>Non-goals</h2>
<ul><li>Out of scope item</li></ul>
<h2>Proposed Solution</h2>
<p>High-level description of the approach...</p>
<h2>Architecture Diagram</h2>
<p><em>[Diagram or description of system components and their interactions]</em></p>
<h2>Data Model</h2>
<p>Key data structures and schema changes...</p>
<h2>API Changes</h2>
<p>New or modified endpoints...</p>
<h2>Alternatives Considered</h2>
<ul><li><strong>Option A:</strong> ... Pros: ... Cons: ...</li><li><strong>Option B:</strong> ... Pros: ... Cons: ...</li></ul>
<h2>Security Considerations</h2>
<p>Security implications and mitigations...</p>
<h2>Testing Plan</h2>
<ul><li>Unit tests: ...</li><li>Integration tests: ...</li><li>Load testing: ...</li></ul>
<h2>Rollout Plan</h2>
<ul><li>Phase 1: ...</li><li>Phase 2: ...</li></ul>`,
  },
];
