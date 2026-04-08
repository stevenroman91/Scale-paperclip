---
name: conversational-ai
description: Framework chatbot — gestion du contexte conversationnel, detection d'intention, slot filling, handoff humain
slug: conversational-ai
---

# Conversational AI

Chatbot framework powering the CS Bot (customer support) and Sales Bot (lead qualification) for ScaleHQ.

## Conversation State Machine

```
  [greeting]
      |
      v
  [intent_detection] <--- user sends a new message
      |
      v
  [slot_filling] -------> (loop until all required slots filled)
      |
      v
  [action_execution] ---> (call API, query DB, search KB)
      |
      v
  [response] -----------> send answer to user
      |
      v
  [follow_up] ----------> "Did this help?" / "Anything else?"
      |           |
      v           v
   [end]    [intent_detection] (new question in same session)
```

### State Transitions

| From               | To                  | Trigger                                          |
|--------------------|---------------------|--------------------------------------------------|
| greeting           | intent_detection    | User sends first message                         |
| intent_detection   | slot_filling        | Intent detected with missing required slots      |
| intent_detection   | action_execution    | Intent detected with all slots already present    |
| intent_detection   | handoff             | Intent is `talk_to_human` or confidence < 60%    |
| slot_filling       | slot_filling        | User provides partial info, more slots needed     |
| slot_filling       | action_execution    | All required slots filled                         |
| slot_filling       | handoff             | User frustrated (3+ failed slot attempts)        |
| action_execution   | response            | Action completed                                  |
| action_execution   | handoff             | Action failed or requires human authorization     |
| response           | follow_up           | Answer delivered                                  |
| follow_up          | intent_detection    | User has another question                         |
| follow_up          | end                 | User says "no" / "thanks" / 5-min inactivity     |

### Session Persistence

```typescript
interface ConversationSession {
  id: string;
  user_id: string;
  bot_type: "cs" | "sales";
  state: "greeting" | "intent_detection" | "slot_filling" | "action_execution" | "response" | "follow_up" | "end" | "handoff";
  current_intent?: string;
  slots: Record<string, string>;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  language: "fr" | "en";
  started_at: Date;
  ended_at?: Date;
  resolution: "resolved_by_bot" | "escalated_to_human" | "abandoned" | null;
  csat_score?: number;
}
```

Sessions are stored in PostgreSQL via Prisma. Active sessions expire after 30 minutes of inactivity.

## Intent Taxonomy

### Support Intents (CS Bot)

| Intent              | Description                              | Required Slots                        |
|---------------------|------------------------------------------|---------------------------------------|
| `help_with_feature` | User needs help using a feature          | feature_name                          |
| `report_bug`        | User wants to report a bug               | description, affected_feature, urgency |
| `billing_question`  | Question about billing/subscription      | topic (invoice/plan/payment/cancel)   |
| `account_issue`     | Login, permissions, team management      | issue_type                            |
| `integration_help`  | Help with API, webhook, or third-party   | integration_name                      |

### Sales Intents (Sales Bot)

| Intent               | Description                              | Required Slots                                         |
|----------------------|------------------------------------------|--------------------------------------------------------|
| `pricing_question`   | Wants to know about pricing/plans        | (none — answer from knowledge base)                    |
| `demo_request`       | Wants to schedule a demo                 | name, email, company, company_size, use_case, preferred_time |
| `feature_comparison` | Comparing ScaleHQ with competitors       | competitor_name                                        |
| `plan_upgrade`       | Current user wants to upgrade            | current_plan, desired_plan                             |

### Meta Intents (Both Bots)

| Intent            | Description                            | Action                                    |
|-------------------|----------------------------------------|-------------------------------------------|
| `talk_to_human`   | User explicitly asks for human support | Immediate handoff                          |
| `language_switch` | User switches language                 | Update session.language, confirm in new language |
| `repeat_last`     | User asks to repeat                    | Resend last assistant message              |
| `start_over`      | User wants to restart conversation     | Clear slots, go to intent_detection        |

## Slot Filling Patterns

### Demo Request Flow
```
Bot: "I'd be happy to schedule a demo for you! What's your name?"
User: "Marie Dupont"
Bot: "Nice to meet you, Marie! What's your professional email?"
User: "marie@agence-prospect.fr"
Bot: "And what's the name of your agency?"
User: "Agence Prospect"
Bot: "How many SDRs does your team have?"
User: "About 15"
Bot: "What's your main use case for ScaleHQ? (e.g., call tracking, enrichment, appointment booking)"
User: "We need better call tracking and reporting"
Bot: "When would be a good time for a 30-minute demo? (We're available Mon-Fri, 9h-18h CET)"
User: "Thursday afternoon"
Bot: "I've scheduled a demo for Thursday at 14h CET. You'll receive a confirmation at marie@agence-prospect.fr. Is there anything else I can help with?"
```

### Bug Report Flow
```
Bot: "I'm sorry you're experiencing an issue. Can you describe what happened?"
User: "The CSV export is broken, it shows weird characters"
Bot: "I understand — the CSV export is showing incorrect characters. Which feature were you using? (Calls export, RDV export, Enrichment export)"
User: "Calls export"
Bot: "How urgent is this for you? (Critical — blocking my work / High — need it soon / Medium — can wait a bit)"
User: "High, I need to send a report to my client today"
Bot: "I've created a bug report (FB-152) marked as high priority. Our team will look into this within 8 hours. In the meantime, you can try exporting from the dashboard using the 'Copy to clipboard' option as a workaround. Is there anything else?"
```

## Claude Prompt Structure

### System Prompt Template
```
You are the ScaleHQ {cs|sales} assistant. You help SDR agencies with {support questions|exploring ScaleHQ}.

Tone: Professional but friendly. Use "vous" in French (formal). Be concise.

Your capabilities:
- Search the knowledge base for answers
- Create support tickets for bugs
- Schedule demos (sales bot only)
- Check account status and billing info

Rules:
- Maximum 3 sentences per message
- Always suggest a next action or ask a clarifying question
- Never promise specific fix timelines (say "our team will investigate")
- Never share other users' data
- If you're not sure, say so and offer to connect with a human
- Do not make up features that don't exist

Available actions you can take:
- search_kb(query): Search knowledge base
- create_ticket(category, description, urgency): Create support ticket
- get_account_info(user_id): Get user's plan and account details
- schedule_demo(slots): Schedule a demo meeting
- handoff(reason): Transfer to human agent
```

### User Context Injection

Before each response, inject user context into the system prompt:
```
Current user context:
- Plan: Growth
- Account age: 6 months
- Team size: 8 SDRs
- Recent support tickets: 2 open (FB-148: billing question, FB-150: feature request)
- Feature usage: Calls (daily), RDV (weekly), Enrichment (never used)
- Language preference: French
```

This context enables personalized responses (e.g., suggesting features the user hasn't tried, acknowledging open tickets).

### Response Constraints
- Max 3 sentences per message (keep it scannable in chat UI)
- Always end with a question or suggested action
- Use markdown sparingly (bold for emphasis, links for resources)
- Include relevant KB article links when available
- For code/technical answers, use inline code formatting

## Handoff Protocol

Triggered when:
- Bot confidence < 60% on intent detection
- User explicitly asks for human (`talk_to_human` intent)
- Slot filling fails 3+ times (user frustrated)
- Topic involves billing changes, account deletion, or legal matters
- Detected negative sentiment (anger, frustration keywords)

### Handoff Process
1. Bot: "I'm going to connect you with a team member who can better help with this."
2. Create a support ticket via `user-feedback-pipeline` with:
   - Full conversation transcript
   - Detected intent and collected slots
   - Reason for escalation
   - User's account context
3. Notify Support Agent via Discord with ticket link
4. Set session state to `handoff`
5. If Support Agent not available within 5 minutes, send email to support@scalehq.io as fallback

### Handoff Context Format
```json
{
  "conversation_id": "conv_abc123",
  "user": { "email": "marie@example.fr", "plan": "growth", "name": "Marie Dupont" },
  "intent": "billing_question",
  "slots_collected": { "topic": "cancellation" },
  "escalation_reason": "User requested human agent for cancellation discussion",
  "transcript": [
    { "role": "user", "content": "Je veux annuler mon abonnement" },
    { "role": "assistant", "content": "Je comprends. Je vais vous mettre en relation avec notre equipe pour discuter de votre abonnement." }
  ],
  "sentiment": "neutral"
}
```

## Multi-Language Support

- **Language detection**: analyze the first user message. French is the default. Switch to English if the message is clearly in English.
- **Response language**: match the detected language for the entire session
- **Language switch**: if user switches mid-conversation (e.g., starts in French, switches to English), detect and adapt. Confirm: "I'll continue in English. / Je continue en francais."
- **Knowledge base**: search in both languages, prefer results in the user's detected language
- **Slot filling prompts**: maintain separate prompt templates for French and English

## Edge Cases

- **Multiple intents in one message**: "I want to report a bug and also ask about pricing" — detect both, handle the first (bug report), then follow up with the second (pricing).
- **Gibberish/spam input**: if 2+ consecutive messages are unrecognizable, respond: "I'm having trouble understanding. Could you rephrase? Or I can connect you with a team member."
- **Returning user**: if a user has an open ticket, proactively mention it: "I see you have an open ticket (FB-148) about billing. Would you like an update on that?"
- **Off-topic conversation**: politely redirect: "I'm best at helping with ScaleHQ-related questions. Is there something about the platform I can help with?"
- **Sensitive data**: if user shares passwords or credit card numbers in chat, do NOT store them. Respond: "For security, please don't share passwords or card numbers here. You can update payment info securely in Settings > Billing."
