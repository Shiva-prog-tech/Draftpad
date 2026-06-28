export interface DocTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  popular?: boolean;
  html: string;
}

export const TEMPLATES: DocTemplate[] = [
  // ── Productivity ──────────────────────────────────────────────
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Agenda, discussion, action items',
    icon: '📋',
    category: 'Productivity',
    popular: true,
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
    id: 'standup',
    title: 'Daily Standup',
    description: 'Yesterday, today, blockers',
    icon: '☀️',
    category: 'Productivity',
    html: `<h1>Daily Standup — [Date]</h1>
<h2>Yesterday</h2>
<ul><li>What I completed</li></ul>
<h2>Today</h2>
<ul><li>What I'm working on</li></ul>
<h2>Blockers</h2>
<ul><li>Anything blocking progress (or "None")</li></ul>
<h2>Notes</h2>
<p>Anything the team should know...</p>`,
  },
  {
    id: 'one-on-one',
    title: '1:1 Notes',
    description: 'Talking points, feedback, growth',
    icon: '🤝',
    category: 'Productivity',
    html: `<h1>1:1 — [Name] &amp; [Manager]</h1>
<p><strong>Date:</strong></p>
<h2>Wins since last time</h2>
<ul><li>...</li></ul>
<h2>Talking points</h2>
<ul><li>...</li></ul>
<h2>Feedback (both ways)</h2>
<p>...</p>
<h2>Growth &amp; goals</h2>
<ul><li>...</li></ul>
<h2>Action items</h2>
<ul><li>[ ] Item — Owner</li></ul>`,
  },

  // ── Engineering ───────────────────────────────────────────────
  {
    id: 'rfc',
    title: 'RFC / Design Doc',
    description: 'Proposal, design, alternatives',
    icon: '📝',
    category: 'Engineering',
    popular: true,
    html: `<h1>RFC: [Title]</h1>
<p><strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Status:</strong> Draft &nbsp;&nbsp;&nbsp;<strong>Date:</strong></p>
<h2>Summary</h2>
<p>One-paragraph overview of what this proposes.</p>
<h2>Motivation</h2>
<p>Why are we doing this? What problem does it solve, and for whom?</p>
<h2>Proposal</h2>
<p>The high-level approach.</p>
<h2>Detailed Design</h2>
<p>APIs, data models, components, and how they interact.</p>
<h2>Alternatives Considered</h2>
<ul><li><strong>Option A</strong> — Pros: ... Cons: ...</li><li><strong>Option B</strong> — Pros: ... Cons: ...</li></ul>
<h2>Risks &amp; Drawbacks</h2>
<ul><li>Risk 1 — mitigation</li></ul>
<h2>Rollout &amp; Adoption</h2>
<p>How will this ship and be adopted?</p>
<h2>Open Questions</h2>
<ul><li>Question 1</li></ul>`,
  },
  {
    id: 'incident-postmortem',
    title: 'Incident Postmortem',
    description: 'Timeline, root cause, action items',
    icon: '🚨',
    category: 'Engineering',
    popular: true,
    html: `<h1>Incident Postmortem</h1>
<p><strong>Incident ID:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Severity:</strong> SEV-? &nbsp;&nbsp;&nbsp;<strong>Date:</strong></p>
<p><strong>Authors:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Status:</strong> Draft</p>
<blockquote>This is a blameless postmortem. We focus on systems and processes, not individuals.</blockquote>
<h2>Summary</h2>
<p>What happened, in 2–3 sentences.</p>
<h2>Impact</h2>
<ul><li>Users affected: ...</li><li>Duration: ...</li><li>Revenue / SLA impact: ...</li></ul>
<h2>Timeline (UTC)</h2>
<ul><li><strong>HH:MM</strong> — Trigger / first event</li><li><strong>HH:MM</strong> — Detection</li><li><strong>HH:MM</strong> — Mitigation started</li><li><strong>HH:MM</strong> — Resolved</li></ul>
<h2>Root Cause</h2>
<p>The underlying cause(s) of the incident.</p>
<h2>Detection</h2>
<p>How was it detected? Could it have been caught sooner?</p>
<h2>Resolution</h2>
<p>What actions mitigated and resolved the incident.</p>
<h2>Action Items</h2>
<ul><li>[ ] Action — Owner — Due — Priority</li></ul>
<h2>Lessons Learned</h2>
<p>What went well, what went wrong, where we got lucky.</p>`,
  },
  {
    id: 'adr',
    title: 'Architecture Decision',
    description: 'ADR: context, decision, consequences',
    icon: '🏛️',
    category: 'Engineering',
    html: `<h1>ADR-[NNN]: [Decision Title]</h1>
<p><strong>Status:</strong> Proposed / Accepted / Superseded &nbsp;&nbsp;&nbsp;<strong>Date:</strong></p>
<h2>Context</h2>
<p>The forces at play — technical, business, and team constraints.</p>
<h2>Decision</h2>
<p>The change we are proposing or have agreed to.</p>
<h2>Consequences</h2>
<ul><li><strong>Positive:</strong> ...</li><li><strong>Negative:</strong> ...</li><li><strong>Neutral:</strong> ...</li></ul>
<h2>Alternatives Considered</h2>
<ul><li><strong>Option A</strong> — why rejected</li></ul>`,
  },
  {
    id: 'release-notes',
    title: 'Release Notes',
    description: 'Features, fixes, breaking changes',
    icon: '🚀',
    category: 'Engineering',
    html: `<h1>Release Notes — v[X.Y.Z]</h1>
<p><strong>Release date:</strong></p>
<h2>✨ New Features</h2>
<ul><li>Feature description</li></ul>
<h2>⚡ Improvements</h2>
<ul><li>Improvement description</li></ul>
<h2>🐛 Bug Fixes</h2>
<ul><li>Fixed: description</li></ul>
<h2>⚠️ Breaking Changes</h2>
<ul><li>What changed and what to do about it</li></ul>
<h2>📦 Upgrade Notes</h2>
<p>Steps required to upgrade...</p>`,
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
<p><strong>Feature:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Status:</strong> Draft</p>
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

  // ── Product ───────────────────────────────────────────────────
  {
    id: 'prd',
    title: 'Product Requirements',
    description: 'PRD with goals, user stories, specs',
    icon: '📐',
    category: 'Product',
    popular: true,
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
    id: 'roadmap',
    title: 'Product Roadmap',
    description: 'Now / Next / Later with metrics',
    icon: '🗺️',
    category: 'Product',
    html: `<h1>Product Roadmap — [Quarter / Year]</h1>
<p><strong>Owner:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Last updated:</strong></p>
<h2>Vision</h2>
<p>Where we're headed and why it matters.</p>
<h2>Now — In Progress</h2>
<ul><li>Initiative — goal — owner</li></ul>
<h2>Next — Planned</h2>
<ul><li>Initiative — goal</li></ul>
<h2>Later — Exploring</h2>
<ul><li>Idea / bet</li></ul>
<h2>Success Metrics</h2>
<ul><li>Metric — target</li></ul>`,
  },
  {
    id: 'feature-spec',
    title: 'Feature Spec',
    description: 'Problem, stories, requirements',
    icon: '🧩',
    category: 'Product',
    html: `<h1>Feature Spec: [Feature]</h1>
<p><strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Status:</strong> Draft</p>
<h2>Problem</h2>
<p>What problem are we solving?</p>
<h2>Goals</h2>
<ul><li>...</li></ul>
<h2>Non-goals</h2>
<ul><li>...</li></ul>
<h2>User Stories</h2>
<p>As a <em>[user]</em>, I want <em>[action]</em> so that <em>[benefit]</em>.</p>
<h2>UX &amp; Flow</h2>
<p>Describe the experience or link mockups.</p>
<h2>Requirements</h2>
<ol><li>Requirement 1</li></ol>
<h2>Metrics</h2>
<ul><li>How we'll measure success</li></ul>
<h2>Open Questions</h2>
<ul><li>...</li></ul>`,
  },
  {
    id: 'okrs',
    title: 'OKRs',
    description: 'Objectives & key results',
    icon: '🎯',
    category: 'Product',
    html: `<h1>OKRs — [Team] [Quarter]</h1>
<h2>Objective 1: [Aspirational, qualitative goal]</h2>
<ul><li><strong>KR1:</strong> measurable result (baseline → target)</li><li><strong>KR2:</strong> measurable result</li><li><strong>KR3:</strong> measurable result</li></ul>
<h2>Objective 2: [Goal]</h2>
<ul><li><strong>KR1:</strong> ...</li><li><strong>KR2:</strong> ...</li></ul>
<h2>Notes</h2>
<p>Context, dependencies, and risks.</p>`,
  },

  // ── Marketing ─────────────────────────────────────────────────
  {
    id: 'blog-post',
    title: 'Blog Post / SEO Brief',
    description: 'Outline, keywords, draft',
    icon: '✍️',
    category: 'Marketing',
    popular: true,
    html: `<h1>Blog Post: [Working Title]</h1>
<p><strong>Target keyword:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Author:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Target length:</strong> ~1,200 words</p>
<h2>Goal &amp; Audience</h2>
<p>Who is this for, and what should they do after reading?</p>
<h2>Outline</h2>
<ol><li>Hook / Introduction</li><li>Section 1</li><li>Section 2</li><li>Section 3</li><li>Conclusion + Call to Action</li></ol>
<h2>SEO Checklist</h2>
<ul><li>Meta title (≤ 60 chars): ...</li><li>Meta description (≤ 155 chars): ...</li><li>Internal links: ...</li><li>External references: ...</li></ul>
<h2>Draft</h2>
<p>Start writing here...</p>`,
  },
  {
    id: 'campaign-brief',
    title: 'Campaign Brief',
    description: 'Objective, audience, channels, KPIs',
    icon: '📣',
    category: 'Marketing',
    html: `<h1>Marketing Campaign Brief</h1>
<p><strong>Campaign:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Owner:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Dates:</strong></p>
<h2>Objective</h2>
<p>What this campaign should achieve.</p>
<h2>Target Audience</h2>
<p>Who we're trying to reach.</p>
<h2>Key Message</h2>
<p>The single most important thing to communicate.</p>
<h2>Channels</h2>
<ul><li>Channel — format — owner</li></ul>
<h2>Budget</h2>
<p>Total and breakdown.</p>
<h2>Success Metrics (KPIs)</h2>
<ul><li>KPI — target</li></ul>
<h2>Timeline</h2>
<ul><li>Milestone — date</li></ul>`,
  },
  {
    id: 'case-study',
    title: 'Case Study',
    description: 'Challenge, solution, results',
    icon: '🏆',
    category: 'Marketing',
    html: `<h1>Case Study: [Customer]</h1>
<h2>Executive Summary</h2>
<p>Provide a brief overview of the customer and the headline results.</p>
<h2>The Challenge</h2>
<p>What problem the customer faced before using the product.</p>
<h2>The Solution</h2>
<p>How the product was used to solve it.</p>
<h2>Results</h2>
<ul><li>Metric improved by X%</li><li>Outcome 2</li></ul>
<h2>Customer Quote</h2>
<blockquote>"A short, punchy quote from the customer." — Name, Title</blockquote>
<h2>About [Customer]</h2>
<p>One paragraph about the company.</p>`,
  },
  {
    id: 'press-release',
    title: 'Press Release',
    description: 'Announcement in standard format',
    icon: '📰',
    category: 'Marketing',
    html: `<h1>[Headline: Company Announces ...]</h1>
<p><strong>FOR IMMEDIATE RELEASE</strong></p>
<p><strong>[City, Date]</strong> — Opening paragraph: the who, what, when, where, and why in 2–3 sentences.</p>
<h2>Body</h2>
<p>Supporting details, context, and significance.</p>
<h2>Quote</h2>
<blockquote>"A quote from a company spokesperson." — Name, Title</blockquote>
<h2>About [Company]</h2>
<p>Boilerplate company description.</p>
<h2>Media Contact</h2>
<p>Name — email — phone</p>`,
  },

  // ── Business ──────────────────────────────────────────────────
  {
    id: 'project-proposal',
    title: 'Project Proposal',
    description: 'Scope, timeline, budget, success',
    icon: '📊',
    category: 'Business',
    html: `<h1>Project Proposal: [Name]</h1>
<p><strong>Prepared by:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Date:</strong></p>
<h2>Executive Summary</h2>
<p>The proposal in a nutshell.</p>
<h2>Problem / Opportunity</h2>
<p>What we're addressing and why now.</p>
<h2>Proposed Solution</h2>
<p>The recommended approach.</p>
<h2>Scope</h2>
<ul><li><strong>In scope:</strong> ...</li><li><strong>Out of scope:</strong> ...</li></ul>
<h2>Timeline &amp; Milestones</h2>
<ul><li>Phase 1 — deliverable — date</li></ul>
<h2>Budget &amp; Resources</h2>
<p>Estimated cost and team.</p>
<h2>Success Criteria</h2>
<ul><li>How we'll know it worked</li></ul>`,
  },
  {
    id: 'pitch-deck',
    title: 'Pitch Deck Outline',
    description: '10-slide investor narrative',
    icon: '💡',
    category: 'Business',
    html: `<h1>Pitch Deck Outline</h1>
<p><strong>Company:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Audience:</strong> Investors</p>
<h2>1. Problem</h2><p>The pain point you solve.</p>
<h2>2. Solution</h2><p>Your product, simply explained.</p>
<h2>3. Market</h2><p>TAM / SAM / SOM.</p>
<h2>4. Product</h2><p>How it works + demo.</p>
<h2>5. Business Model</h2><p>How you make money.</p>
<h2>6. Traction</h2><p>Key metrics and growth.</p>
<h2>7. Competition</h2><p>Landscape and your moat.</p>
<h2>8. Team</h2><p>Why you're the ones to win.</p>
<h2>9. Financials</h2><p>Projections and key assumptions.</p>
<h2>10. The Ask</h2><p>How much you're raising and use of funds.</p>`,
  },
  {
    id: 'sow',
    title: 'Statement of Work',
    description: 'Deliverables, terms, acceptance',
    icon: '📑',
    category: 'Business',
    html: `<h1>Statement of Work (SOW)</h1>
<p><strong>Client:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Vendor:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Effective date:</strong></p>
<h2>Overview</h2>
<p>Summary of the engagement.</p>
<h2>Scope of Work</h2>
<ol><li>Deliverable 1</li><li>Deliverable 2</li></ol>
<h2>Out of Scope</h2>
<ul><li>...</li></ul>
<h2>Timeline</h2>
<ul><li>Milestone — date</li></ul>
<h2>Pricing &amp; Payment Terms</h2>
<p>Fees, schedule, and invoicing terms.</p>
<h2>Acceptance Criteria</h2>
<ul><li>How deliverables will be reviewed and accepted</li></ul>
<h2>Assumptions &amp; Dependencies</h2>
<ul><li>...</li></ul>`,
  },
];
