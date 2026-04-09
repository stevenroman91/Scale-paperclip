---
name: Live Call Assistant
description: Real-time AI coaching during SDR calls — objection detection, response suggestions, post-call automation
slug: live-call-assistant
owner: cto
---

# Live Call Assistant — Implementation Plan

Feature différenciante du plan Scale. Assiste les SDR en temps réel pendant leurs appels de prospection.

## Objectif

MVP fonctionnel en 2 sprints (4 semaines).

## Sprint 1 — Foundation (semaines 1-2)

### 1. Prisma Schema

Ajouter dans `prisma/schema.prisma` :

```prisma
model LiveCallSession {
  id              String   @id @default(cuid())
  tenantId        String
  callId          String   @unique
  sdrId           String
  prospectName    String?
  prospectCompany String?
  prospectLinkedin String?
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?
  sentiment       String?  // positive, neutral, negative
  bantScore       Int?     // 4-20
  bantDetail      Json?
  transcript      Json?
  summary         String?
  nextSteps       String?
  emailSent       Boolean  @default(false)
  emailContent    String?
  calendarCreated Boolean  @default(false)
  calendarEventId String?
  crmNoteCreated  Boolean  @default(false)
  coachingScore   Int?     // /25
  coachingFeedback Json?

  objections      LiveCallObjection[]
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  sdr             User     @relation(fields: [sdrId], references: [id])

  @@index([tenantId, startedAt])
  @@index([sdrId, startedAt])
}

model LiveCallObjection {
  id                String   @id @default(cuid())
  sessionId         String
  detectedAt        DateTime @default(now())
  objectionType     String
  prospectText      String
  suggestedResponses Json?
  responseUsed      String?
  outcome           String?  // accepted, rejected, pivoted

  session           LiveCallSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([objectionType])
}

model ObjectionTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  objectionType   String
  technique       String
  responseText    String   @db.Text
  successRate     Float    @default(0)
  usageCount      Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, objectionType, technique])
  @@index([tenantId, objectionType])
}
```

### 2. API Routes

```
app/api/calls/live/
├── route.ts                    # POST: start session, GET: list active sessions
├── [sessionId]/
│   ├── route.ts                # GET: session detail, PATCH: update session
│   ├── transcript/route.ts     # GET: live transcript stream (SSE)
│   ├── suggestions/route.ts    # POST: analyze transcript chunk, return suggestions
│   ├── end/route.ts            # POST: end session, trigger post-call actions
│   ├── email/route.ts          # POST: generate and send recap email
│   ├── calendar/route.ts       # POST: create calendar event
│   └── feedback/route.ts       # GET: coaching feedback
├── objections/
│   ├── route.ts                # GET: list templates, POST: create template
│   └── [id]/route.ts           # PATCH: update template, DELETE: delete
└── analytics/route.ts          # GET: success rates, usage stats
```

### 3. Telephony Webhook Handler

```typescript
// app/api/webhooks/telephony/route.ts
// Receives call events from Ringover/Aircall/Talkdesk
// Events: call.started, call.answered, call.ended
// On call.started → create LiveCallSession
// On call.ended → trigger post-call pipeline
```

### 4. Plan Gating

Wrap the Live Call feature with `PlanGate`:
```tsx
<PlanGate requiredPlan="scale" feature="Live Call Assistant">
  <LiveCallDashboard />
</PlanGate>
```

## Sprint 2 — Real-time & UI (semaines 3-4)

### 5. Transcription Service

```typescript
// lib/services/transcription.ts
// Deepgram WebSocket connection per active call
// Receives audio chunks from telephony webhook
// Emits transcript events via Server-Sent Events to frontend
```

### 6. Objection Detection Service

```typescript
// lib/services/objection-detector.ts
// Receives transcript chunks
// Classifies using Claude with streaming
// Returns: { objectionType, confidence, suggestedResponses[] }
// Latency target: < 3 seconds
```

### 7. React Components

```
components/live-call/
├── LiveCallDashboard.tsx     # List of active/recent calls
├── LiveCallSidebar.tsx       # Main sidebar during call
├── ObjectionCard.tsx         # Single objection with responses
├── TranscriptView.tsx        # Live scrolling transcript
├── BantScoreCard.tsx         # Dynamic BANT score
├── PostCallActions.tsx       # Email, calendar, notes actions
├── CoachingFeedback.tsx      # Post-call score and tips
└── ObjectionManager.tsx      # Admin: manage objection templates
```

### 8. Post-Call Pipeline

```typescript
// lib/services/post-call.ts
// Triggered when call ends:
// 1. Generate summary via Claude
// 2. Calculate BANT score
// 3. Generate coaching feedback (/25)
// 4. Generate recap email (editable draft)
// 5. Detect meeting date → prepare calendar invite
// 6. Create CRM note
```

## Dépendances

| Dépendance | Version | Usage |
|------------|---------|-------|
| @anthropic-ai/sdk | latest | Claude for analysis |
| @deepgram/sdk | latest | Real-time transcription |
| googleapis | latest | Google Calendar |
| @sendgrid/mail | latest | Recap emails |

## Métriques de succès

- Latence objection detection < 3s
- SDR adoption > 60% dans le premier mois
- Δ conversion rate > +15% pour les SDR assistés
- Email recap sent rate > 95%
