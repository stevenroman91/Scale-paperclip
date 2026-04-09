---
name: Feedback to Fix Pipeline
description: Automated pipeline from user feedback to bug fix — triage, reproduce, fix, PR, deploy
slug: feedback-pipeline
owner: pm
---

# Feedback → Fix Pipeline — Implementation Plan

Pipeline automatisé : un user signale un bug → triage auto → reproduction → fix → PR → merge → deploy.

## Architecture

```
User Feedback ──→ Support Agent ──→ Auto Triage ──→ Bug Fixer ──→ CTO Review ──→ Deploy
    (widget)        (categorize)      (analyze)      (fix + PR)     (approve)      (Railway)
```

## Phase 1 — Feedback Collection Widget

### In-App Widget

```tsx
// components/feedback/FeedbackWidget.tsx
// Floating button bottom-right
// Click → modal with:
//   - Category: Bug 🐛 | Feature 💡 | Question ❓
//   - Description (free text)
//   - Screenshot (optional, via html2canvas)
//   - Auto-captured: page URL, browser, OS, user plan, user ID

'use client'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

// Auto-capture metadata
const getMetadata = () => ({
  pageUrl: window.location.href,
  browser: navigator.userAgent,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  timestamp: new Date().toISOString()
})
```

### Prisma Schema

```prisma
model Feedback {
  id            String   @id @default(cuid())
  tenantId      String
  userId        String
  userEmail     String
  userPlan      String   // starter, growth, scale
  source        String   // widget, email, chat, github
  category      String   // bug, feature, question, complaint, praise
  urgency       String   @default("medium") // critical, high, medium, low
  title         String
  description   String   @db.Text
  screenshotUrl String?
  metadata      Json?    // pageUrl, browser, os, appVersion
  status        String   @default("new") // new, triaged, in_progress, resolved, wont_fix
  assignedTo    String?  // support, pm, engineer, bug-fixer
  resolution    String?  @db.Text
  relatedPrUrl  String?
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?
  slaDeadline   DateTime?

  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  user          User     @relation(fields: [userId], references: [id])

  @@index([tenantId, status])
  @@index([category, urgency])
  @@index([status, slaDeadline])
}
```

### API Routes

```
app/api/feedback/
├── route.ts              # POST: create feedback, GET: list (filtered)
├── [id]/route.ts         # GET: detail, PATCH: update status/assignment
├── [id]/triage/route.ts  # POST: auto-triage with Claude
├── stats/route.ts        # GET: feedback stats (counts by category, urgency)
└── export/route.ts       # GET: CSV export
```

## Phase 2 — Auto-Triage

### Claude-based categorization

```typescript
// lib/services/feedback-triage.ts

const triageFeedback = async (feedback: Feedback) => {
  const result = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    messages: [{
      role: 'user',
      content: `Analyze this user feedback and categorize it.

Feedback: "${feedback.description}"
Page URL: ${feedback.metadata?.pageUrl}
User plan: ${feedback.userPlan}

Return JSON:
{
  "category": "bug" | "feature" | "question",
  "urgency": "critical" | "high" | "medium" | "low",
  "title": "short summary",
  "assignTo": "support" | "pm" | "bug-fixer",
  "tags": ["affected-feature"],
  "duplicateOf": null | "feedback-id if duplicate"
}

Urgency rules:
- critical: data loss, security, complete crash, all users affected
- high: feature broken for paying users, billing issue, Scale plan user
- medium: cosmetic bug, feature request from Growth+ user
- low: question, minor UI glitch, Starter plan feature request`
    }]
  })

  // Parse and update feedback with triage results
  // Set SLA deadline based on urgency
  // Route to appropriate team
}
```

### SLA Deadlines

| Urgency | Response SLA | Resolution SLA |
|---------|-------------|----------------|
| Critical | 2h | 8h |
| High | 8h | 24h |
| Medium | 24h | 72h |
| Low | 72h | 1 week |

## Phase 3 — Auto Bug Fix

### Bug Fixer workflow

```typescript
// lib/services/auto-bug-fix.ts

const autoFixBug = async (feedback: Feedback) => {
  // 1. Analyze the bug
  const analysis = await analyzeBug(feedback)
  // - Parse error from description/screenshot
  // - Search codebase for affected file
  // - Check recent git changes

  // 2. Estimate complexity
  if (analysis.complexity === 'trivial' || analysis.complexity === 'simple') {
    // 3. Generate fix
    const fix = await generateFix(analysis)

    // 4. Create branch and PR
    const branch = `fix/feedback-${feedback.id}`
    await createBranch(branch)
    await applyFix(fix)
    await createPR({
      title: `fix: ${feedback.title}`,
      body: `## What\n${fix.description}\n\n## Why\nFeedback: #${feedback.id}\n${feedback.description}\n\n## Testing\n${fix.testSteps}`,
      branch,
      reviewers: ['cto']
    })

    // 5. Update feedback status
    await updateFeedback(feedback.id, {
      status: 'in_progress',
      relatedPrUrl: pr.url
    })
  } else {
    // Complex bug → create task for Engineer
    await createTask({
      title: `Fix: ${feedback.title}`,
      description: analysis.report,
      assignee: 'engineer',
      priority: feedback.urgency
    })
  }
}
```

## Phase 4 — Dashboard

### Support Dashboard page

```
app/(dashboard)/feedback/
├── page.tsx              # Feedback list with filters
├── [id]/page.tsx         # Feedback detail + timeline
└── analytics/page.tsx    # Feedback analytics dashboard
```

### Key UI Components

```
components/feedback/
├── FeedbackWidget.tsx        # In-app collection widget
├── FeedbackList.tsx          # Filterable table
├── FeedbackDetail.tsx        # Detail view with timeline
├── FeedbackStats.tsx         # Stats cards (open, resolved, SLA)
├── TriageResult.tsx          # Show auto-triage results
└── FeedbackAnalytics.tsx     # Charts: volume, categories, resolution time
```

## Métriques

- Feedback response time vs SLA
- Auto-triage accuracy (verified by Support Agent)
- Bug auto-fix success rate
- MTTR (Mean Time To Resolve)
- User satisfaction post-resolution
