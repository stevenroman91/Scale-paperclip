---
name: chat-analytics
description: Analyse des conversations — sujets recurrents, taux de resolution, CSAT, identification des lacunes de la knowledge base
slug: chat-analytics
---

# Chat Analytics

Conversation analysis, performance metrics, and insight generation for ScaleHQ chatbots (CS Bot and Sales Bot).

## Per-Conversation Metrics

Captured at the end of each conversation session (on state transition to `end` or `handoff`):

```typescript
interface ConversationMetrics {
  conversation_id: string;
  bot_type: "cs" | "sales";
  user_id: string;
  user_plan: "starter" | "growth" | "scale";

  // Resolution
  resolution: "resolved_by_bot" | "escalated_to_human" | "abandoned";
  resolution_reason?: string;        // e.g., "user requested human", "low confidence"

  // Volume
  message_count_user: number;
  message_count_bot: number;
  total_messages: number;

  // Timing
  started_at: Date;
  ended_at: Date;
  duration_seconds: number;
  time_to_first_response_ms: number;
  time_to_resolution_seconds: number;

  // Quality
  csat_score?: number;               // 1-5 stars, null if user skipped
  intent_detected: string;
  intent_confidence: number;         // 0-1
  kb_articles_used: string[];        // IDs of KB chunks referenced
  kb_gap_detected: boolean;          // true if no good KB match found

  // Context
  language: "fr" | "en";
  source: "widget" | "intercom" | "api";
  page_url?: string;                 // where the chat was initiated
}
```

### CSAT Collection

After the conversation ends (resolution = `resolved_by_bot`), display a rating prompt:
```
Bot: "How would you rate this interaction?"
[1 star] [2 stars] [3 stars] [4 stars] [5 stars]
[Skip]
```

- Only shown for bot-resolved conversations (not escalated or abandoned)
- Auto-dismiss after 60 seconds if no response (recorded as null)
- Optional follow-up text field for scores <= 3: "How can we improve?"

## Aggregate Metrics

Computed daily, stored as snapshot records for trend analysis:

### Primary KPIs

| Metric              | Formula                                    | Target   | Alert Threshold |
|--------------------|--------------------------------------------|----------|-----------------|
| Bot Resolution Rate | resolved_by_bot / total x 100              | > 70%    | < 60%           |
| Average CSAT        | mean(csat_score) where not null            | > 4.0    | < 3.5           |
| Escalation Rate     | escalated_to_human / total x 100           | < 20%    | > 30%           |
| Abandonment Rate    | abandoned / total x 100                    | < 10%    | > 15%           |
| Avg Response Time   | mean(time_to_first_response_ms)            | < 2000ms | > 5000ms        |
| Avg Resolution Time | mean(time_to_resolution_seconds)           | < 120s   | > 300s          |

### Secondary Metrics

- **Top 10 intents by volume**: rank intents by conversation count, broken down by bot_type
- **Resolution rate by intent**: identify which intents the bot handles well vs. poorly
- **CSAT by intent**: correlate satisfaction with specific topic areas
- **Conversations by user plan**: distribution of chat usage across Starter / Growth / Scale plans
- **Peak hours**: hourly distribution of conversations to inform staffing/bot capacity
- **Repeat users**: users who initiate >3 conversations per week (may indicate unresolved issues)

### Aggregate Data Model

```typescript
interface DailyAnalytics {
  date: Date;
  bot_type: "cs" | "sales";

  total_conversations: number;
  resolved_by_bot: number;
  escalated_to_human: number;
  abandoned: number;

  avg_csat: number;
  csat_responses: number;           // how many users rated
  csat_distribution: number[];      // [count_1star, count_2star, ..., count_5star]

  avg_messages_per_conversation: number;
  avg_duration_seconds: number;
  avg_first_response_ms: number;
  avg_resolution_seconds: number;

  top_intents: Array<{
    intent: string;
    count: number;
    resolution_rate: number;
    avg_csat: number;
  }>;

  language_distribution: { fr: number; en: number };
  plan_distribution: { starter: number; growth: number; scale: number };
}
```

## Gap Analysis

### Unresolved Query Clustering

Weekly job that clusters unresolved conversations to identify systemic issues:

1. Collect all conversations from the past week where `resolution != "resolved_by_bot"`
2. Extract the user's primary query (first substantive message)
3. Generate embeddings for each query
4. Cluster using cosine similarity (threshold > 0.80 = same topic)
5. Rank clusters by size (most common unresolved topics first)

### Output: Top 5 Missing KB Articles

```typescript
interface KBGapReport {
  week_of: Date;
  gaps: Array<{
    rank: number;
    topic: string;              // Claude-generated topic summary
    sample_queries: string[];   // 3 representative user messages
    query_count: number;        // how many times this topic appeared
    current_closest_kb: string; // title of the closest existing KB article
    similarity_to_closest: number;
    recommended_action: "create_article" | "update_article" | "add_faq";
  }>;
}
```

Example:
```
Gap #1: "Aircall Integration Setup" (12 queries)
  Sample: "How do I connect Aircall?", "Aircall integration not working", "Setup telephony"
  Closest KB: "Integrations Overview" (similarity: 0.62)
  Action: Create dedicated setup guide

Gap #2: "Bulk Operations on Calls" (8 queries)
  Sample: "Delete multiple calls", "Bulk edit call status", "Select all and archive"
  Closest KB: "Call Management Guide" (similarity: 0.58)
  Action: Add section to existing guide (or document as known limitation)
```

### "I Don't Know" Tracking

Track every time the bot responds with variants of "I don't have information about that":
- Group by detected intent / topic
- If the same topic triggers >5 "I don't know" responses in a week, auto-create a KB gap entry
- Feed into the weekly gap report

## Reporting Cadence

### Daily Summary (automated, posted to Discord #analytics)

```markdown
## Chat Analytics — 2026-04-07

| Metric           | CS Bot | Sales Bot | Combined |
|------------------|--------|-----------|----------|
| Conversations    | 45     | 12        | 57       |
| Resolution Rate  | 73.3%  | 66.7%     | 71.9%    |
| Avg CSAT         | 4.2    | 4.0       | 4.1      |
| Escalation Rate  | 17.8%  | 25.0%     | 19.3%    |
| Abandonment Rate | 8.9%   | 8.3%      | 8.8%     |

Top intent today: help_with_feature (18 conversations)
Notable: 3 conversations about "WhatsApp integration" — no KB article exists
```

### Weekly Deep Dive (Monday, emailed to PM + CS Bot Manager)

Includes:
- All daily summary metrics aggregated for the week
- Week-over-week trends (arrows for up/down)
- Top 5 KB gaps with recommended actions
- CSAT distribution chart (1-5 stars histogram)
- Escalation analysis: top reasons for escalation
- Notable conversations: best-rated (5 stars with comment) and worst-rated (1-2 stars with comment)

### Monthly Strategic Review (1st of month, emailed to CEO + PM)

Includes:
- Month-over-month KPI trends
- Bot ROI estimate: conversations handled by bot x estimated cost per human interaction ($5) = savings
- Strategic recommendations: where to invest in KB content, bot capability improvements
- User satisfaction correlation with churn data (if available from billing)

## Alert Rules

| Condition                                          | Alert To          | Channel         | Action                                    |
|----------------------------------------------------|-------------------|-----------------|-------------------------------------------|
| Daily avg CSAT < 3.5                               | CS Bot Manager    | Discord + email | Review low-CSAT conversations, improve KB |
| Daily escalation rate > 30%                        | PM                | Discord         | Investigate common escalation reasons      |
| New recurring topic (>10 queries/week, no KB match)| CS Bot Manager    | Discord         | Create KB article for the topic            |
| Abandonment rate > 15% for 3 consecutive days      | PM + CS Bot Manager| Email          | Analyze abandonment patterns, check bot UX |
| Bot resolution rate drops >10% week-over-week      | PM                | Discord         | Check for new issues or bot regression     |
| Zero conversations in 6 hours (during business hours)| DevOps          | Discord         | Check if chat widget is functioning        |

Alert implementation: Paperclip routine runs daily at 23:00 UTC, computes metrics for the day, evaluates alert conditions, and sends notifications via Discord webhook or email.

## Data Retention

- Raw conversation transcripts: retained for 12 months, then anonymized (user identifiers removed)
- Aggregated daily metrics: retained indefinitely
- CSAT scores: retained for 24 months with conversation link
- Gap analysis reports: retained indefinitely

## Edge Cases

- **CSAT bias**: users who had a bad experience are more likely to rate. Normalize by comparing rating rate across satisfaction levels. If <20% of resolved conversations are rated, the CSAT metric is flagged as "low confidence."
- **Bot changes mid-period**: if the bot prompt or KB is updated mid-week, add a marker in the analytics timeline to correlate metric changes with bot updates.
- **Multi-session users**: a single user issue spanning multiple sessions should be tracked as one "journey." Link sessions by user_id within a 24-hour window on the same topic.
- **Sales bot seasonality**: demo requests spike at quarter-end. Compare metrics to same period last quarter, not just previous week.
- **After-hours conversations**: conversations started outside business hours (18h-9h CET) may have higher abandonment (no human available for handoff). Report separately.
