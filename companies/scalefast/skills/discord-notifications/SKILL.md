---
name: discord-notifications
description: Discord webhook integration — anti no-show reminders, performance alerts, daily recaps, RDV confirmations, with embed formatting and rate limiting
slug: discord-notifications
schema: agentcompanies/v1
tags:
  - discord
  - notifications
  - webhooks
  - anti-noshow
  - alerts
---

# Discord Notifications

Skill d'integration Discord par webhook pour les notifications operationnelles de ScaleFast. Couvre les rappels anti no-show, les alertes de performance, les recaps quotidiennes, et les confirmations de RDV.

## Discord Webhook API

### Endpoint

```
POST https://discord.com/api/webhooks/{webhook_id}/{webhook_token}
Content-Type: application/json
```

### Authentication

No additional auth required beyond the webhook URL itself. Webhook URLs are stored in environment variables per channel:

```
DISCORD_WEBHOOK_ANTI_NOSHOW=https://discord.com/api/webhooks/1234.../abc...
DISCORD_WEBHOOK_PERFORMANCE=https://discord.com/api/webhooks/5678.../def...
DISCORD_WEBHOOK_CLIENT_{CLIENT_ID}=https://discord.com/api/webhooks/9012.../ghi...
```

### Rate Limits

- **30 messages per minute** per webhook
- **10 embeds per message** maximum
- If > 30 messages needed in a batch: queue messages and send in 1-minute windows
- Track rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Embed Structure (Base)

```javascript
const discordEmbed = {
  embeds: [{
    title: "string — max 256 chars",
    description: "string — max 4096 chars",
    color: 0x3498DB,  // integer, decimal color value
    fields: [
      { name: "Field Name", value: "Field Value", inline: true }  // max 25 fields
    ],
    footer: { text: "ScaleFast — timestamp" },
    timestamp: new Date().toISOString()
  }]
};
```

### Color Codes

| Type | Color | Hex | Decimal |
|------|-------|-----|---------|
| Anti no-show reminder (J-2) | Orange | #F39C12 | 15965202 |
| Anti no-show reminder (J-1) | Red | #E74C3C | 15158332 |
| Performance alert | Red | #E74C3C | 15158332 |
| Daily recap | Blue | #3498DB | 3447003 |
| New RDV confirmation | Green | #2ECC71 | 3066993 |
| Weekly report | Purple | #9B59B6 | 10181046 |

## Message Formats

### 1. Anti No-Show Reminder

Sent automatically at 09h00 each business day for RDV at J+2 business days (calculated via `french-holidays` skill).

```javascript
const antiNoShowEmbed = {
  embeds: [{
    title: "📅 Rappel RDV — J-2",
    color: 15965202,
    fields: [
      { name: "Client", value: clientName, inline: true },
      { name: "SDR", value: sdrName, inline: true },
      { name: "Prospect", value: `${prospectName} — ${prospectTitle}`, inline: false },
      { name: "Entreprise", value: prospectCompany, inline: true },
      { name: "Date RDV", value: `${rdvDate} a ${rdvTime}`, inline: true },
      { name: "Statut relance", value: "⏳ En attente", inline: true }
    ],
    footer: { text: `RDV ID: ${rdvId} | ScaleFast Anti No-Show` },
    timestamp: new Date().toISOString()
  }],
  components: [{
    type: 1, // ACTION_ROW
    components: [{
      type: 2, // BUTTON
      style: 3, // SUCCESS
      label: "✅ J'ai relance",
      custom_id: `relance_done_${rdvId}`
    }, {
      type: 2,
      style: 4, // DANGER
      label: "❌ Prospect injoignable",
      custom_id: `relance_failed_${rdvId}`
    }]
  }]
};
```

**Note**: Discord webhook messages do not support interactive buttons natively. To implement "J'ai relance" tracking, use one of these approaches:

**Approach A — Callback URL (recommended):**
Include a unique URL in the embed description that the SDR clicks to confirm:
```
"Confirmer la relance : https://app.scalefast.fr/relance/confirm/{rdv_id}/{token}"
```
This hits an Express.js endpoint:

```javascript
// Route: POST /api/relance/confirm/:rdvId/:token
app.post('/api/relance/confirm/:rdvId/:token', async (req, res) => {
  const { rdvId, token } = req.params;
  if (!validateToken(token, rdvId)) return res.status(403).send('Invalid token');

  await db.query(
    'UPDATE rdv SET relance_status = $1, relance_at = NOW() WHERE id = $2',
    ['done', rdvId]
  );

  // Update Discord message to show confirmed status
  await updateDiscordMessage(rdvId, '✅ Relance confirmee');
  res.redirect('https://app.scalefast.fr/relance/merci');
});
```

**Approach B — Discord Bot (alternative):**
Use a Discord bot alongside webhooks. The bot listens for button interactions and updates the database. Requires Discord Gateway connection and INTERACTION_CREATE event handling.

### 2. Performance Alert

Sent immediately when a threshold is breached (triggered by `sales-kpi-tracking` alert check).

```javascript
const performanceAlertEmbed = {
  embeds: [{
    title: "⚠️ Alerte Performance",
    color: 15158332,
    fields: [
      { name: "SDR", value: sdrName, inline: true },
      { name: "Niveau", value: sdrLevel, inline: true },
      { name: "Metrique", value: metricName, inline: false },
      { name: "Valeur actuelle", value: `${currentValue}`, inline: true },
      { name: "Objectif", value: `${targetValue}`, inline: true },
      { name: "Tendance", value: trendArrow, inline: true },  // "📉 -15% vs semaine derniere"
      { name: "Duree", value: `${consecutiveDays} jours consecutifs`, inline: false },
      { name: "Action recommandee", value: recommendedAction, inline: false }
    ],
    footer: { text: `Alert ID: ${alertId} | ScaleFast Performance` },
    timestamp: new Date().toISOString()
  }]
};
```

Trend arrow logic:
```javascript
function getTrendArrow(currentValue, previousValue) {
  const delta = ((currentValue - previousValue) / previousValue) * 100;
  if (delta > 5) return `📈 +${delta.toFixed(1)}% vs semaine derniere`;
  if (delta < -5) return `📉 ${delta.toFixed(1)}% vs semaine derniere`;
  return `➡️ Stable (${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`;
}
```

### 3. Daily Recap

Sent every business day at 18h30 CET in #recap-quotidien internal channel.

```javascript
const dailyRecapEmbed = {
  embeds: [{
    title: `📊 Recap du ${formatDateFR(today)}`,
    color: 3447003,
    description: `**Equipe** : ${totalSDRsActive} SDRs actifs`,
    fields: [
      { name: "Total appels", value: `${totalCalls}`, inline: true },
      { name: "Total connexions", value: `${totalConnected} (${connectRate}%)`, inline: true },
      { name: "Total RDV poses", value: `${totalRDV}`, inline: true },
      { name: "🏆 Top performeur", value: `${topSDR.name} — ${topSDR.calls} appels, ${topSDR.rdv} RDV`, inline: false },
      { name: "Alertes actives", value: `${openAlerts} alerte(s) en cours`, inline: true }
    ],
    footer: { text: "ScaleFast Daily Recap" },
    timestamp: new Date().toISOString()
  }]
};
```

### 4. New RDV Confirmation

Sent immediately when an SDR books a new appointment.

```javascript
const newRDVEmbed = {
  embeds: [{
    title: "🎯 Nouveau RDV pose !",
    color: 3066993,
    fields: [
      { name: "SDR", value: sdrName, inline: true },
      { name: "Client", value: clientName, inline: true },
      { name: "Prospect", value: `${prospectName}\n${prospectTitle} @ ${prospectCompany}`, inline: false },
      { name: "Date", value: `${rdvDate} a ${rdvTime}`, inline: true },
      { name: "Type", value: rdvType, inline: true },  // "Visio" or "Telephone"
      { name: "Source", value: sourceChannel, inline: true }  // "Appel froid", "LinkedIn", "Email"
    ],
    footer: { text: `RDV ID: ${rdvId} | ScaleFast` },
    timestamp: new Date().toISOString()
  }]
};
```

## Webhook Configuration

| Channel | Webhook Variable | Purpose |
|---------|------------------|---------|
| #rappels-anti-noshow | DISCORD_WEBHOOK_ANTI_NOSHOW | Daily anti no-show reminders |
| #alertes-performance | DISCORD_WEBHOOK_PERFORMANCE | Performance threshold alerts |
| #recap-quotidien | DISCORD_WEBHOOK_DAILY_RECAP | End-of-day team recap |
| #nouveaux-rdv | DISCORD_WEBHOOK_NEW_RDV | Real-time RDV notifications |
| #client-{slug} | DISCORD_WEBHOOK_CLIENT_{ID} | Per-client channels for reports |

## Sending Logic

```javascript
const axios = require('axios');

async function sendDiscordWebhook(webhookUrl, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.status === 204) return { success: true };

    } catch (error) {
      if (error.response) {
        const { status, headers } = error.response;

        // Rate limited — wait and retry
        if (status === 429) {
          const retryAfter = parseFloat(headers['retry-after'] || '1') * 1000;
          console.warn(`Rate limited. Retrying in ${retryAfter}ms (attempt ${attempt}/${retries})`);
          await sleep(retryAfter);
          continue;
        }

        // Webhook deleted or invalid
        if (status === 404) {
          console.error(`Webhook not found (404). URL may be deleted: ${webhookUrl.slice(0, 60)}...`);
          await alertOpsWebhookDeleted(webhookUrl);
          return { success: false, error: 'webhook_deleted' };
        }

        // Bad request — payload issue
        if (status === 400) {
          console.error(`Bad request (400): ${JSON.stringify(error.response.data)}`);
          return { success: false, error: 'bad_request', details: error.response.data };
        }
      }

      // Network or timeout error — exponential backoff
      const backoff = Math.pow(5, attempt) * 1000; // 5s, 25s, 125s
      console.warn(`Attempt ${attempt} failed. Retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }

  console.error(`All ${retries} attempts failed for webhook`);
  return { success: false, error: 'max_retries_exceeded' };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
```

## Batch Sending

When multiple messages need to be sent to the same webhook (e.g., 15 anti no-show reminders at 9h00):

```javascript
async function sendBatch(webhookUrl, payloads) {
  const RATE_LIMIT = 30; // messages per minute
  const results = [];

  for (let i = 0; i < payloads.length; i++) {
    if (i > 0 && i % RATE_LIMIT === 0) {
      console.log(`Rate limit reached. Pausing for 60 seconds...`);
      await sleep(60000);
    }
    const result = await sendDiscordWebhook(webhookUrl, payloads[i]);
    results.push(result);
    await sleep(100); // 100ms between messages to stay well under limit
  }

  return results;
}
```

## Confirmation Tracking

### Database Table

```sql
CREATE TABLE relance_tracking (
  id          SERIAL PRIMARY KEY,
  rdv_id      INTEGER REFERENCES rdv(id),
  sdr_id      INTEGER REFERENCES sdr_profiles(id),
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed', 'no_answer')),
  reminder_sent_at TIMESTAMP NOT NULL,
  confirmed_at     TIMESTAMP,
  discord_message_id VARCHAR(30),
  token       VARCHAR(64) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Workflow

```
1. 09h00 : Send anti no-show reminders for RDV at J+2 business days
2. SDR clicks confirmation URL in Discord message
3. Express endpoint validates token and updates relance_tracking
4. Discord message is edited to show "✅ Relance confirmee a [HH:MM]"
5. If no confirmation by 14h00 : send follow-up reminder
6. If no confirmation by 17h00 : escalate to Sales Ops Manager
```

## Error Handling

| Error | HTTP Status | Action |
|-------|-------------|--------|
| Rate limited | 429 | Wait `Retry-After` header duration, then retry |
| Webhook deleted | 404 | Alert Sales Ops Manager, skip further sends to this URL |
| Bad request | 400 | Log payload for debugging, do not retry |
| Network timeout | — | Exponential backoff: 5s, 25s, 125s |
| All retries exhausted | — | Log error, alert in application monitoring |
| Embed too large | 400 | Truncate description to 4096 chars, fields to 25 max |

## Integration Points

- **french-holidays**: determines business days for anti no-show reminder scheduling
- **sales-kpi-tracking**: provides performance data for alerts and daily recaps
- **client-reporting**: triggers weekly report delivery to client channels
- **call-analysis**: can trigger notifications for exceptional call scores
