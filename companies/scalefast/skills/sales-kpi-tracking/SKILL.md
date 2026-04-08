---
name: sales-kpi-tracking
description: Calculate and track SDR metrics — calls/day, connect rate, conversion rate, no-show rate, pipeline value, activity score per SDR and per client
slug: sales-kpi-tracking
schema: agentcompanies/v1
tags:
  - sales
  - kpi
  - metrics
  - performance
  - dashboard
---

# Sales KPI Tracking

Skill de calcul et de suivi des metriques de performance des SDR chez ScaleFast. Ce skill alimente les dashboards, declenche les alertes automatiques et fournit les donnees aux rapports clients.

## Data Model

### Table: sdr_profiles

```sql
CREATE TABLE sdr_profiles (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  level         VARCHAR(20) NOT NULL CHECK (level IN ('junior', 'confirmed', 'senior')),
  start_date    DATE NOT NULL,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

Le champ `level` est derive automatiquement de `start_date` :
- **Junior** : anciennete < 3 mois
- **Confirmed** : anciennete entre 3 et 12 mois
- **Senior** : anciennete > 12 mois

### Table: daily_activity_logs

```sql
CREATE TABLE daily_activity_logs (
  id              SERIAL PRIMARY KEY,
  sdr_id          INTEGER REFERENCES sdr_profiles(id),
  log_date        DATE NOT NULL,
  client_id       INTEGER REFERENCES clients(id),
  total_calls     INTEGER DEFAULT 0,
  connected_calls INTEGER DEFAULT 0,
  call_duration_s INTEGER DEFAULT 0,
  emails_sent     INTEGER DEFAULT 0,
  linkedin_messages INTEGER DEFAULT 0,
  rdv_set         INTEGER DEFAULT 0,
  rdv_held        INTEGER DEFAULT 0,
  rdv_noshow      INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(sdr_id, log_date, client_id)
);
```

### Table: weekly_aggregations

```sql
CREATE TABLE weekly_aggregations (
  id              SERIAL PRIMARY KEY,
  sdr_id          INTEGER REFERENCES sdr_profiles(id),
  client_id       INTEGER REFERENCES clients(id),
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  total_calls     INTEGER,
  connected_calls INTEGER,
  avg_call_duration_s INTEGER,
  emails_sent     INTEGER,
  linkedin_messages INTEGER,
  rdv_set         INTEGER,
  rdv_held        INTEGER,
  rdv_noshow      INTEGER,
  connect_rate    DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  noshow_rate     DECIMAL(5,2),
  activity_score  DECIMAL(7,2),
  computed_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(sdr_id, client_id, week_start)
);
```

### Table: performance_alerts

```sql
CREATE TABLE performance_alerts (
  id              SERIAL PRIMARY KEY,
  sdr_id          INTEGER REFERENCES sdr_profiles(id),
  alert_type      VARCHAR(50) NOT NULL,
  metric_name     VARCHAR(50) NOT NULL,
  current_value   DECIMAL(10,2),
  target_value    DECIMAL(10,2),
  consecutive_days INTEGER DEFAULT 1,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  notified_at     TIMESTAMP,
  resolved_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

## KPI Definitions and Formulas

### 1. Calls per Day

```
calls_per_day = total_calls / working_days_in_period
```

Filtering rules:
- Calls < 10 seconds are excluded (faux numeros, messagerie immediate)
- Only count calls on business days (exclude weekends and French holidays via `french-holidays` skill)

### 2. Connect Rate

```
connect_rate = (connected_calls / total_calls) * 100
```

A call is "connected" if duration >= 10 seconds AND the prospect picked up (not voicemail). Voicemail detection: if call duration is 10-30 seconds and SDR marked it as voicemail, exclude from connected count.

### 3. Conversion Rate (Call to RDV)

```
conversion_rate = (rdv_set / connected_calls) * 100
```

An RDV counts as "set" only when confirmed in the client's calendar. Provisional RDV (verbal agreement without calendar invite sent) are tracked separately as `rdv_pending`.

### 4. No-Show Rate

```
noshow_rate = (rdv_noshow / (rdv_held + rdv_noshow)) * 100
```

Calculated on a rolling 7-day window to smooth daily variance. An RDV is a no-show if the prospect did not show up within 10 minutes of the scheduled time and did not reschedule within 24 hours.

### 5. Pipeline Value

```
pipeline_value = SUM(deal_value * stage_probability)
```

Stage probabilities:
| Stage | Probability |
|-------|-------------|
| RDV scheduled | 10% |
| RDV held | 25% |
| Proposal sent | 50% |
| Negotiation | 75% |
| Verbal agreement | 90% |
| Signed | 100% |

### 6. Average Deal Cycle

```
avg_deal_cycle = AVG(date_signed - date_first_contact) -- in calendar days
```

Computed only on deals that reached "Signed" status. Segmented by client vertical for benchmarking.

### 7. Activity Score

```
activity_score = (calls * 1.0) + (emails_sent * 0.5) + (linkedin_messages * 0.3)
```

This weighted composite normalizes multi-channel activity into a single comparable metric. Updated daily per SDR.

## Benchmarks by SDR Level

| Metric | Junior (<3 months) | Confirmed (3-12 months) | Senior (12+ months) |
|--------|---------------------|-------------------------|---------------------|
| Calls/day | 60+ | 80+ | 100+ |
| Connect rate | > 15% | > 20% | > 25% |
| Conversion rate (call to RDV) | > 8% | > 12% | > 15% |
| No-show rate | < 25% | < 20% | < 15% |
| Activity score/day | > 70 | > 100 | > 130 |
| Avg call duration (connected) | > 1.5 min | > 2 min | > 2.5 min |

## Alert Rules

Alerts are triggered when performance drops below thresholds for consecutive business days.

### Trigger Conditions

| Alert | Condition | Recipients | Channel |
|-------|-----------|------------|---------|
| Low call volume | < 70% of level target for 3 consecutive days | Sales Ops Manager | Discord #alerts-performance |
| Low connect rate | < 70% of level target for 3 consecutive days | Sales Ops Manager | Discord #alerts-performance |
| Low conversion | < 70% of level target for 5 consecutive days | Sales Ops Manager, CEO | Discord #alerts-performance |
| High no-show | > 130% of level target for 7 days (rolling) | Sales Ops Manager, CEO | Discord #alerts-performance |
| Zero activity | 0 calls logged for 1 business day | Sales Ops Manager | Discord #alerts-performance |

### Alert Lifecycle

```
1. DETECTION  : daily cron at 18h00 computes metrics for the day
2. EVALUATION : compare against SDR level benchmarks
3. CHECK      : query consecutive_days from performance_alerts table
4. TRIGGER    : if threshold breached, increment consecutive_days
                if consecutive_days >= required_days → fire alert
5. NOTIFY     : send Discord notification via discord-notifications skill
6. TRACK      : insert/update performance_alerts row with status='open'
7. RESOLVE    : when metric returns above threshold → status='resolved', set resolved_at
```

### Example Alert Flow

SDR "Marie" (Junior level, target: 60 calls/day):
- Monday: 38 calls → 63% of target → consecutive_days = 1
- Tuesday: 42 calls → 70% of target → at threshold, no alert
- Wednesday: 35 calls → 58% of target → consecutive_days = 2
- Thursday: 30 calls → 50% of target → consecutive_days = 3 → ALERT FIRED
- Friday: 65 calls → 108% of target → alert resolved

## Dashboard Views

### Per-SDR Dashboard

Displays:
- Today's live metrics (calls, connects, RDV) with progress bars toward daily target
- Week-to-date aggregates vs weekly target
- Activity score trend (last 4 weeks, sparkline)
- Recent alerts (open/resolved)

### Per-Client Dashboard

Displays:
- All SDRs assigned to client with individual metrics
- Client funnel: leads contacted → qualified → RDV set → RDV held → deal
- Week-over-week comparison table with delta arrows
- Cost per RDV: (enrichment cost + SDR time cost) / RDV held

### Per-Campaign Dashboard

Displays:
- Campaign metadata: client, ICP, start date, SDRs assigned
- Funnel specific to this campaign's prospect list
- Best/worst performing segments (by industry, title, company size)

## Trend Analysis

### Week-over-Week (WoW)

```sql
SELECT
  w1.week_start,
  w1.connect_rate AS current_rate,
  w2.connect_rate AS previous_rate,
  ROUND(((w1.connect_rate - w2.connect_rate) / NULLIF(w2.connect_rate, 0)) * 100, 1) AS wow_change_pct
FROM weekly_aggregations w1
LEFT JOIN weekly_aggregations w2
  ON w1.sdr_id = w2.sdr_id
  AND w1.client_id = w2.client_id
  AND w1.week_start = w2.week_start + INTERVAL '7 days'
WHERE w1.sdr_id = $1
ORDER BY w1.week_start DESC
LIMIT 12;
```

### Month-over-Month (MoM)

Aggregated from weekly_aggregations grouped by calendar month. Used in monthly client reports.

### Sparkline Data

Return the last 8 data points (weeks) for any metric as an array for front-end sparkline rendering:

```json
{
  "sdr_id": 12,
  "metric": "connect_rate",
  "data": [18.2, 19.1, 17.5, 20.3, 21.0, 19.8, 22.1, 23.4],
  "trend": "up",
  "wow_change": "+1.3%"
}
```

## Aggregation Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| daily_metrics | Every day at 23:59 (CET) | Finalize daily_activity_logs for the day |
| weekly_rollup | Every Monday at 01:00 (CET) | Compute weekly_aggregations from daily logs |
| monthly_rollup | 1st of each month at 02:00 (CET) | Compute monthly stats from weekly aggregations |
| alert_check | Every business day at 18:00 (CET) | Evaluate alert rules against daily metrics |

## Integration Points

- **discord-notifications**: receives alert payloads for performance alerts and daily recaps
- **client-reporting**: pulls aggregated KPIs for weekly/monthly reports
- **call-analysis**: call quality scores feed back into SDR performance profiles
- **french-holidays**: used to determine working days for calls/day calculation
