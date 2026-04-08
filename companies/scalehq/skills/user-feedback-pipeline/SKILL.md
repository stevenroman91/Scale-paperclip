---
name: user-feedback-pipeline
description: Collecte des retours utilisateurs (widget in-app, email, support), auto-categorisation (bug/feature/question), scoring d'urgence, routage vers l'equipe appropriee
slug: user-feedback-pipeline
---

# User Feedback Pipeline

Automated collection, categorization, scoring, and routing of user feedback across all channels for ScaleHQ.

## Collection Channels

### In-App Feedback Widget
- Floating button in bottom-right corner of the dashboard (all authenticated pages)
- Opens a modal with: category selector (Bug / Feature Request / Question / Other), free-text description (required, min 20 chars), optional screenshot capture (html2canvas), optional severity self-assessment
- Automatically captures metadata: `page_url`, `browser` (UA string), `os`, `app_version` (from `package.json`), `user_id`, `user_email`, `user_plan`
- Submitted via `POST /api/feedback` with multipart/form-data (screenshot uploaded to S3/R2)

### Email
- Incoming address: `support@scalehq.io`
- Parsed by Support Agent via webhook (SendGrid Inbound Parse or similar)
- Extract: subject as title, body as description, sender email matched to user account
- Attachments saved as screenshot_url entries

### Intercom/Crisp Chat
- Webhook fires on conversation.closed or conversation.tagged events
- Payload mapped to feedback schema: conversation transcript as description, tags as category hints
- Agent or bot who handled the conversation recorded in metadata

### GitHub Issues
- For technical users filing bugs directly on `stevenroman91/ScaleHQ`
- GitHub webhook on `issues.opened` event
- Labels mapped to categories: `bug` label -> bug, `enhancement` label -> feature
- GitHub username matched to ScaleHQ user via linked accounts

## Feedback Data Model

```typescript
interface FeedbackTicket {
  id: string;                    // cuid2
  source: "widget" | "email" | "chat" | "github";
  category: "bug" | "feature" | "question" | "complaint" | "praise";
  urgency: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  screenshot_url?: string;
  user_id: string;
  user_email: string;
  user_plan: "starter" | "growth" | "scale";
  metadata: {
    page_url?: string;
    browser?: string;
    os?: string;
    app_version?: string;
    conversation_id?: string;     // for chat source
    github_issue_number?: number; // for github source
  };
  status: "new" | "triaged" | "in_progress" | "resolved" | "wont_fix";
  assigned_to: "support" | "pm" | "engineer" | "bug-fixer";
  created_at: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  duplicate_of?: string;         // id of original ticket if duplicate
}
```

Prisma model location: `prisma/schema.prisma` (add `FeedbackTicket` model).

## Auto-Categorization Rules (Claude-based)

The pipeline sends the feedback title + description to Claude with a structured prompt for classification. Deterministic keyword rules run first as a fast path:

| Pattern (case-insensitive)                                | Category    |
|-----------------------------------------------------------|-------------|
| error, crash, broken, "doesn't work", 500, exception      | bug         |
| "would be nice", "can you add", "feature request", "wish" | feature     |
| "how do I", "where is", "help", "how to", "tutorial"      | question    |
| angry tone, "unacceptable", "cancel", "disappointed"       | complaint   |
| "love", "great", "amazing", "thank you"                    | praise      |

Special routing overrides (applied before general routing):
- Mentions billing / invoice / subscription / payment / charge -> route directly to PM regardless of category
- Mentions security / vulnerability / data leak -> set urgency to critical, route to engineer + CEO alert

If no keyword matches, Claude classifies with a confidence score. Below 70% confidence, the ticket is flagged for manual review by Support Agent.

## Urgency Scoring

| Level    | Criteria                                                                                       |
|----------|-----------------------------------------------------------------------------------------------|
| Critical | Data loss, security issue, complete app crash, affects all users, payment processing failure    |
| High     | Feature broken for paying users, billing discrepancy, Scale plan user report, auth failure      |
| Medium   | Cosmetic bug on core pages, feature request from Growth+ plan user, partial feature degradation |
| Low      | General question, minor UI glitch, Starter plan feature request, documentation gap              |

Urgency is boosted by one level if:
- The user has reported the same issue more than once
- More than 3 users report the same issue within 24 hours
- The user is on the Scale plan (highest-paying tier)

## Routing Rules

| Category   | Assigned To  | Additional Actions                                    |
|------------|-------------|-------------------------------------------------------|
| bug        | bug-fixer   | Auto-triage triggered (see `auto-bug-triage` skill)   |
| feature    | pm          | Added to PM backlog, tagged with user_plan for prioritization |
| question   | support     | CS Bot attempts first; escalates to Support Agent if unresolved |
| complaint  | pm          | CEO alerted via Discord if urgency >= high             |
| praise     | pm          | Logged for NPS tracking, optional thank-you response   |

## SLA by Urgency

| Urgency  | First Response | Resolution Target | Escalation if Breached         |
|----------|---------------|-------------------|-------------------------------|
| Critical | < 2 hours     | < 8 hours         | CEO + CTO alerted immediately  |
| High     | < 8 hours     | < 24 hours        | PM alerted at 6h mark          |
| Medium   | < 24 hours    | < 72 hours        | Weekly review flag              |
| Low      | < 72 hours    | < 1 week          | Monthly review flag             |

SLA timers start at `created_at`. A Paperclip routine checks open tickets every hour and sends escalation alerts when SLA thresholds are approaching (at 75% of time elapsed).

## Deduplication

Before creating a new ticket:
1. Check for existing open tickets from the same `user_id` with cosine similarity > 0.85 on title+description embedding
2. Check for cluster of similar tickets from different users (3+ tickets with similarity > 0.80 in last 48h)
3. If duplicate found: link as `duplicate_of`, increment the original ticket's `affected_users_count`, notify the reporter that an existing ticket tracks their issue

## Reporting Metrics

Generated weekly by the pipeline and posted to the PM channel:
- Total feedback volume by source and category
- Urgency distribution (pie chart)
- Average time to first response vs SLA targets
- Top 10 recurring issues (by cluster size)
- Resolution rate by category
- User satisfaction correlation (feedback submitters vs CSAT scores)

## Edge Cases

- **Anonymous feedback**: Widget allows unauthenticated feedback on public pages. These get `user_id: null`, urgency capped at "medium", routed to support.
- **Spam detection**: If a single IP submits > 5 feedback items in 10 minutes, rate-limit and flag for review.
- **Large attachments**: Screenshots capped at 5MB. If exceeded, prompt user to describe the issue instead.
- **Multi-language input**: Feedback in French is processed natively. Other languages are auto-translated to French before categorization, with original preserved.
- **Feedback on feedback**: If a user replies to a resolution notification saying they are not satisfied, the ticket is reopened with urgency boosted by one level.
