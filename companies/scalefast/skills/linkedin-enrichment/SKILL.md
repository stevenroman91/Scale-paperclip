---
name: linkedin-enrichment
description: Waterfall enrichment APIs — Kaspr then FullEnrich, deduplication, failure cache 24h, cost tracking per provider, daily limits per SDR
slug: linkedin-enrichment
schema: agentcompanies/v1
tags:
  - enrichment
  - linkedin
  - kaspr
  - fullenrich
  - waterfall
  - cost-tracking
---

# LinkedIn Enrichment

Skill d'enrichissement de donnees prospects par waterfall d'APIs a partir de profils LinkedIn. L'objectif est d'obtenir le numero de telephone direct et l'email professionnel de chaque prospect au cout le plus bas possible.

## API Integrations

### Kaspr (Priority 1 — cheaper)

- **Base URL**: `https://api.kaspr.io/v1`
- **Authentication**: `x-api-key` header
- **Cost**: 0.36 EUR per successful lookup
- **Rate limit**: 100 requests/minute
- **Speciality**: Direct phone numbers, high success rate in France

#### Search by LinkedIn URL

```javascript
const axios = require('axios');

async function enrichWithKaspr(linkedinUrl) {
  try {
    const response = await axios.post('https://api.kaspr.io/v1/search/linkedin', {
      linkedin_url: linkedinUrl
    }, {
      headers: {
        'x-api-key': process.env.KASPR_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const { data } = response;

    if (data.phone && data.phone.length > 0) {
      return {
        success: true,
        provider: 'kaspr',
        phone: data.phone[0].number,
        phone_type: data.phone[0].type,  // 'mobile', 'direct', 'office'
        email: data.email || null,
        cost: 0.36,
        raw: data
      };
    }

    return { success: false, provider: 'kaspr', reason: 'no_phone_found', cost: 0.36 };

  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('KASPR_RATE_LIMIT');
    }
    if (error.response?.status === 402) {
      throw new Error('KASPR_NO_CREDITS');
    }
    return { success: false, provider: 'kaspr', reason: error.message, cost: 0 };
  }
}
```

### FullEnrich (Priority 2 — fallback)

- **Base URL**: `https://api.fullenrich.com/v1`
- **Authentication**: Bearer token in `Authorization` header
- **Cost**: 0.49 EUR per successful lookup
- **Rate limit**: 60 requests/minute
- **Speciality**: Broader coverage, includes email + phone
- **Note**: Async API — returns `request_id`, requires polling

#### Enrich Request

```javascript
async function enrichWithFullEnrich(linkedinUrl) {
  // Step 1: Submit enrichment request
  const submitResponse = await axios.post('https://api.fullenrich.com/v1/enrich', {
    linkedin_url: linkedinUrl
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.FULLENRICH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  const { request_id } = submitResponse.data;

  // Step 2: Poll for result (max 30 seconds, poll every 2 seconds)
  const maxAttempts = 15;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(2000);

    const pollResponse = await axios.get(
      `https://api.fullenrich.com/v1/enrich/${request_id}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.FULLENRICH_API_KEY}` },
        timeout: 10000
      }
    );

    const { status, data } = pollResponse.data;

    if (status === 'completed') {
      if (data.phone && data.phone.length > 0) {
        return {
          success: true,
          provider: 'fullenrich',
          phone: data.phone[0].number,
          phone_type: data.phone[0].type,
          email: data.email || null,
          cost: 0.49,
          raw: data
        };
      }
      return { success: false, provider: 'fullenrich', reason: 'no_phone_found', cost: 0.49 };
    }

    if (status === 'failed') {
      return { success: false, provider: 'fullenrich', reason: 'enrichment_failed', cost: 0 };
    }

    // status === 'pending' → continue polling
  }

  return { success: false, provider: 'fullenrich', reason: 'timeout_polling', cost: 0 };
}
```

## Data Model

### Table: enrichment_cache

Stores successful enrichment results to avoid duplicate API calls.

```sql
CREATE TABLE enrichment_cache (
  id            SERIAL PRIMARY KEY,
  linkedin_url  VARCHAR(500) UNIQUE NOT NULL,
  phone         VARCHAR(30),
  phone_type    VARCHAR(20),
  email         VARCHAR(255),
  provider      VARCHAR(30) NOT NULL,
  enriched_at   TIMESTAMP DEFAULT NOW(),
  raw_response  JSONB
);

CREATE INDEX idx_enrichment_cache_url ON enrichment_cache(linkedin_url);
CREATE INDEX idx_enrichment_cache_email ON enrichment_cache(email);
```

### Table: enrichment_failures

Stores failed lookups with TTL to avoid retrying the same provider too soon.

```sql
CREATE TABLE enrichment_failures (
  id            SERIAL PRIMARY KEY,
  linkedin_url  VARCHAR(500) NOT NULL,
  provider      VARCHAR(30) NOT NULL,
  reason        VARCHAR(255),
  failed_at     TIMESTAMP DEFAULT NOW(),
  expires_at    TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  UNIQUE(linkedin_url, provider)
);

CREATE INDEX idx_enrichment_failures_lookup
  ON enrichment_failures(linkedin_url, provider, expires_at);
```

### Table: enrichment_log

Tracks every API call for cost reporting and auditing.

```sql
CREATE TABLE enrichment_log (
  id            SERIAL PRIMARY KEY,
  linkedin_url  VARCHAR(500) NOT NULL,
  provider      VARCHAR(30) NOT NULL,
  success       BOOLEAN NOT NULL,
  cost_eur      DECIMAL(5,2) NOT NULL DEFAULT 0,
  sdr_id        INTEGER REFERENCES sdr_profiles(id),
  client_id     INTEGER REFERENCES clients(id),
  reason        VARCHAR(255),
  response_time_ms INTEGER,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrichment_log_date ON enrichment_log(created_at);
CREATE INDEX idx_enrichment_log_sdr ON enrichment_log(sdr_id, created_at);
```

### Table: enrichment_budgets

Monthly budget allocation per client.

```sql
CREATE TABLE enrichment_budgets (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER REFERENCES clients(id),
  month         DATE NOT NULL,  -- first day of month
  budget_eur    DECIMAL(8,2) NOT NULL,
  spent_eur     DECIMAL(8,2) DEFAULT 0,
  UNIQUE(client_id, month)
);
```

## Waterfall Logic (Complete)

```javascript
async function enrichProspect(linkedinUrl, sdrId, clientId) {
  // ─── STEP 1: Deduplication Check ───
  const cached = await db.query(
    'SELECT * FROM enrichment_cache WHERE linkedin_url = $1',
    [linkedinUrl]
  );
  if (cached.rows.length > 0) {
    return {
      ...cached.rows[0],
      source: 'cache',
      cost: 0
    };
  }

  // ─── STEP 2: Daily Limit Check ───
  const todayCount = await db.query(
    `SELECT COUNT(*) FROM enrichment_log
     WHERE sdr_id = $1 AND created_at >= CURRENT_DATE AND success = true`,
    [sdrId]
  );
  const sdrRole = await getSDRRole(sdrId);
  const dailyLimit = sdrRole === 'admin' || sdrRole === 'lead' ? Infinity : 3;

  if (parseInt(todayCount.rows[0].count) >= dailyLimit) {
    return { success: false, reason: 'daily_limit_reached', cost: 0 };
  }

  // ─── STEP 3: Budget Check ───
  const budget = await db.query(
    `SELECT budget_eur, spent_eur FROM enrichment_budgets
     WHERE client_id = $1 AND month = date_trunc('month', CURRENT_DATE)`,
    [clientId]
  );
  if (budget.rows.length > 0) {
    const { budget_eur, spent_eur } = budget.rows[0];
    if (parseFloat(spent_eur) >= parseFloat(budget_eur) * 0.95) {
      return { success: false, reason: 'budget_exhausted', cost: 0 };
    }
  }

  // ─── STEP 4: Try Kaspr ───
  const kasprFailed = await db.query(
    `SELECT 1 FROM enrichment_failures
     WHERE linkedin_url = $1 AND provider = 'kaspr' AND expires_at > NOW()`,
    [linkedinUrl]
  );

  let kasprResult = null;
  if (kasprFailed.rows.length === 0) {
    const startTime = Date.now();
    kasprResult = await enrichWithKaspr(linkedinUrl);
    const responseTime = Date.now() - startTime;

    await logEnrichment(linkedinUrl, 'kaspr', kasprResult.success, kasprResult.cost, sdrId, clientId, kasprResult.reason, responseTime);

    if (kasprResult.success) {
      await cacheResult(linkedinUrl, kasprResult);
      await updateBudgetSpent(clientId, kasprResult.cost);
      return kasprResult;
    }

    await cacheFailure(linkedinUrl, 'kaspr', kasprResult.reason);
  }

  // ─── STEP 5: Try FullEnrich ───
  const fullEnrichFailed = await db.query(
    `SELECT 1 FROM enrichment_failures
     WHERE linkedin_url = $1 AND provider = 'fullenrich' AND expires_at > NOW()`,
    [linkedinUrl]
  );

  if (fullEnrichFailed.rows.length === 0) {
    const startTime = Date.now();
    const fullEnrichResult = await enrichWithFullEnrich(linkedinUrl);
    const responseTime = Date.now() - startTime;

    await logEnrichment(linkedinUrl, 'fullenrich', fullEnrichResult.success, fullEnrichResult.cost, sdrId, clientId, fullEnrichResult.reason, responseTime);

    if (fullEnrichResult.success) {
      await cacheResult(linkedinUrl, fullEnrichResult);
      await updateBudgetSpent(clientId, fullEnrichResult.cost);
      return fullEnrichResult;
    }

    await cacheFailure(linkedinUrl, 'fullenrich', fullEnrichResult.reason);
  }

  // ─── STEP 6: All Providers Failed ───
  return {
    success: false,
    provider: null,
    reason: 'no_phone_found_all_providers',
    cost: (kasprResult?.cost || 0)
  };
}
```

## Helper Functions

```javascript
async function cacheResult(linkedinUrl, result) {
  await db.query(
    `INSERT INTO enrichment_cache (linkedin_url, phone, phone_type, email, provider)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (linkedin_url) DO UPDATE SET
       phone = $2, phone_type = $3, email = $4, provider = $5, enriched_at = NOW()`,
    [linkedinUrl, result.phone, result.phone_type, result.email, result.provider]
  );
}

async function cacheFailure(linkedinUrl, provider, reason) {
  await db.query(
    `INSERT INTO enrichment_failures (linkedin_url, provider, reason, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
     ON CONFLICT (linkedin_url, provider) DO UPDATE SET
       reason = $3, failed_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'`,
    [linkedinUrl, provider, reason]
  );
}

async function logEnrichment(url, provider, success, cost, sdrId, clientId, reason, responseTime) {
  await db.query(
    `INSERT INTO enrichment_log (linkedin_url, provider, success, cost_eur, sdr_id, client_id, reason, response_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [url, provider, success, cost, sdrId, clientId, reason, responseTime]
  );
}

async function updateBudgetSpent(clientId, cost) {
  await db.query(
    `UPDATE enrichment_budgets SET spent_eur = spent_eur + $1
     WHERE client_id = $2 AND month = date_trunc('month', CURRENT_DATE)`,
    [cost, clientId]
  );
}
```

## Daily Limits

| Role | Daily enrichment limit | Configurable |
|------|----------------------|--------------|
| SDR (junior/confirmed/senior) | 3 lookups per day | Yes, via `sdr_enrichment_limits` table |
| Lead / Team Lead | Unlimited | — |
| Admin / CEO | Unlimited | — |

The limit is per SDR, not per client. It counts only successful enrichments (where an API call was made, regardless of outcome).

```sql
CREATE TABLE sdr_enrichment_limits (
  sdr_id      INTEGER REFERENCES sdr_profiles(id) PRIMARY KEY,
  daily_limit INTEGER NOT NULL DEFAULT 3
);
```

## Cost Tracking Dashboard

### Queries

```sql
-- Total cost by provider for current month
SELECT
  provider,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE success = true) AS successes,
  ROUND(COUNT(*) FILTER (WHERE success = true)::decimal / NULLIF(COUNT(*), 0) * 100, 1) AS success_rate,
  SUM(cost_eur) AS total_cost
FROM enrichment_log
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY provider;

-- Cost per client for current month
SELECT
  c.name AS client_name,
  COUNT(*) AS lookups,
  SUM(el.cost_eur) AS total_cost,
  eb.budget_eur,
  ROUND(SUM(el.cost_eur) / NULLIF(eb.budget_eur, 0) * 100, 1) AS budget_pct
FROM enrichment_log el
JOIN clients c ON c.id = el.client_id
LEFT JOIN enrichment_budgets eb ON eb.client_id = el.client_id
  AND eb.month = date_trunc('month', CURRENT_DATE)
WHERE el.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY c.name, eb.budget_eur;

-- Average cost per successfully enriched lead
SELECT
  ROUND(SUM(cost_eur) / NULLIF(COUNT(*) FILTER (WHERE success = true), 0), 2) AS avg_cost_per_lead
FROM enrichment_log
WHERE created_at >= date_trunc('month', CURRENT_DATE);
```

## Budget Alerts

| Threshold | Alert Level | Action |
|-----------|-------------|--------|
| 50% spent | Informative (blue) | Discord notification to Sales Ops |
| 80% spent | Warning (yellow) | Discord alert + reduce non-priority enrichments |
| 95% spent | Critical (red) | Discord alert to CEO + stop all enrichments for client |

```javascript
async function checkBudgetAlerts(clientId) {
  const budget = await db.query(
    `SELECT budget_eur, spent_eur FROM enrichment_budgets
     WHERE client_id = $1 AND month = date_trunc('month', CURRENT_DATE)`,
    [clientId]
  );

  if (budget.rows.length === 0) return;

  const { budget_eur, spent_eur } = budget.rows[0];
  const pct = (spent_eur / budget_eur) * 100;

  if (pct >= 95) {
    await sendDiscordAlert('critical', `Budget enrichissement a ${pct.toFixed(0)}% pour ${clientId}`);
  } else if (pct >= 80) {
    await sendDiscordAlert('warning', `Budget enrichissement a ${pct.toFixed(0)}% pour ${clientId}`);
  } else if (pct >= 50) {
    await sendDiscordAlert('info', `Budget enrichissement a ${pct.toFixed(0)}% pour ${clientId}`);
  }
}
```

## Cleanup Cron

```sql
-- Run daily at 02:00: clean up expired failure cache entries
DELETE FROM enrichment_failures WHERE expires_at < NOW();
```

## Integration Points

- **prospect-list-builder**: sends batches of LinkedIn URLs for enrichment after scoring
- **sales-kpi-tracking**: enrichment costs feed into cost-per-RDV calculations
- **client-reporting**: enrichment spend included in monthly ROI reports
- **discord-notifications**: budget alerts sent via Discord webhooks
