---
name: live-call-assistant
description: Live call coaching feature for ScaleHQ SaaS — real-time objection detection, response suggestions, and post-call automation for SDR agencies
slug: live-call-assistant
version: 0.1.0
tags:
  - sales
  - real-time
  - saas-feature
  - telephony
---

# Live Call Assistant — ScaleHQ SaaS Feature

Ce skill décrit l'implémentation du Live Call Assistant en tant que **feature du produit ScaleHQ SaaS** (disponible sur le plan Scale). Les agences SDR clientes de ScaleHQ pourront activer cette feature pour leurs propres SDR.

## Positionnement produit

| Plan | Accès |
|------|-------|
| Starter | ❌ Non disponible |
| Growth | ❌ Non disponible (aperçu flouté + CTA upgrade) |
| Scale | ✅ Inclus (jusqu'à X SDR simultanés selon licence) |

C'est une feature **différenciante majeure** qui justifie le plan Scale.

## Architecture SaaS (multi-tenant)

```
┌─────────────────────────────────────────────┐
│              ScaleHQ Backend                 │
│                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Telephony│  │Transcriber│  │ Analyzer  │ │
│  │ Gateway  │  │  Service  │  │  Service  │ │
│  │(per-tenant│  │(Deepgram/ │  │ (Claude)  │ │
│  │ webhook) │  │ Whisper)  │  │           │ │
│  └────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼─────┐  │
│  │         Real-time Event Bus            │  │
│  │    (WebSocket per active call)         │  │
│  └────────────────┬───────────────────────┘  │
│                   │                          │
│  ┌────────────────▼───────────────────────┐  │
│  │      Tenant-scoped Data Store          │  │
│  │  (objection DB, response DB, CRM)      │  │
│  └────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────┘
                       │ WebSocket
              ┌────────▼─────────┐
              │   Client App     │
              │  (SDR Sidebar)   │
              └──────────────────┘
```

## Différences avec le skill ScaleFast (interne)

| Aspect | ScaleFast (interne) | ScaleHQ (SaaS) |
|--------|--------------------:|----------------:|
| Tenant | Single (ScaleFast) | Multi-tenant |
| Objection DB | Globale partagée | Par tenant (agence) |
| Config | Hardcoded | Configurable par client |
| Téléphonie | Ringover | Ringover, Aircall, Talkdesk |
| Billing | N/A | Metered (par minute d'appel assisté) |
| Plan gating | N/A | Scale plan uniquement (PlanGate component) |

## Implémentation Next.js

### API Routes

```typescript
// app/api/calls/live/route.ts — WebSocket upgrade pour le flux temps réel
// app/api/calls/live/[callId]/suggestions/route.ts — GET suggestions pour un appel
// app/api/calls/live/[callId]/transcript/route.ts — GET transcription en cours
// app/api/calls/live/[callId]/end/route.ts — POST fin d'appel → actions post-appel
// app/api/calls/live/[callId]/feedback/route.ts — POST scoring post-appel

// app/api/objections/route.ts — CRUD objection database (per tenant)
// app/api/objections/[id]/responses/route.ts — CRUD response templates
// app/api/objections/analytics/route.ts — GET success rates par objection/réponse
```

### Prisma Schema additions

```prisma
model LiveCallSession {
  id              String   @id @default(cuid())
  tenantId        String
  callId          String   @unique // from telephony provider
  sdrId           String
  prospectName    String?
  prospectCompany String?
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  durationSeconds Int?
  sentiment       String?  // positive, neutral, negative
  bantScore       Int?     // 4-20
  bantDetail      Json?    // { budget, authority, need, timeline }
  transcript      Json?    // full transcript
  summary         String?
  nextSteps       String?
  emailSent       Boolean  @default(false)
  calendarCreated Boolean  @default(false)
  crmNoteCreated  Boolean  @default(false)
  
  objections      LiveCallObjection[]
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  sdr             User     @relation(fields: [sdrId], references: [id])
}

model LiveCallObjection {
  id              String   @id @default(cuid())
  sessionId       String
  detectedAt      DateTime @default(now())
  objectionType   String   // price, competitor, timing, authority, need, email, trust
  prospectText    String   // what the prospect said
  suggestedResponse String?
  responseUsed    String?  // which response the SDR actually used
  outcome         String?  // accepted, rejected, pivoted
  
  session         LiveCallSession @relation(fields: [sessionId], references: [id])
}

model ObjectionTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  objectionType   String
  technique       String   // name of the response technique
  responseText    String
  successRate     Float    @default(0)
  usageCount      Int      @default(0)
  isActive        Boolean  @default(true)
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, objectionType, technique])
}
```

### React Component — SDR Sidebar

```typescript
// components/live-call/LiveCallSidebar.tsx
// - Affiche les infos prospect en temps réel
// - Liste les suggestions d'objections avec bouton "Utiliser"
// - Transcription live avec highlighting des objections
// - Score BANT dynamique
// - Post-appel : preview email + bouton envoyer, preview invitation + bouton créer

// components/live-call/ObjectionCard.tsx
// - Type d'objection détectée
// - 2-3 réponses suggérées classées par success_rate
// - Bouton "Utiliser" qui log la réponse choisie
// - Animation d'apparition (slide in from right, 300ms)

// components/live-call/PostCallActions.tsx
// - Email récap (editable avant envoi)
// - Invitation calendrier (date/heure pré-remplies)
// - Notes CRM (résumé auto, éditable)
// - Score coaching (/25) avec feedback
```

### Billing (Stripe metering)

```typescript
// Chaque minute d'appel assisté = 1 unit sur le usage meter Stripe
// Prix : inclus dans le plan Scale (fair use), ou metered au-delà du quota

const reportUsage = async (tenantId: string, minutes: number) => {
  await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    { quantity: minutes, timestamp: Math.floor(Date.now() / 1000), action: 'increment' }
  );
};
```

## Configuration par tenant

```json
{
  "live_call_assistant": {
    "enabled": true,
    "telephony_provider": "ringover",
    "transcription_provider": "deepgram",
    "auto_email": false,
    "auto_calendar": true,
    "auto_crm_notes": true,
    "coaching_feedback": true,
    "objection_detection_sensitivity": "medium",
    "language": "fr",
    "custom_objections": []
  }
}
```

## Métriques produit à tracker

- **Adoption** : % de tenants Scale qui activent la feature
- **Engagement** : appels assistés / total appels par tenant
- **Efficacité** : Δ conversion rate avant/après activation
- **Rétention** : churn rate des tenants Scale avec vs sans Live Call
- **Revenue** : impact sur l'upgrade Starter/Growth → Scale
