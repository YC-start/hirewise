# HireWise — AI-Native Recruiting Agent Platform

## Product Specification v2.1

---

## 1. Product Vision & Positioning

**One-liner:** The command line for recruiting — speak what you need, watch the pipeline materialize.

HireWise is an AI-native recruiting operations platform built for overseas (global/cross-border) HR teams. It collapses the traditional 7-tool recruiting stack into a single **conversation-first** workspace: the AI Agent chat occupies the center stage as the primary interaction surface, while structured data panels (Dashboard, Pipeline, Candidate Profile) live in a collapsible right-hand sidebar. Every recruiting action — creating jobs, sourcing candidates, evaluating talent — begins as a natural-language conversation and materializes into durable, queryable data.

**Why now:**
- LLM capability has crossed the threshold for reliable resume-to-JD semantic matching.
- Global remote hiring volumes have outgrown spreadsheet-era tooling.
- HR teams want AI leverage without learning prompt engineering.

**Competitive moat:**
- Conversation-first paradigm: every recruiting action starts as natural language and produces durable, queryable data — not throwaway text.
- Real candidate data from external APIs (Coresignal / Apollo.io) — no mock data, no manual upload required.
- Transparent AI scoring with full reasoning traces — no black-box recommendations.
- Opinionated workflow defaults that encode best-practice recruiting ops out of the box.

---

## 2. Target User Personas

### Primary: "The Talent Lead" — Overseas Recruiting Manager
- 3-8 years experience, manages 5-20 open reqs simultaneously.
- Comfortable with English-language tooling, may operate across APAC/EMEA/NA timezones.
- Pain: drowning in unstructured resumes, inconsistent scoring, calendar chaos.
- Goal: reduce time-to-shortlist from days to minutes.

### Secondary: "The Hiring Manager" — Engineering / Department Head
- Consumes candidate rankings and interview prep materials.
- Wants signal, not noise — cares about match reasoning, not raw resumes.
- Interacts mainly with Candidate Profile pages and ranking views.

### Tertiary: "The Exec" — VP People / CHRO
- Cares about pipeline health dashboards and hiring velocity metrics.
- Needs exportable summaries and audit trails.

---

## 3. Core User Stories (by Module)

### Module A — Global Agent Chat (Main Area / CUI)

| ID | Story |
|----|-------|
| A-1 | As a Talent Lead, I can type "Find me 50 senior backend engineers with Go + Kubernetes experience, remote-friendly, US/EU timezone" and watch the Agent search, retrieve, and score candidates in real time. |
| A-2 | As a Talent Lead, I can see a live progress ticker ("Searching... 50 resumes retrieved... Scoring 34/50...") so I know the Agent is working and roughly how long to wait. |
| A-3 | As a Talent Lead, when the Agent finishes, I see a structured Action Card in the chat with a summary (e.g., "12 candidates scored above 85%") and a button that jumps me directly to the Ranking View for that job. |
| A-4 | As a Talent Lead, I can ask follow-up questions in natural language ("Show me only candidates with startup experience" / "Re-rank excluding anyone without a CS degree") and the Agent refines results without starting over. |
| A-5 | (**UPGRADED to P0 — merged into FLOW-1**) As a Talent Lead, I describe a hiring need in natural language (e.g., "Hire a 3-year energy storage sales rep in Mexico"), and the Agent extracts structured fields, generates a full JD preview, and — upon my confirmation — creates the Job and inserts it into the pipeline automatically. No form-filling required. |

### Module B — Job Dashboard (Work台)

| ID | Story |
|----|-------|
| B-1 | As a Talent Lead, I see all open positions in a card grid (default) or compact list view, switchable with one click. |
| B-2 | Each job card shows: job title, status badge (Draft / Active / Paused / Closed), total resumes received, count of high-score candidates (>80%), and count of candidates in "Interview Scheduled" state. |
| B-3 | **DEPRECATED** — Replaced by conversational job creation (FLOW-1). Job creation is now exclusively through the AI Agent chat. The quick-create modal is removed. |
| B-4 | As a Talent Lead, I can archive/close a job, which freezes its pipeline but preserves all data for future reference. |
| B-5 | As a Hiring Manager, I can filter the dashboard to see only jobs I own or jobs in my department. |

### Module C — Candidate Ranking View (Pipeline)

| ID | Story |
|----|-------|
| C-1 | As a Talent Lead, I see a left rail displaying the JD summary as context tags (required skills, nice-to-haves, seniority level) so I never lose sight of what I'm hiring for. |
| C-2 | The main panel is a ranked list of candidates, sorted by AI match score descending by default. Each row shows: candidate name/alias, match score (prominent numeric + progress bar), and top 3 matched skill tags. |
| C-3 | As a Talent Lead, I can multi-select candidates and perform bulk actions: "Advance to Interview", "Reject", "Export to CSV". |
| C-4 | As a Talent Lead, I can click any candidate row to expand an inline preview or navigate to the full Candidate Profile. |
| C-5 | As a Talent Lead, I can re-sort by sub-scores (e.g., "Technical Fit", "Culture Fit", "Experience Depth") or filter by skill tag. |

### Module D — Candidate Profile Detail

| ID | Story |
|----|-------|
| D-1 | As a Hiring Manager, I see the candidate's original resume rendered inline (PDF viewer or structured timeline). |
| D-2 | As a Hiring Manager, I see the AI Evaluation Report: overall score, per-dimension breakdown, plain-language reasoning for the score, and explicitly called-out skill gaps. |
| D-3 | As a Hiring Manager, I see AI-generated tailored interview questions based on this candidate's profile mapped against the JD requirements. |
| D-4 | As a Talent Lead, I can transition the candidate through pipeline stages via action buttons: "Schedule Interview" / "Reject" / "Extend Offer" / "Hire" / "Archive". |
| D-5 | As a Talent Lead, I can leave internal notes on a candidate visible to the hiring team. |

---

## 4. Visual Design Language

### Design Philosophy: "Industrial Clarity"

Reject the default SaaS aesthetic of pastel gradients on white cards. HireWise takes visual cues from **Bloomberg Terminal meets Dieter Rams** — dense information, zero decoration, maximum signal.

### Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-primary` | `#0D0D0D` | App background — near-black, reduces eye strain during long sessions |
| `--surface-secondary` | `#1A1A1A` | Card / panel backgrounds |
| `--surface-tertiary` | `#262626` | Hover states, active rows, subtle elevation |
| `--border-default` | `#333333` | Dividers, card borders — barely there |
| `--text-primary` | `#E8E8E8` | Primary body text — warm off-white, not harsh #FFF |
| `--text-secondary` | `#888888` | Secondary labels, metadata |
| `--text-muted` | `#555555` | Disabled, placeholder |
| `--accent-primary` | `#D4FF00` | Acid chartreuse — primary CTA, active states, score highlights |
| `--accent-secondary` | `#00D4AA` | Teal — secondary actions, success states, positive indicators |
| `--signal-danger` | `#FF4444` | Rejections, errors, destructive actions |
| `--signal-warning` | `#FFB800` | Warnings, medium-priority flags |
| `--score-gradient-high` | `#D4FF00` | Scores 80-100 |
| `--score-gradient-mid` | `#FFB800` | Scores 50-79 |
| `--score-gradient-low` | `#FF4444` | Scores 0-49 |

**Rationale:** The dark ground makes data-dense screens (ranking tables, score breakdowns) scannable for hours. The acid chartreuse accent is distinctive and impossible to confuse with any competitor's brand. It signals: this is a power tool, not a toy.

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings (H1-H3) | **Space Grotesk** | 700 | 28 / 22 / 18 |
| Body / UI labels | **Inter** | 400 / 500 | 14 / 13 |
| Monospace (scores, IDs) | **JetBrains Mono** | 500 | 14 |
| Score display (large) | **Space Grotesk** | 700 | 36 |

### Component Style

- **Cards:** No border-radius (or max 4px). No shadows. Differentiated from background by 1px `--border-default` border only. Dense padding (12-16px).
- **Buttons:** Pill-shaped for primary CTA (`--accent-primary` bg, `#0D0D0D` text). Rectangular ghost for secondary. No gradients ever.
- **Score bars:** Horizontal bars with left-aligned fill. Color follows score-gradient tokens. No rounded ends — flat, industrial termination.
- **Tables / Lists:** Tight row height (40-44px). Alternating row tint via `--surface-tertiary`. Column headers uppercase, 11px, `--text-muted`, letter-spacing 0.08em.
- **Chat bubbles (Agent sidebar):** Agent messages use `--surface-secondary` bg. User messages use `--accent-primary` bg with `#0D0D0D` text. No rounded speech-bubble tails — just rectangles.
- **Action Cards:** Distinct from chat bubbles. Use a left border accent (4px `--accent-secondary`) on `--surface-tertiary` background. Contain structured data + action buttons inline.
- **Progress indicators:** Horizontal segmented bar (not spinner). Each segment fills with `--accent-primary` as a step completes. Text below reads current action in `JetBrains Mono`.
- **Icons:** Phosphor Icons (bold weight). Monochrome `--text-secondary` default, `--accent-primary` when active.

### Layout Principles

- **Conversation-center:** The AI Agent chat occupies the main area (60-70% width). Data panels live in a collapsible right sidebar (30-40% width). The chat is the command center; the sidebar is the reference panel.
- **Dense by default:** Optimize for information density. Whitespace is used structurally (to group), never decoratively.
- **No hero sections, no splash screens.** The product opens directly to the AI chat with the data sidebar showing the Jobs panel.
- **Responsive breakpoints:** Desktop-first (1280px+). Tablet (768-1279px) collapses data sidebar to icon-strip. Mobile / Native App (below 768px) switches to full-screen chat as default, with bottom tab navigation to access data panels (Jobs, Pipeline, Profile).
- **Mobile-native UX:** On Capacitor (iOS/Android), leverage native safe areas, haptic feedback on actions, pull-to-refresh, and swipe gestures for candidate card actions (swipe right = advance, swipe left = reject).

---

## 5. Technology Stack (High-Level)

### Cross-Platform Strategy: Web + iOS + Android

**Approach:** Next.js for Web (deployed on Vercel) + **Capacitor** to wrap the same web app as native iOS/Android apps. This gives us:
- One codebase, three platforms
- Web-first development velocity with instant Vercel preview deploys
- Native device APIs (push notifications, camera for resume scanning, biometrics) via Capacitor plugins
- App Store / Play Store distribution without maintaining separate React Native codebases

**Why Capacitor over React Native?**
- Zero code duplication — the Next.js app IS the mobile app
- Web features work identically on mobile without porting
- Capacitor's plugin ecosystem covers all needed native APIs (push, haptics, share, camera)
- Iterative: ship web first, add native shells when ready for app stores

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14+ (App Router)** | Vercel-native, SSR/SSG flexibility, API routes for backend-for-frontend |
| Cross-Platform | **Capacitor 6+** | Wraps web app into native iOS/Android shells, access to native APIs |
| Language | **TypeScript** | Non-negotiable for a data-heavy product |
| Styling | **Tailwind CSS 4** | Utility-first, design token friendly, excellent DX |
| UI Primitives | **Radix UI** (headless) | Accessible, unstyled, composable — we own the look |
| State / Data | **TanStack Query + Zustand** | Server state cache + minimal client state |
| AI Integration | **Vercel AI SDK** | Streaming chat, tool-calling, framework-aligned |
| Database | **Supabase (Postgres + Auth + Realtime)** | Open-source, generous free tier, real-time subscriptions for live pipeline updates |
| File Storage | **Supabase Storage** or **Uploadthing** | Resume PDF uploads |
| Deployment (Web) | **Vercel** | Git-push deploy, edge functions, analytics built-in |
| Deployment (Mobile) | **Capacitor + Xcode / Android Studio** | Native builds via CI or local |
| Monorepo (if needed) | **Turborepo** | Vercel-native monorepo tooling |

---

## 6. Information Architecture / Page Flow

### Layout Paradigm: Conversation-Center, Data-Sidebar

The AI Agent chat is the **primary interaction surface**, occupying 60-70% of the viewport width (center/left area). Structured data panels live in a **collapsible right-hand sidebar** (30-40% width) that can switch between different views.

```
[App Shell — Desktop 1280px+]
├── [Main Area: Agent Chat — 60-70% width]  ← PRIMARY
│   ├── Chat thread (full conversation history)
│   ├── Action Cards (inline structured outputs)
│   ├── JD Preview Cards (editable, confirm-to-create)
│   ├── Candidate Search Results (inline summaries)
│   └── Quick-command suggestions
│
├── [Right Sidebar: Data Panels — 30-40% width, collapsible]
│   ├── Tab: Jobs Dashboard
│   │   ├── Job Card Grid / List
│   │   └── Filters (status, department, owner)
│   ├── Tab: Pipeline (for active job)
│   │   ├── JD context tags
│   │   ├── Candidate ranked list
│   │   └── Bulk actions toolbar
│   ├── Tab: Candidate Profile (for selected candidate)
│   │   ├── Resume (PDF viewer / timeline)
│   │   ├── AI Evaluation Report
│   │   ├── Interview Prep (AI questions)
│   │   └── Action bar: stage transition buttons
│   └── Collapse toggle → hides sidebar, chat goes full-width
│
└── /settings  ← App-level settings (full page)
    ├── Account / Team management
    ├── AI model preferences
    └── Integrations (Coresignal, Apollo.io, ATS, calendar, email)

[Mobile — below 768px]
├── AI Chat → full screen (default primary view)
├── Data panels → accessible via bottom tabs or swipe gesture
└── Bottom tab bar: Chat | Jobs | Pipeline | Profile
```

### Core Workflow: Natural Language → Structured Data → External API → AI Evaluation

1. **Entry:** User lands on the AI chat (main area). Right sidebar shows Jobs Dashboard with greeting + suggested actions.
2. **Create Job (Conversational):** User describes hiring need in natural language (e.g., "Hire a 3-year energy storage sales rep in Mexico") → Agent extracts structured fields (title, location, experience, industry, skills) → Agent generates full JD preview as an editable Action Card in chat → User confirms or modifies → Job auto-created and appears in sidebar Jobs panel. **No form, no modal.**
3. **Source Candidates (External API):** Agent calls Coresignal or Apollo.io API with structured search parameters derived from the JD → retrieves real candidate profiles → structures and normalizes the data → performs AI scoring against JD requirements → populates the Pipeline panel in the sidebar.
4. **Review:** User reads AI-scored ranking in the sidebar Pipeline tab. Clicks a candidate to load their full Profile in the sidebar. Reads AI evaluation with transparent reasoning.
5. **Act:** User schedules interviews, rejects poor fits, extends offers — via action buttons in the sidebar Profile tab, or by telling the Agent in chat ("Reject candidates below 60 score").
6. **Close:** User tells Agent "Close this role" or clicks archive in sidebar → pipeline freezes → data archived.

---

## 7. External API Integration

### Candidate Data Sources

HireWise replaces all mock/seed data with real candidate profiles sourced from external professional data APIs. The Agent orchestrates the entire search-to-evaluation pipeline.

| Provider | Purpose | Data Available |
|----------|---------|---------------|
| **Coresignal** (primary) | Professional profile search | Work history, education, skills, certifications, location, company data |
| **Apollo.io** (alternative) | People + company enrichment | Contact info, job titles, company details, technology stacks |

### Integration Architecture

1. **Query Construction:** The Agent parses the JD's structured fields (title, skills, experience, location, industry) into API-compatible search parameters.
2. **Search Execution:** API calls to Coresignal/Apollo.io retrieve candidate profiles matching the search criteria.
3. **Structuring:** The Agent normalizes raw API responses into HireWise's internal Candidate schema (name, experience timeline, skills, education, certifications).
4. **AI Scoring:** Each structured candidate profile is scored against the JD using multi-dimensional evaluation (Technical Fit, Culture Fit, Experience Depth, Leadership Potential). Full reasoning traces are generated.
5. **Ranking & Presentation:** Scored candidates are ranked and presented in the Pipeline panel, with Action Cards summarizing results in the chat.

### Data Handling Principles

- Raw API responses are cached to minimize redundant API calls (TTL-based).
- Candidate data is stored in Supabase after structuring (not raw API payloads).
- API keys are managed via environment variables, never exposed client-side.
- Rate limiting and error handling for API quotas.
- Graceful degradation if an external API is unavailable (show cached results, inform user).

---

## 8. Non-Functional Requirements

- **Performance:** Dashboard and ranking list must render within 1.5s on 4G connection. Chat responses must begin streaming within 500ms.
- **Accessibility:** WCAG 2.1 AA compliance. Full keyboard navigation. Screen reader support for all data tables.
- **Internationalization:** English-first. Architecture must support i18n (externalized strings) for future CJK / RTL expansion.
- **Data Privacy:** Resume data encrypted at rest. GDPR-aware: candidates can be anonymized/deleted on request. AI evaluation data is auditable.
- **Scalability:** Support 10,000+ candidates per job pipeline without UI degradation (virtualized lists).

---

*Document version: 2.1 | Date: 2026-03-29 | Status: Draft — Major pivot: conversation-center layout, conversational job creation, external API integration*
